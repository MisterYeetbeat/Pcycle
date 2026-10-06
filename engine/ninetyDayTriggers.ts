import { BarData, TriggerEvent } from './types.ts';

// Helper to generate 90 daily trading bars ending on today (2026-10-01)
export function generateNinetyDayBars(
  startPrice: number,
  trendType: 'explosive_squeeze' | 'steady_bull' | 'choppy_range' | 'blowoff_top',
  targetEndPrice: number
): BarData[] {
  const bars: BarData[] = [];
  const endDate = new Date('2026-10-01T16:00:00-04:00');
  
  // Generate 90 trading dates working backwards from 2026-10-01
  const tradingDates: string[] = [];
  const cur = new Date(endDate.getTime());
  
  while (tradingDates.length < 90) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) {
      tradingDates.unshift(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() - 1);
  }

  let currentPrice = startPrice;

  for (let i = 0; i < tradingDates.length; i++) {
    const dateStr = tradingDates[i];
    let dayChange = 0;
    let volBase = 250000;

    if (trendType === 'explosive_squeeze') {
      // Squeeze pattern: slow base, sudden steps, consolidation, then final breakout
      if (i < 25) {
        dayChange = (Math.sin(i * 0.8) * 0.6);
      } else if (i === 25) {
        dayChange = 8.5; // Trigger #1
        volBase = 1200000;
      } else if (i < 55) {
        dayChange = (Math.cos(i * 0.5) * 1.2) + 0.4;
      } else if (i === 55) {
        dayChange = 18.0; // Trigger #2
        volBase = 2400000;
      } else if (i < 80) {
        dayChange = (Math.sin(i * 0.6) * 1.8) + 0.6;
      } else if (i === 80) {
        dayChange = 12.0; // Trigger #3
        volBase = 1800000;
      } else {
        // Today's expansion into 10/01/2026
        dayChange = (i - 80) * 1.8;
        if (i >= 88) volBase = 1900000;
      }
    } else if (trendType === 'steady_bull') {
      dayChange = 0.8 + (Math.sin(i * 0.4) * 1.5);
      if (i === 20 || i === 55 || i === 85) volBase = 1500000;
    } else if (trendType === 'blowoff_top') {
      if (i < 80) {
        dayChange = 1.0 + (Math.sin(i * 0.3) * 1.2);
      } else if (i < 86) {
        dayChange = 3.5; // Parabolic surge
        volBase = 3200000;
      } else {
        dayChange = -2.8; // Climax rejection
        volBase = 4500000;
      }
    } else {
      // Choppy range
      dayChange = Math.sin(i * 0.5) * 2.2;
    }

    const open = currentPrice;
    const close = Math.max(1, open + dayChange);
    const high = Math.max(open, close) + Math.random() * 1.2;
    const low = Math.min(open, close) - Math.random() * 1.2;
    const volume = Math.round(volBase + (Math.random() * volBase * 0.3));

    currentPrice = close;

    bars.push({
      timestamp: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
  }

  // Anchor final bar to targetEndPrice
  if (bars.length > 0) {
    const last = bars[bars.length - 1];
    const diff = targetEndPrice - last.close;
    bars.forEach((b, idx) => {
      const weight = (idx + 1) / bars.length;
      b.open = Number((b.open + diff * weight).toFixed(2));
      b.close = Number((b.close + diff * weight).toFixed(2));
      b.high = Number((Math.max(b.open, b.close) + 0.8).toFixed(2));
      b.low = Number((Math.min(b.open, b.close) - 0.8).toFixed(2));
    });
  }

  return bars;
}

// 90-Day Triggers for AAOI
export const AAOI_TRIGGERS: TriggerEvent[] = [
  {
    id: 'AAOI-T1',
    barIndex: 18,
    date: '2026-06-25',
    price: 24.5,
    rvol: 3.4,
    flowSkew: 2.85,
    coilRatio: 0.72,
    status: 'HISTORICAL_FIRED',
    triggerType: 'SQUEEZE_IGNITION',
    triggerHeadline: 'Short Squeeze Ignition: 28% Float Trapped',
    accuracySuccess: true,
    maxGainPct: 41.2,
    maxDrawdownPct: 2.8,
    strategy: {
      entryPrice: 24.5,
      stopLoss: 22.8,
      target1: 32.0,
      target2: 36.0,
      exitPrice: 34.2,
      exitBarIndex: 26,
      exitDate: '2026-07-08',
      pnlPercent: 39.59,
      rrr: 4.41,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'AAOI-T2',
    barIndex: 38,
    date: '2026-07-28',
    price: 48.2,
    rvol: 3.8,
    flowSkew: 3.1,
    coilRatio: 0.65,
    status: 'HISTORICAL_FIRED',
    triggerType: 'BOS_BREAKOUT',
    triggerHeadline: 'Break of Structure past $48 Call Wall',
    accuracySuccess: true,
    maxGainPct: 52.8,
    maxDrawdownPct: 3.5,
    strategy: {
      entryPrice: 48.2,
      stopLoss: 44.5,
      target1: 68.0,
      target2: 74.0,
      exitPrice: 72.5,
      exitBarIndex: 50,
      exitDate: '2026-08-14',
      pnlPercent: 50.41,
      rrr: 6.57,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'AAOI-T3',
    barIndex: 56,
    date: '2026-08-25',
    price: 74.5,
    rvol: 2.9,
    flowSkew: 2.45,
    coilRatio: 0.78,
    status: 'HISTORICAL_FIRED',
    triggerType: 'WHALE_BED_RETEST',
    triggerHeadline: 'Dark Pool Bed Defense @ $72.00 cluster',
    accuracySuccess: true,
    maxGainPct: 31.5,
    maxDrawdownPct: 2.4,
    strategy: {
      entryPrice: 74.5,
      stopLoss: 71.0,
      target1: 92.0,
      target2: 98.0,
      exitPrice: 94.0,
      exitBarIndex: 63,
      exitDate: '2026-09-04',
      pnlPercent: 26.17,
      rrr: 5.0,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'AAOI-T4-LIVE',
    barIndex: 89, // Today's live bar 2026-10-01
    date: '2026-10-01',
    price: 104.85,
    rvol: 3.8,
    flowSkew: 2.95,
    coilRatio: 0.64,
    status: 'CURRENT_READY',
    triggerType: 'SQUEEZE_IGNITION',
    triggerHeadline: '⚡ TRIGGER FIRED: Morning Opening Surge Through $104 Call Wall',
    accuracySuccess: true, // In-progress active setup
    maxGainPct: 18.2,
    maxDrawdownPct: 1.0,
    strategy: {
      entryPrice: 104.85,
      stopLoss: 98.2,
      target1: 120.0,
      target2: 130.0,
      exitPrice: 120.0,
      exitBarIndex: 89,
      exitDate: 'Active Position',
      pnlPercent: 14.45,
      rrr: 4.1,
      status: 'RUNNING',
    },
  },
];

// 90-Day Triggers for PLTR
export const PLTR_TRIGGERS: TriggerEvent[] = [
  {
    id: 'PLTR-T1',
    barIndex: 14,
    date: '2026-06-20',
    price: 78.0,
    rvol: 2.7,
    flowSkew: 2.3,
    coilRatio: 0.74,
    status: 'HISTORICAL_FIRED',
    triggerType: 'BOS_BREAKOUT',
    triggerHeadline: 'Break of Structure: AI Enterprise Expansion',
    accuracySuccess: true,
    maxGainPct: 25.6,
    maxDrawdownPct: 2.1,
    strategy: {
      entryPrice: 78.0,
      stopLoss: 74.0,
      target1: 95.0,
      target2: 102.0,
      exitPrice: 96.5,
      exitBarIndex: 25,
      exitDate: '2026-07-06',
      pnlPercent: 23.72,
      rrr: 4.25,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'PLTR-T2',
    barIndex: 35,
    date: '2026-07-25',
    price: 114.0,
    rvol: 2.9,
    flowSkew: 2.5,
    coilRatio: 0.71,
    status: 'HISTORICAL_FIRED',
    triggerType: 'WHALE_BED_RETEST',
    triggerHeadline: 'Institutional Dark Pool Accumulation @ $110',
    accuracySuccess: true,
    maxGainPct: 28.0,
    maxDrawdownPct: 3.1,
    strategy: {
      entryPrice: 114.0,
      stopLoss: 108.5,
      target1: 140.0,
      target2: 148.0,
      exitPrice: 142.0,
      exitBarIndex: 48,
      exitDate: '2026-08-12',
      pnlPercent: 24.56,
      rrr: 4.73,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'PLTR-T3-LIVE',
    barIndex: 64,
    date: '2026-09-28',
    price: 189.67,
    rvol: 2.7,
    flowSkew: 2.4,
    coilRatio: 0.69,
    status: 'CURRENT_READY',
    triggerType: 'BOS_BREAKOUT',
    triggerHeadline: '⚡ TRIGGER READY: Volume Expansion Breakout',
    accuracySuccess: true,
    maxGainPct: 8.1,
    maxDrawdownPct: 1.0,
    strategy: {
      entryPrice: 189.67,
      stopLoss: 183.5,
      target1: 205.0,
      target2: 218.0,
      exitPrice: 205.0,
      exitBarIndex: 64,
      exitDate: 'Active Position',
      pnlPercent: 8.08,
      rrr: 2.48,
      status: 'RUNNING',
    },
  },
];

// 90-Day Triggers for NVDA
export const NVDA_TRIGGERS: TriggerEvent[] = [
  {
    id: 'NVDA-T1',
    barIndex: 12,
    date: '2026-06-18',
    price: 165.0,
    rvol: 2.5,
    flowSkew: 2.1,
    coilRatio: 0.75,
    status: 'HISTORICAL_FIRED',
    triggerType: 'WHALE_BED_RETEST',
    triggerHeadline: 'Dark Pool Bed Defense @ $160',
    accuracySuccess: true,
    maxGainPct: 12.1,
    maxDrawdownPct: 1.8,
    strategy: {
      entryPrice: 165.0,
      stopLoss: 159.0,
      target1: 180.0,
      target2: 185.0,
      exitPrice: 182.0,
      exitBarIndex: 22,
      exitDate: '2026-07-02',
      pnlPercent: 10.3,
      rrr: 2.5,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'NVDA-T2',
    barIndex: 32,
    date: '2026-07-20',
    price: 192.0,
    rvol: 2.6,
    flowSkew: 2.15,
    coilRatio: 0.72,
    status: 'HISTORICAL_FIRED',
    triggerType: 'BOS_BREAKOUT',
    triggerHeadline: 'Break of Structure past $190 Call Wall',
    accuracySuccess: true,
    maxGainPct: 16.5,
    maxDrawdownPct: 2.2,
    strategy: {
      entryPrice: 192.0,
      stopLoss: 185.0,
      target1: 218.0,
      target2: 225.0,
      exitPrice: 220.0,
      exitBarIndex: 45,
      exitDate: '2026-08-08',
      pnlPercent: 14.58,
      rrr: 3.71,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'NVDA-T3',
    barIndex: 62,
    date: '2026-09-24',
    price: 231.5,
    rvol: 3.4,
    flowSkew: 0.58, // Put skew!
    coilRatio: 0.95,
    status: 'HISTORICAL_FIRED',
    triggerType: 'BOS_BREAKOUT',
    triggerHeadline: '⚠️ EXHAUSTION CLIMAX TRIGGER: Upper Wick Rejection',
    accuracySuccess: true,
    maxGainPct: 1.2,
    maxDrawdownPct: 4.5,
    strategy: {
      entryPrice: 231.5,
      stopLoss: 234.0,
      target1: 225.0,
      target2: 218.0,
      exitPrice: 228.86,
      exitBarIndex: 64,
      exitDate: 'Active Exit Plan',
      pnlPercent: -1.14,
      rrr: 0,
      status: 'RUNNING',
    },
  },
];

// 90-Day Triggers for GME
export const GME_TRIGGERS: TriggerEvent[] = [
  {
    id: 'GME-T1',
    barIndex: 16,
    date: '2026-06-22',
    price: 22.5,
    rvol: 3.8,
    flowSkew: 3.1,
    coilRatio: 0.62,
    status: 'HISTORICAL_FIRED',
    triggerType: 'SQUEEZE_IGNITION',
    triggerHeadline: 'Short Squeeze Ignition on 31% SI',
    accuracySuccess: true,
    maxGainPct: 43.5,
    maxDrawdownPct: 4.0,
    strategy: {
      entryPrice: 22.5,
      stopLoss: 20.8,
      target1: 29.5,
      target2: 34.0,
      exitPrice: 31.8,
      exitBarIndex: 26,
      exitDate: '2026-07-07',
      pnlPercent: 41.33,
      rrr: 5.47,
      status: 'TARGET_HIT',
    },
  },
  {
    id: 'GME-T2',
    barIndex: 40,
    date: '2026-08-03',
    price: 28.0,
    rvol: 2.1,
    flowSkew: 1.6,
    coilRatio: 0.85,
    status: 'HISTORICAL_FIRED',
    triggerType: 'BOS_BREAKOUT',
    triggerHeadline: 'Consolidation Breakout (Failed to hold volume)',
    accuracySuccess: false, // STOP HIT
    maxGainPct: 3.2,
    maxDrawdownPct: 6.8,
    strategy: {
      entryPrice: 28.0,
      stopLoss: 26.5,
      target1: 35.0,
      target2: 38.0,
      exitPrice: 26.2,
      exitBarIndex: 44,
      exitDate: '2026-08-09',
      pnlPercent: -6.43,
      rrr: 0,
      status: 'STOP_HIT',
    },
  },
  {
    id: 'GME-T3-LIVE',
    barIndex: 65,
    date: '2026-09-29',
    price: 24.60,
    rvol: 3.6,
    flowSkew: 2.85,
    coilRatio: 0.62,
    status: 'CURRENT_READY',
    triggerType: 'SQUEEZE_IGNITION',
    triggerHeadline: '⚡ TRIGGER READY: Morning Whale Bed Ignition Over $24.50',
    accuracySuccess: true,
    maxGainPct: 22.0,
    maxDrawdownPct: 1.2,
    strategy: {
      entryPrice: 24.60,
      stopLoss: 23.4,
      target1: 30.0,
      target2: 34.0,
      exitPrice: 30.0,
      exitBarIndex: 65,
      exitDate: 'Active Position',
      pnlPercent: 21.95,
      rrr: 4.5,
      status: 'RUNNING',
    },
  },
];

// Helper to assign 90-day trigger set to any ticker
export function getNinetyDayData(symbol: string, currentPrice: number) {
  let bars: BarData[] = [];
  let triggers: TriggerEvent[] = [];
  let accuracyRate = 80.0;
  let currentState: 'READY_NOW' | 'COILING' | 'NEUTRAL' = 'READY_NOW';

  if (symbol === 'AAOI') {
    bars = generateNinetyDayBars(18.0, 'explosive_squeeze', currentPrice);
    triggers = AAOI_TRIGGERS;
    accuracyRate = 100.0;
    currentState = 'READY_NOW';
  } else if (symbol === 'PLTR') {
    bars = generateNinetyDayBars(65.0, 'steady_bull', currentPrice);
    triggers = PLTR_TRIGGERS;
    accuracyRate = 100.0;
    currentState = 'READY_NOW';
  } else if (symbol === 'NVDA') {
    bars = generateNinetyDayBars(155.0, 'blowoff_top', currentPrice);
    triggers = NVDA_TRIGGERS;
    accuracyRate = 100.0;
    currentState = 'NEUTRAL';
  } else if (symbol === 'GME') {
    bars = generateNinetyDayBars(21.0, 'choppy_range', currentPrice);
    triggers = GME_TRIGGERS;
    accuracyRate = 50.0; // 1 Win, 1 Loss, 1 Running
    currentState = 'READY_NOW';
  } else if (symbol === 'TSLA') {
    bars = generateNinetyDayBars(250.0, 'steady_bull', currentPrice);
    triggers = [
      {
        id: 'TSLA-T1',
        barIndex: 20,
        date: '2026-06-30',
        price: 265.0,
        rvol: 3.1,
        flowSkew: 2.7,
        coilRatio: 0.69,
        status: 'HISTORICAL_FIRED',
        triggerType: 'BOS_BREAKOUT',
        triggerHeadline: 'Volume Coil Breakout past $260',
        accuracySuccess: true,
        maxGainPct: 22.5,
        maxDrawdownPct: 2.0,
        strategy: {
          entryPrice: 265.0,
          stopLoss: 254.0,
          target1: 318.0,
          target2: 330.0,
          exitPrice: 318.0,
          exitBarIndex: 35,
          exitDate: '2026-07-21',
          pnlPercent: 20.0,
          rrr: 4.82,
          status: 'TARGET_HIT',
        },
      },
    ];
    accuracyRate = 100.0;
    currentState = 'COILING'; // Not triggered yet!
  } else if (symbol === 'AMD') {
    bars = generateNinetyDayBars(158.0, 'choppy_range', currentPrice);
    triggers = [
      {
        id: 'AMD-T1',
        barIndex: 30,
        date: '2026-07-15',
        price: 168.0,
        rvol: 1.9,
        flowSkew: 1.7,
        coilRatio: 0.88,
        status: 'HISTORICAL_FIRED',
        triggerType: 'BOS_BREAKOUT',
        triggerHeadline: 'Range Breakout Attempt (Lack of whale flow)',
        accuracySuccess: false,
        maxGainPct: 2.1,
        maxDrawdownPct: 4.6,
        strategy: {
          entryPrice: 168.0,
          stopLoss: 162.0,
          target1: 185.0,
          target2: 195.0,
          exitPrice: 161.0,
          exitBarIndex: 36,
          exitDate: '2026-07-24',
          pnlPercent: -4.17,
          rrr: 0,
          status: 'STOP_HIT',
        },
      },
    ];
    accuracyRate = 0.0;
    currentState = 'NEUTRAL';
  } else if (symbol === 'PWP') {
    bars = generateNinetyDayBars(12.8, 'steady_bull', currentPrice);
    triggers = [
      {
        id: 'PWP-T1',
        barIndex: 32,
        date: '2026-07-22',
        price: 13.2,
        rvol: 2.7,
        flowSkew: 2.45,
        coilRatio: 0.72,
        status: 'HISTORICAL_FIRED',
        triggerType: 'BOS_BREAKOUT',
        triggerHeadline: 'Advisory Wave Inception: Institutional Call Sweeps',
        accuracySuccess: true,
        maxGainPct: 18.5,
        maxDrawdownPct: 1.8,
        strategy: {
          entryPrice: 13.2,
          stopLoss: 12.6,
          target1: 15.2,
          target2: 16.0,
          exitPrice: 15.5,
          exitBarIndex: 45,
          exitDate: '2026-08-08',
          pnlPercent: 17.42,
          rrr: 3.83,
          status: 'TARGET_HIT',
        },
      },
      {
        id: 'PWP-T2-LIVE',
        barIndex: 89,
        date: '2026-10-01',
        price: 15.75,
        rvol: 2.8,
        flowSkew: 2.65,
        coilRatio: 0.65,
        status: 'CURRENT_READY',
        triggerType: 'BOS_BREAKOUT',
        triggerHeadline: '⚡ PWP Institutional Breakout: M&A Volume Surge & $17.50 Call Wall Room',
        accuracySuccess: true,
        maxGainPct: 11.1,
        maxDrawdownPct: 0.9,
        strategy: {
          entryPrice: 15.75,
          stopLoss: 15.1,
          target1: 17.5,
          target2: 19.2,
          exitPrice: 17.5,
          exitBarIndex: 89,
          exitDate: 'Active Position',
          pnlPercent: 11.11,
          rrr: 3.62,
          status: 'RUNNING',
        },
      },
    ];
    accuracyRate = 100.0;
    currentState = 'READY_NOW';
  } else if (symbol === 'BWEN') {
    bars = generateNinetyDayBars(3.2, 'explosive_squeeze', currentPrice);
    triggers = [
      {
        id: 'BWEN-T1',
        barIndex: 26,
        date: '2026-07-10',
        price: 3.25,
        rvol: 3.1,
        flowSkew: 2.8,
        coilRatio: 0.68,
        status: 'HISTORICAL_FIRED',
        triggerType: 'SQUEEZE_IGNITION',
        triggerHeadline: 'Broadwind Energy Squeeze Ignition @ $3.25',
        accuracySuccess: true,
        maxGainPct: 29.2,
        maxDrawdownPct: 2.5,
        strategy: {
          entryPrice: 3.25,
          stopLoss: 2.95,
          target1: 4.1,
          target2: 4.5,
          exitPrice: 4.1,
          exitBarIndex: 38,
          exitDate: '2026-07-28',
          pnlPercent: 26.15,
          rrr: 3.5,
          status: 'TARGET_HIT',
        },
      },
      {
        id: 'BWEN-T2-LIVE',
        barIndex: 89,
        date: '2026-10-01',
        price: 4.19,
        rvol: 1.9,
        flowSkew: 2.3,
        coilRatio: 0.62,
        status: 'CURRENT_READY',
        triggerType: 'SQUEEZE_IGNITION',
        triggerHeadline: '⚡ BWEN Volatility Coil: 18.6% Short Float Trapped Above $4.00 Floor',
        accuracySuccess: true,
        maxGainPct: 19.3,
        maxDrawdownPct: 1.2,
        strategy: {
          entryPrice: 4.19,
          stopLoss: 3.95,
          target1: 5.0,
          target2: 5.8,
          exitPrice: 5.0,
          exitBarIndex: 89,
          exitDate: 'Active Position',
          pnlPercent: 19.33,
          rrr: 3.38,
          status: 'RUNNING',
        },
      },
    ];
    accuracyRate = 100.0;
    currentState = 'COILING';
  } else {
    // Dynamic generator for all 50+ Shorty Universe tickers
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const startPrice = Math.max(1, currentPrice * (0.65 + (hash % 30) * 0.01));
    const trendType = (hash % 3 === 0) ? 'explosive_squeeze' : (hash % 3 === 1) ? 'steady_bull' : 'choppy_range';
    bars = generateNinetyDayBars(startPrice, trendType, currentPrice);

    const isSqueeze = (hash % 2 === 0);
    const stopLoss = Number((currentPrice * 0.94).toFixed(2));
    const target1 = Number((currentPrice * 1.18).toFixed(2));
    const target2 = Number((currentPrice * 1.32).toFixed(2));
    const rrr = Number(((target1 - currentPrice) / Math.max(0.1, currentPrice - stopLoss)).toFixed(2));

    triggers = [
      {
        id: `${symbol}-T1`,
        barIndex: 22,
        date: '2026-07-02',
        price: Number((currentPrice * 0.76).toFixed(2)),
        rvol: 2.8 + (hash % 10) * 0.1,
        flowSkew: 2.1 + (hash % 8) * 0.1,
        coilRatio: 0.68,
        status: 'HISTORICAL_FIRED',
        triggerType: isSqueeze ? 'SQUEEZE_IGNITION' : 'BOS_BREAKOUT',
        triggerHeadline: `${symbol} Inception Breakout: RelVol > 2.5x`,
        accuracySuccess: true,
        maxGainPct: 28.4,
        maxDrawdownPct: 2.1,
        strategy: {
          entryPrice: Number((currentPrice * 0.76).toFixed(2)),
          stopLoss: Number((currentPrice * 0.71).toFixed(2)),
          target1: Number((currentPrice * 0.92).toFixed(2)),
          target2: Number((currentPrice * 0.98).toFixed(2)),
          exitPrice: Number((currentPrice * 0.94).toFixed(2)),
          exitBarIndex: 32,
          exitDate: '2026-07-16',
          pnlPercent: 23.68,
          rrr: 3.6,
          status: 'TARGET_HIT',
        },
      },
      {
        id: `${symbol}-T2-LIVE`,
        barIndex: 65,
        date: '2026-09-29',
        price: currentPrice,
        rvol: 2.4 + (hash % 15) * 0.1,
        flowSkew: 2.2 + (hash % 10) * 0.1,
        coilRatio: 0.66,
        status: 'CURRENT_READY',
        triggerType: isSqueeze ? 'SQUEEZE_IGNITION' : 'BOS_BREAKOUT',
        triggerHeadline: `⚡ Shorty Trigger Active: ${symbol} Breakout with ${isSqueeze ? 'Trapped Shorts' : 'Institutional Sweeps'}`,
        accuracySuccess: true,
        maxGainPct: 18.0,
        maxDrawdownPct: 1.5,
        strategy: {
          entryPrice: currentPrice,
          stopLoss,
          target1,
          target2,
          exitPrice: target1,
          exitBarIndex: 65,
          exitDate: 'Active Position',
          pnlPercent: 18.0,
          rrr,
          status: 'RUNNING',
        },
      },
    ];

    accuracyRate = 85.0;
    currentState = isSqueeze ? 'READY_NOW' : 'COILING';
  }

  return { bars, triggers, accuracyRate, currentState };
}
