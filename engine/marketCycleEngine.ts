import { BarData, CyclePhase, CycleState, FlowAndGex } from './types.ts';

export interface EvaluationDetails {
  state: CycleState;
  baseAtr: number;
  avgAtr: number;
  atrRatio: number;
  isContracted: boolean;
  baseHigh: number;
  baseLow: number;
  currentClose: number;
  rvol: number;
  isBreakout: boolean;
  hasDpBed: boolean;
  flowSkew: number;
  fib1618: number;
  callWall: number | null;
  target: number;
  upperWickRatio: number;
  exhaustionSignals: string[];
}

export class MarketCycleEngine {
  private massiveApiKey: string;
  private uwApiKey: string;
  private massiveBase = 'https://api.massive.com/v1';
  private uwBase = 'https://api.unusualwhales.com/api';

  constructor(massiveApiKey = '', uwApiKey = '') {
    this.massiveApiKey = massiveApiKey;
    this.uwApiKey = uwApiKey;
  }

  /**
   * Calculate Average True Range (ATR) over period (default: 14)
   */
  public calculateATR(bars: BarData[], period = 14): number[] {
    if (bars.length === 0) return [];
    const tr: number[] = [];

    for (let i = 0; i < bars.length; i++) {
      if (i === 0) {
        tr.push(bars[i].high - bars[i].low);
      } else {
        const prevClose = bars[i - 1].close;
        const hl = bars[i].high - bars[i].low;
        const hc = Math.abs(bars[i].high - prevClose);
        const lc = Math.abs(bars[i].low - prevClose);
        tr.push(Math.max(hl, hc, lc));
      }
    }

    // Rolling simple mean of TR over period
    const atr: number[] = [];
    for (let i = 0; i < tr.length; i++) {
      if (i < period - 1) {
        // Average up to current index
        const sub = tr.slice(0, i + 1);
        atr.push(sub.reduce((a, b) => a + b, 0) / sub.length);
      } else {
        const sub = tr.slice(i - period + 1, i + 1);
        atr.push(sub.reduce((a, b) => a + b, 0) / period);
      }
    }
    return atr;
  }

  /**
   * Detects the start of an uptick cycle:
   * 1. Volatility compression base (base ATR < avg ATR * 0.85)
   * 2. Break of Structure (BOS) on expanding RVOL (>= 1.75)
   * 3. Dark pool support bed validation (within 0.75% of base)
   * 4. Bullish call flow acceleration (skew >= 1.8)
   */
  public identifyUptickInception(
    bars5m: BarData[],
    dpLevels: number[],
    flowSkew: number
  ): {
    isStart: boolean;
    baseLow: number;
    baseHigh: number;
    reasons: string[];
    debug: {
      baseAtr: number;
      avgAtr: number;
      atrRatio: number;
      isContracted: boolean;
      rvol: number;
      isBreakout: boolean;
      hasDpBed: boolean;
    };
  } {
    const emptyDebug = {
      baseAtr: 0,
      avgAtr: 0,
      atrRatio: 0,
      isContracted: false,
      rvol: 0,
      isBreakout: false,
      hasDpBed: false,
    };

    if (bars5m.length < 15) {
      return { isStart: false, baseLow: 0, baseHigh: 0, reasons: ['Need at least 15 bars'], debug: emptyDebug };
    }

    const reasons: string[] = [];
    const atr = this.calculateATR(bars5m, 14);

    // 1. Base Contraction: bars[-4:-1] (last 3 completed base bars)
    const baseSlice = atr.slice(-4, -1);
    const baseAtr = baseSlice.reduce((a, b) => a + b, 0) / (baseSlice.length || 1);

    // 20-period rolling avg ATR at last bar
    const rolling20AtrSlice = atr.slice(-20);
    const avgAtr = rolling20AtrSlice.reduce((a, b) => a + b, 0) / rolling20AtrSlice.length;
    const isContracted = baseAtr < avgAtr * 0.85;

    // 2. Break of Structure (BOS)
    // base_high = df_5m["high"].iloc[-5:-1].max()
    const prior4Bars = bars5m.slice(-5, -1);
    const baseHigh = Math.max(...prior4Bars.map((b) => b.high));
    const baseLow = Math.min(...prior4Bars.map((b) => b.low));

    const currentBar = bars5m[bars5m.length - 1];
    const currentClose = currentBar.close;
    const currentVol = currentBar.volume;

    const vol20Slice = bars5m.slice(-20).map((b) => b.volume);
    const avgVol = vol20Slice.reduce((a, b) => a + b, 0) / vol20Slice.length;
    const rvol = avgVol > 0 ? currentVol / avgVol : 1.0;

    const isBreakout = currentClose > baseHigh && rvol >= 1.75;

    // 3. Dark Pool Bed Check (within 0.75% of base)
    // has_dp_bed = any(base_low * 0.9925 <= lvl <= current_close for lvl in dp_levels)
    const hasDpBed = dpLevels.some((lvl) => lvl >= baseLow * 0.9925 && lvl <= currentClose);

    const debug = {
      baseAtr,
      avgAtr,
      atrRatio: avgAtr > 0 ? baseAtr / avgAtr : 1,
      isContracted,
      rvol,
      isBreakout,
      hasDpBed,
    };

    if (!isContracted || !isBreakout) {
      return { isStart: false, baseLow, baseHigh, reasons: [], debug };
    }

    reasons.push(`Base Volatility Contraction (${baseAtr.toFixed(2)} ATR < 85% of ${avgAtr.toFixed(2)}) followed by BOS`);
    reasons.push(`Volume Surge RVOL: ${rvol.toFixed(2)}x (Threshold: 1.75x)`);

    if (hasDpBed) {
      reasons.push('Anchored above Institutional Dark Pool Cluster ($500k+ block support)');
    }

    // 4. Unusual Whales Flow Check
    if (flowSkew >= 1.8) {
      reasons.push(`Call Sweep Skew: ${flowSkew.toFixed(2)}x Ask Premium Velocity`);
    } else {
      return { isStart: false, baseLow, baseHigh, reasons: [`Flow skew insufficient (${flowSkew.toFixed(2)}x < 1.8x)`], debug };
    }

    return { isStart: true, baseLow, baseHigh, reasons, debug };
  }

  /**
   * Detects exhaustion or calculates the terminal cycle ceiling:
   * 1. GEX Call Wall resistance
   * 2. 1.618 Fibonacci expansion exhaustion
   * 3. Climax volume churn or flow divergence
   */
  public identifyCycleHighEnd(
    currentPrice: number,
    baseLow: number,
    baseHigh: number,
    bars5m: BarData[],
    callWall: number | null,
    flowSkew: number
  ): {
    isExhausted: boolean;
    cycleTarget: number;
    exhaustionSignals: string[];
    fib1618: number;
    rvol: number;
    upperWickRatio: number;
  } {
    const exhaustionSignals: string[] = [];

    // 1. Mathematical Fib Expansion Target
    const delta = baseHigh - baseLow;
    const fib1618 = baseHigh + 1.618 * delta;

    // 2. Candidate targets
    const targetCandidates = [fib1618];
    if (callWall !== null && callWall > currentPrice) {
      targetCandidates.push(callWall);
    }
    const cycleTarget = Math.min(...targetCandidates);

    // 3. Real-Time Peak Exhaustion Conditions
    const currentBar = bars5m[bars5m.length - 1];
    const currentVol = currentBar.volume;

    const vol20Slice = bars5m.slice(-20).map((b) => b.volume);
    const avgVol = vol20Slice.reduce((a, b) => a + b, 0) / vol20Slice.length;
    const rvol = currentVol / (avgVol + 1e-6);

    const candleRange = Math.max(0.001, currentBar.high - currentBar.low);
    const bodyTop = Math.max(currentBar.open, currentBar.close);
    const upperWick = currentBar.high - bodyTop;
    const upperWickRatio = upperWick / candleRange;

    // Climax Churn: Massive volume with high rejection wick near target
    if (currentPrice >= cycleTarget * 0.995) {
      exhaustionSignals.push(`Price reached Cycle Ceiling Zone (~$${cycleTarget.toFixed(2)})`);
    }

    if (rvol > 2.8 && upperWickRatio > 0.4) {
      exhaustionSignals.push(`Volume Climax & Distribution Wick (${(upperWickRatio * 100).toFixed(0)}% upper wick, ${rvol.toFixed(1)}x RVOL)`);
    }

    if (flowSkew < 0.7) {
      exhaustionSignals.push(`Flow Divergence: Put aggression taking over at highs (${flowSkew.toFixed(2)}x skew)`);
    }

    const isExhausted = exhaustionSignals.length >= 2;
    return {
      isExhausted,
      cycleTarget,
      exhaustionSignals,
      fib1618,
      rvol,
      upperWickRatio,
    };
  }

  /**
   * Run full state machine execution matching evaluate_cycle
   */
  public evaluateCycle(
    ticker: string,
    bars5m: BarData[],
    marketData: FlowAndGex
  ): EvaluationDetails {
    if (bars5m.length < 20) {
      const state: CycleState = {
        ticker,
        phase: CyclePhase.NEUTRAL,
        entry_price: null,
        invalidation_level: null,
        cycle_target: null,
        real_rrr: 0.0,
        evidence: ['Insufficient Bar Data (requires >= 20 bars)'],
      };
      return {
        state,
        baseAtr: 0,
        avgAtr: 0,
        atrRatio: 0,
        isContracted: false,
        baseHigh: 0,
        baseLow: 0,
        currentClose: 0,
        rvol: 0,
        isBreakout: false,
        hasDpBed: false,
        flowSkew: marketData.net_delta_skew,
        fib1618: 0,
        callWall: marketData.call_wall,
        target: 0,
        upperWickRatio: 0,
        exhaustionSignals: [],
      };
    }

    const currentBar = bars5m[bars5m.length - 1];
    const currentPrice = currentBar.close;

    // Step 1: Detect Uptick Cycle Start
    const inception = this.identifyUptickInception(
      bars5m,
      marketData.dp_levels,
      marketData.net_delta_skew
    );

    if (inception.isStart) {
      const exhaustion = this.identifyCycleHighEnd(
        currentPrice,
        inception.baseLow,
        inception.baseHigh,
        bars5m,
        marketData.call_wall,
        marketData.net_delta_skew
      );

      const stopLoss = inception.baseLow * 0.9985;
      const risk = currentPrice - stopLoss;
      const reward = exhaustion.cycleTarget - currentPrice;
      const realRrr = risk > 0 ? reward / risk : 0.0;

      const evidence = [...inception.reasons];

      // Expectancy Gate: real_rrr >= 2.5
      if (realRrr >= 2.5) {
        evidence.push(`Verified Asymmetric RRR: ${realRrr.toFixed(2)}:1 (Min threshold: 2.5:1)`);
        const state: CycleState = {
          ticker,
          phase: CyclePhase.UPTICK_START,
          entry_price: Number(currentPrice.toFixed(2)),
          invalidation_level: Number(stopLoss.toFixed(2)),
          cycle_target: Number(exhaustion.cycleTarget.toFixed(2)),
          real_rrr: Number(realRrr.toFixed(2)),
          evidence,
        };
        return {
          state,
          baseAtr: inception.debug.baseAtr,
          avgAtr: inception.debug.avgAtr,
          atrRatio: inception.debug.atrRatio,
          isContracted: inception.debug.isContracted,
          baseHigh: inception.baseHigh,
          baseLow: inception.baseLow,
          currentClose: currentPrice,
          rvol: inception.debug.rvol,
          isBreakout: inception.debug.isBreakout,
          hasDpBed: inception.debug.hasDpBed,
          flowSkew: marketData.net_delta_skew,
          fib1618: exhaustion.fib1618,
          callWall: marketData.call_wall,
          target: exhaustion.cycleTarget,
          upperWickRatio: exhaustion.upperWickRatio,
          exhaustionSignals: exhaustion.exhaustionSignals,
        };
      }
    }

    // Step 2: Check for Cycle High End (Exhaustion of active cycle)
    const morningLow = Math.min(...bars5m.map((b) => b.low));
    const morningHigh = Math.max(...bars5m.map((b) => b.high));

    const highEnd = this.identifyCycleHighEnd(
      currentPrice,
      morningLow,
      morningHigh,
      bars5m,
      marketData.call_wall,
      marketData.net_delta_skew
    );

    if (highEnd.isExhausted) {
      const state: CycleState = {
        ticker,
        phase: CyclePhase.CYCLE_HIGH_END,
        entry_price: Number(currentPrice.toFixed(2)),
        invalidation_level: Number((morningHigh * 1.002).toFixed(2)),
        cycle_target: Number((currentPrice * 0.98).toFixed(2)),
        real_rrr: 0.0,
        evidence: highEnd.exhaustionSignals,
      };
      return {
        state,
        baseAtr: inception.debug.baseAtr,
        avgAtr: inception.debug.avgAtr,
        atrRatio: inception.debug.atrRatio,
        isContracted: inception.debug.isContracted,
        baseHigh: morningHigh,
        baseLow: morningLow,
        currentClose: currentPrice,
        rvol: highEnd.rvol,
        isBreakout: false,
        hasDpBed: inception.debug.hasDpBed,
        flowSkew: marketData.net_delta_skew,
        fib1618: highEnd.fib1618,
        callWall: marketData.call_wall,
        target: highEnd.cycleTarget,
        upperWickRatio: highEnd.upperWickRatio,
        exhaustionSignals: highEnd.exhaustionSignals,
      };
    }

    // Default: Neutral / Consolidating
    const state: CycleState = {
      ticker,
      phase: CyclePhase.NEUTRAL,
      entry_price: null,
      invalidation_level: null,
      cycle_target: null,
      real_rrr: 0.0,
      evidence: ['Consolidating / In-Cycle (No trigger conditions met)'],
    };

    return {
      state,
      baseAtr: inception.debug.baseAtr,
      avgAtr: inception.debug.avgAtr,
      atrRatio: inception.debug.atrRatio,
      isContracted: inception.debug.isContracted,
      baseHigh: inception.baseHigh,
      baseLow: inception.baseLow,
      currentClose: currentPrice,
      rvol: inception.debug.rvol,
      isBreakout: inception.debug.isBreakout,
      hasDpBed: inception.debug.hasDpBed,
      flowSkew: marketData.net_delta_skew,
      fib1618: highEnd.fib1618,
      callWall: marketData.call_wall,
      target: highEnd.cycleTarget,
      upperWickRatio: highEnd.upperWickRatio,
      exhaustionSignals: highEnd.exhaustionSignals,
    };
  }
}
