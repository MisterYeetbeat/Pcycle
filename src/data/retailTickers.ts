import { BarData, RetailTicker, TradePlan } from '../types.ts';
import { getNinetyDayData } from './ninetyDayTriggers.ts';
import { SHORTY_50_TICKERS } from './shortyUniverse50.ts';

// Helper to generate realistic 5-min candles
function generateCandles(
  basePrice: number,
  type: 'breakout_long' | 'climax_exit' | 'accumulation' | 'consolidation',
  scale = 1.0
): BarData[] {
  const bars: BarData[] = [];
  const baseTime = new Date('2026-09-28T09:30:00-04:00').getTime();
  let price = basePrice;

  for (let i = 0; i < 30; i++) {
    const timeStr = new Date(baseTime + i * 5 * 60000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let open = price;
    let high = price;
    let low = price;
    let close = price;
    let volume = 50000 + Math.floor(Math.sin(i * 0.3) * 15000);

    if (type === 'breakout_long') {
      if (i < 24) {
        open = basePrice + (i % 4) * 0.05 * scale;
        close = open + ((i % 2 === 0 ? 1 : -1) * 0.04 * scale);
        high = Math.max(open, close) + 0.04 * scale;
        low = Math.min(open, close) - 0.04 * scale;
        volume = 45000 + (i % 3) * 5000;
      } else if (i < 28) {
        open = basePrice + (0.15 + (i - 24) * 0.04) * scale;
        close = open + 0.03 * scale;
        high = open + 0.05 * scale;
        low = open - 0.03 * scale;
        volume = 38000;
      } else if (i === 28) {
        open = basePrice + 0.35 * scale;
        close = basePrice + 0.42 * scale;
        high = close + 0.05 * scale;
        low = open - 0.03 * scale;
        volume = 80000;
      } else {
        open = basePrice + 0.42 * scale;
        close = basePrice + 1.15 * scale;
        high = close + 0.12 * scale;
        low = open - 0.04 * scale;
        volume = 195000;
      }
    } else if (type === 'climax_exit') {
      if (i < 24) {
        const prog = i / 24;
        open = basePrice + prog * 12 * scale;
        close = open + 0.4 * scale;
        high = close + 0.2 * scale;
        low = open - 0.15 * scale;
        volume = 90000 + i * 4000;
      } else if (i < 28) {
        open = basePrice + 12.8 * scale;
        close = basePrice + 13.4 * scale;
        high = close + 0.5 * scale;
        low = open - 0.3 * scale;
        volume = 120000;
      } else {
        open = basePrice + 14.1 * scale;
        high = basePrice + 15.6 * scale;
        close = basePrice + 13.9 * scale;
        low = basePrice + 13.6 * scale;
        volume = 340000;
      }
    } else if (type === 'accumulation') {
      open = basePrice + Math.sin(i * 0.4) * 0.6 * scale;
      close = open + Math.cos(i * 0.4) * 0.5 * scale;
      high = Math.max(open, close) + 0.3 * scale;
      low = Math.min(open, close) - 0.3 * scale;
      volume = 65000;
    } else {
      open = basePrice + ((i % 5) - 2) * 0.3 * scale;
      close = open + 0.1 * scale;
      high = open + 0.4 * scale;
      low = open - 0.4 * scale;
      volume = 55000;
    }

    price = close;
    bars.push({
      timestamp: timeStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round(volume),
    });
  }

  return bars;
}

function buildTicker(
  symbol: string,
  name: string,
  price: number,
  changePercent: number,
  volumeRatio: number,
  signal: any,
  setupGrade: any,
  rrr: number,
  shortInterestPct: number,
  daysToCover: number,
  whaleFlowBullishPct: number,
  callWall: number | null,
  darkPoolBed: number | null,
  candleType: 'breakout_long' | 'climax_exit' | 'accumulation' | 'consolidation',
  scale = 1.0
): RetailTicker {
  const { bars: ninetyDayBars, triggers: ninetyDayTriggers, accuracyRate, currentState } =
    getNinetyDayData(symbol, price);

  return {
    symbol,
    name,
    price,
    changePercent,
    volumeRatio,
    signal,
    setupGrade,
    rrr,
    shortInterestPct,
    daysToCover,
    whaleFlowBullishPct,
    callWall,
    darkPoolBed,
    bars: generateCandles(price * 0.96, candleType, scale),
    ninetyDayBars,
    ninetyDayTriggers,
    triggerAccuracyRate: accuracyRate,
    currentTriggerState: currentState,
  };
}

// 1. Current Market Real-Time Prices (Live market verified across 56 Shorty universe tickers)
export const CURRENT_MARKET_TICKERS: RetailTicker[] = SHORTY_50_TICKERS;

// 2. Historical Catalog Study (from user's si_series_full.json and early shorty events)
export const HISTORICAL_CATALOG_TICKERS: RetailTicker[] = [
  buildTicker(
    'AAOI',
    'Applied Optoelectronics (Catalog Base)',
    15.25,
    7.85,
    3.2,
    'STRONG_BUY',
    'A+',
    3.65,
    28.4,
    6.2,
    84,
    18.0,
    14.15,
    'breakout_long',
    1.0
  ),
  buildTicker(
    'NVDA',
    'NVIDIA Corporation (Post-Split Base)',
    144.8,
    -1.25,
    3.4,
    'TAKE_PROFIT',
    'A',
    0.0,
    1.8,
    1.1,
    32,
    145.0,
    138.0,
    'climax_exit',
    1.0
  ),
  buildTicker(
    'GME',
    'GameStop Corp (Squeeze Cycle)',
    25.8,
    6.4,
    2.8,
    'STRONG_BUY',
    'A+',
    4.15,
    31.2,
    5.8,
    88,
    32.0,
    24.5,
    'breakout_long',
    1.0
  ),
  buildTicker(
    'TSLA',
    'Tesla Inc (Compression Cycle)',
    214.5,
    0.45,
    0.95,
    'ACCUMULATING',
    'B',
    2.1,
    3.4,
    1.9,
    56,
    230.0,
    211.0,
    'accumulation',
    1.0
  ),
  buildTicker(
    'PLTR',
    'Palantir Technologies (Early Breakout)',
    37.4,
    4.8,
    2.4,
    'STRONG_BUY',
    'A',
    3.1,
    5.2,
    2.4,
    78,
    42.0,
    35.8,
    'breakout_long',
    1.0
  ),
  buildTicker(
    'AMD',
    'Advanced Micro Devices (Range)',
    156.2,
    -0.2,
    1.1,
    'NEUTRAL',
    'WATCH',
    1.5,
    2.6,
    1.4,
    51,
    165.0,
    152.0,
    'consolidation',
    1.0
  ),
];

export const RETAIL_TICKERS = CURRENT_MARKET_TICKERS;

export function getTradePlan(ticker: RetailTicker): TradePlan {
  const currentPrice = ticker.price;

  if (ticker.signal === 'STRONG_BUY') {
    const stopLoss = Number((ticker.darkPoolBed ? ticker.darkPoolBed * 0.995 : currentPrice * 0.96).toFixed(2));
    const target1 = Number((ticker.callWall ? ticker.callWall * 0.98 : currentPrice * 1.12).toFixed(2));
    const target2 = Number((ticker.callWall ? ticker.callWall * 1.08 : currentPrice * 1.22).toFixed(2));
    const risk = currentPrice - stopLoss;
    const reward = target1 - currentPrice;
    const rrr = risk > 0 ? Number((reward / risk).toFixed(2)) : 3.0;

    return {
      signal: 'STRONG_BUY',
      signalTitle: 'Institutional Breakout Confirmed',
      badgeText: 'BUY SIGNAL',
      actionSummary: `Enter long at market (~$${currentPrice.toFixed(2)}). Whales are supporting at $${stopLoss.toFixed(2)} with clean upside towards the $${target1.toFixed(2)} target.`,
      direction: 'LONG',
      entryPrice: currentPrice,
      stopLoss,
      target1,
      target2,
      rrr,
      riskPercent: Number((((currentPrice - stopLoss) / currentPrice) * 100).toFixed(1)),
      rewardPercent: Number((((target1 - currentPrice) / currentPrice) * 100).toFixed(1)),
      confidenceScore: ticker.setupGrade === 'A+' ? 94 : 88,
      whaleSupportLevel: ticker.darkPoolBed,
      resistanceCeiling: ticker.callWall,
      reasons: [
        `Whale call flow is ${ticker.whaleFlowBullishPct}% bullish at the ask`,
        `Heavy volume surge (${ticker.volumeRatio.toFixed(1)}x normal volume)`,
        `Anchored above Dark Pool floor at $${(ticker.darkPoolBed ?? stopLoss).toFixed(2)}`,
        ticker.shortInterestPct && ticker.shortInterestPct > 15
          ? `High Short Interest (${ticker.shortInterestPct}% of float) fuels squeeze continuation`
          : `Clean breakout past consolidation resistance`,
      ],
    };
  }

  if (ticker.signal === 'TAKE_PROFIT') {
    const targetExit = Number((currentPrice * 0.98).toFixed(2));
    return {
      signal: 'TAKE_PROFIT',
      signalTitle: 'Cycle Ceiling / Climax Rejection',
      badgeText: 'TAKE PROFIT',
      actionSummary: `Lock in profits or tighten stop. Price touched the $${ticker.callWall ?? currentPrice} resistance ceiling and rejected on heavy climax selling.`,
      direction: 'EXIT',
      entryPrice: currentPrice,
      stopLoss: Number((currentPrice * 1.01).toFixed(2)),
      target1: targetExit,
      target2: Number((currentPrice * 0.94).toFixed(2)),
      rrr: 0,
      riskPercent: 1.0,
      rewardPercent: 4.5,
      confidenceScore: 91,
      whaleSupportLevel: ticker.darkPoolBed,
      resistanceCeiling: ticker.callWall,
      reasons: [
        `Hit major Call Wall resistance ($${ticker.callWall?.toFixed(2) ?? 'ceiling'})`,
        `Long upper rejection wick (sellers pushed price down from highs)`,
        `Smart money flow diverged into put aggression (only ${ticker.whaleFlowBullishPct}% bullish)`,
        `Volume climax exhaustion: ${ticker.volumeRatio.toFixed(1)}x surge at top`,
      ],
    };
  }

  if (ticker.signal === 'ACCUMULATING') {
    return {
      signal: 'ACCUMULATING',
      signalTitle: 'Whales Accumulating Base',
      badgeText: 'ACCUMULATING',
      actionSummary: `Price is coiling in a tight consolidation floor. Watch for volume surge above resistance to confirm buy entry.`,
      direction: 'FLAT',
      entryPrice: currentPrice,
      stopLoss: Number((currentPrice * 0.97).toFixed(2)),
      target1: Number((ticker.callWall ?? currentPrice * 1.08).toFixed(2)),
      target2: Number((currentPrice * 1.15).toFixed(2)),
      rrr: ticker.rrr,
      riskPercent: 3.0,
      rewardPercent: 7.5,
      confidenceScore: 74,
      whaleSupportLevel: ticker.darkPoolBed,
      resistanceCeiling: ticker.callWall,
      reasons: [
        `Volatility is compressed (coiling for expansion)`,
        `Holding Dark Pool support at $${ticker.darkPoolBed?.toFixed(2) ?? currentPrice.toFixed(2)}`,
        `Awaiting volume expansion trigger (currently ${ticker.volumeRatio.toFixed(1)}x)`,
      ],
    };
  }

  return {
    signal: 'NEUTRAL',
    signalTitle: 'Consolidating / No Clear Edge',
    badgeText: 'WAIT / CHOP',
    actionSummary: `No active institutional setup detected. Conserve capital and wait for high-conviction breakout signals.`,
    direction: 'FLAT',
    entryPrice: currentPrice,
    stopLoss: Number((currentPrice * 0.98).toFixed(2)),
    target1: Number((currentPrice * 1.04).toFixed(2)),
    target2: Number((currentPrice * 1.08).toFixed(2)),
    rrr: ticker.rrr,
    riskPercent: 2.0,
    rewardPercent: 4.0,
    confidenceScore: 50,
    whaleSupportLevel: ticker.darkPoolBed,
    resistanceCeiling: ticker.callWall,
    reasons: [
      `Volume is below breakout threshold (${ticker.volumeRatio.toFixed(1)}x normal)`,
      `Mixed institutional flow (${ticker.whaleFlowBullishPct}% flow)`,
      `No defined Break of Structure`,
    ],
  };
}
