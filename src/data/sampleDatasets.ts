import { BarData, FlowAndGex, ShortyEvent, ShortInterestRecord } from '../types.ts';

export interface TestScenario {
  id: string;
  name: string;
  ticker: string;
  expectedPhase: string;
  description: string;
  bars: BarData[];
  marketData: FlowAndGex;
  shortyMeta?: {
    siFloat: number;
    dtc: number;
    feeRate: string;
    coilOn: boolean;
    relvol: number;
  };
}

// Generate realistic 5m intraday bars
function generateBars(
  startPrice: number,
  pattern: 'uptick_breakout' | 'climax_exhaustion' | 'compression_neutral' | 'short_squeeze'
): BarData[] {
  const bars: BarData[] = [];
  let price = startPrice;
  const baseTime = new Date('2026-09-28T09:30:00-04:00').getTime();

  for (let i = 0; i < 28; i++) {
    const timeStr = new Date(baseTime + i * 5 * 60000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let open = price;
    let high = price;
    let low = price;
    let close = price;
    let volume = 80000 + Math.floor(Math.sin(i * 0.4) * 20000);

    if (pattern === 'uptick_breakout') {
      if (i < 20) {
        // Tight consolidation base between 14.10 and 14.40
        open = 14.15 + (i % 3) * 0.08;
        close = open + ((i % 2 === 0 ? 1 : -1) * 0.05);
        high = Math.max(open, close) + 0.04;
        low = Math.min(open, close) - 0.04;
        volume = 75000 + (i % 4) * 5000;
      } else if (i < 26) {
        // Volatility compression (tight ATR)
        open = 14.25 + (i - 20) * 0.02;
        close = open + 0.03;
        high = open + 0.05;
        low = open - 0.03;
        volume = 60000; // Low volume compression
      } else if (i === 26) {
        // Preparation bar
        open = 14.38;
        close = 14.42;
        high = 14.45;
        low = 14.35;
        volume = 90000;
      } else {
        // Current bar: BREAK OF STRUCTURE (BOS) above base high 14.45!
        // RVOL >= 1.75x
        open = 14.44;
        close = 15.02; // Clean break above base_high
        high = 15.10;
        low = 14.40;
        volume = 210000; // 210k vs ~80k avg = 2.6x RVOL
      }
    } else if (pattern === 'climax_exhaustion') {
      if (i < 24) {
        // Markup rally from 130 to 144
        const progress = i / 24;
        open = 130 + progress * 14;
        close = open + 0.5;
        high = close + 0.3;
        low = open - 0.2;
        volume = 120000 + i * 5000;
      } else if (i < 27) {
        open = 144.5;
        close = 145.2;
        high = 145.6;
        low = 144.1;
        volume = 150000;
      } else {
        // Current bar: Massive Climax churn & distribution wick
        // Touches GEX Call Wall at 145.80 and rejects with long upper shadow > 40%
        open = 145.20;
        high = 146.50;
        close = 144.80; // Rejection wick!
        low = 144.30;
        // Candle range = 146.50 - 144.30 = 2.20
        // Upper wick = 146.50 - 145.20 = 1.30 (59% of candle range!)
        volume = 480000; // 3.4x RVOL!
      }
    } else if (pattern === 'compression_neutral') {
      // In base, no breakout yet
      open = 210 + Math.sin(i * 0.5) * 1.5;
      close = open + Math.cos(i * 0.5) * 1.2;
      high = Math.max(open, close) + 0.8;
      low = Math.min(open, close) - 0.8;
      volume = 95000;
    } else {
      // Short squeeze breakout
      if (i < 24) {
        open = 24.2 + (i % 4) * 0.15;
        close = open + 0.08;
        high = open + 0.2;
        low = open - 0.1;
        volume = 85000;
      } else {
        open = 24.8;
        close = 26.5;
        high = 26.8;
        low = 24.7;
        volume = 320000;
      }
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

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'aaoi-breakout',
    name: 'AAOI - Short Squeeze / Uptick Inception (Shorty Catalog)',
    ticker: 'AAOI',
    expectedPhase: 'UPTICK_START',
    description:
      'Volatility compression base with Dark Pool block support at $14.15, Break of Structure on 2.6x RVOL, and 2.45x Call Sweep skew. Expectancy RRR >= 3.2:1.',
    bars: generateBars(14.1, 'uptick_breakout'),
    marketData: {
      call_wall: 18.0,
      dp_levels: [14.15, 14.25, 14.3],
      call_ask_premium: 1250000,
      net_delta_skew: 2.45,
    },
    shortyMeta: {
      siFloat: 28.4,
      dtc: 6.2,
      feeRate: '12.5%',
      coilOn: true,
      relvol: 2.6,
    },
  },
  {
    id: 'nvda-exhaustion',
    name: 'NVDA - Cycle Ceiling & Climax Distribution',
    ticker: 'NVDA',
    expectedPhase: 'CYCLE_HIGH_END',
    description:
      'Price pinned against $145 Call Wall with 59% upper rejection wick, 3.4x Climax RVOL, and Put flow takeover (skew flipped down to 0.52x).',
    bars: generateBars(130.0, 'climax_exhaustion'),
    marketData: {
      call_wall: 145.0,
      dp_levels: [132.5, 138.0],
      call_ask_premium: 450000,
      net_delta_skew: 0.52, // Bearish divergence
    },
    shortyMeta: {
      siFloat: 1.8,
      dtc: 1.1,
      feeRate: '0.3%',
      coilOn: false,
      relvol: 3.4,
    },
  },
  {
    id: 'tsla-neutral',
    name: 'TSLA - Base Compression (Pre-Breakout Neutral)',
    ticker: 'TSLA',
    expectedPhase: 'NEUTRAL',
    description:
      'Coiling inside base range with low volume (RVOL 0.95x). Awaiting Break of Structure and order flow acceleration.',
    bars: generateBars(210.0, 'compression_neutral'),
    marketData: {
      call_wall: 225.0,
      dp_levels: [208.5, 211.0],
      call_ask_premium: 890000,
      net_delta_skew: 1.25,
    },
    shortyMeta: {
      siFloat: 3.4,
      dtc: 1.9,
      feeRate: '0.4%',
      coilOn: true,
      relvol: 0.95,
    },
  },
  {
    id: 'short-squeeze-candidate',
    name: 'GME / High Short Interest Squeeze Breakout',
    ticker: 'GME',
    expectedPhase: 'UPTICK_START',
    description:
      'Surge trigger with 31% SI float, days-to-cover 5.8, Dark Pool floor at $24.50, Call Ask aggression 3.1x, and RRR 4.1:1.',
    bars: generateBars(24.2, 'short_squeeze'),
    marketData: {
      call_wall: 32.0,
      dp_levels: [24.5, 24.8],
      call_ask_premium: 2800000,
      net_delta_skew: 3.1,
    },
    shortyMeta: {
      siFloat: 31.2,
      dtc: 5.8,
      feeRate: '24.8%',
      coilOn: true,
      relvol: 3.8,
    },
  },
];
