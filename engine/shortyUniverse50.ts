import { RetailTicker } from './types.ts';
import { getNinetyDayData } from './ninetyDayTriggers.ts';

// Helper to generate realistic candles
function generateCandles(
  basePrice: number,
  type: 'breakout_long' | 'climax_exit' | 'accumulation' | 'consolidation',
  scale = 1.0
) {
  const bars = [];
  const baseTime = new Date('2026-09-29T09:30:00-04:00').getTime();
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
      open = basePrice + (i < 24 ? (i % 4) * 0.05 * scale : (0.4 + (i - 24) * 0.2) * scale);
      close = open + (i >= 26 ? 0.3 * scale : 0.04 * scale);
      high = Math.max(open, close) + 0.08 * scale;
      low = Math.min(open, close) - 0.05 * scale;
      volume = i >= 26 ? 180000 : 45000;
    } else if (type === 'climax_exit') {
      open = basePrice + (i * 0.35) * scale;
      close = open + (i >= 27 ? -0.5 * scale : 0.3 * scale);
      high = open + 0.6 * scale;
      low = open - 0.4 * scale;
      volume = i >= 27 ? 290000 : 80000;
    } else if (type === 'accumulation') {
      open = basePrice + Math.sin(i * 0.4) * 0.4 * scale;
      close = open + Math.cos(i * 0.4) * 0.3 * scale;
      high = Math.max(open, close) + 0.2 * scale;
      low = Math.min(open, close) - 0.2 * scale;
      volume = 60000;
    } else {
      open = basePrice + ((i % 5) - 2) * 0.2 * scale;
      close = open + 0.05 * scale;
      high = open + 0.2 * scale;
      low = open - 0.2 * scale;
      volume = 50000;
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

export function buildDynamicTicker(
  symbol: string,
  name: string,
  price: number,
  changePercent: number,
  volumeRatio: number,
  signal: 'STRONG_BUY' | 'ACCUMULATING' | 'NEUTRAL' | 'TAKE_PROFIT' | 'AVOID',
  setupGrade: 'A+' | 'A' | 'B' | 'WATCH',
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

// 56 Tickers from the 523-ticker Shorty Universe with September 2026 Refreshed Metrics
export const SHORTY_50_TICKERS: RetailTicker[] = [
  // 1-6: Original Primary Tickers - Refreshed with this morning's open
  buildDynamicTicker('AAOI', 'Applied Optoelectronics', 104.85, 4.58, 3.8, 'STRONG_BUY', 'A+', 4.1, 24.63, 5.4, 88, 120.0, 98.2, 'breakout_long', 5.5),
  buildDynamicTicker('NVDA', 'NVIDIA Corporation', 231.40, 1.11, 2.8, 'STRONG_BUY', 'A', 3.1, 1.61, 1.1, 72, 240.0, 224.0, 'breakout_long', 1.2),
  buildDynamicTicker('PLTR', 'Palantir Technologies', 194.20, 2.39, 3.1, 'STRONG_BUY', 'A+', 3.7, 4.81, 2.1, 84, 215.0, 188.0, 'breakout_long', 8.5),
  buildDynamicTicker('TSLA', 'Tesla Inc', 362.80, 1.50, 1.4, 'ACCUMULATING', 'B', 2.5, 3.08, 1.8, 64, 385.0, 355.0, 'accumulation', 2.2),
  buildDynamicTicker('GME', 'GameStop Corp', 24.60, 6.12, 3.6, 'STRONG_BUY', 'A+', 4.6, 29.77, 5.8, 92, 30.0, 23.4, 'breakout_long', 1.2),
  buildDynamicTicker('AMD', 'Advanced Micro Devices', 165.80, 2.03, 1.8, 'ACCUMULATING', 'B', 2.4, 2.4, 1.3, 65, 178.0, 160.0, 'accumulation', 1.5),

  // 7-16: High-Beta Short Squeeze Leaders (SI > 20%, RelVol > 2.5x)
  buildDynamicTicker('SMCI', 'Super Micro Computer', 52.30, 7.28, 4.2, 'STRONG_BUY', 'A+', 4.8, 21.4, 4.2, 90, 62.0, 48.0, 'breakout_long', 2.5),
  buildDynamicTicker('MARA', 'MARA Holdings', 30.85, 7.72, 3.9, 'STRONG_BUY', 'A+', 4.4, 27.8, 5.1, 87, 36.0, 28.5, 'breakout_long', 1.8),
  buildDynamicTicker('UPST', 'Upstart Holdings', 59.80, 6.03, 3.5, 'STRONG_BUY', 'A+', 4.2, 31.2, 6.2, 89, 72.0, 55.0, 'breakout_long', 3.0),
  buildDynamicTicker('CVNA', 'Carvana Co', 332.10, 2.34, 2.6, 'STRONG_BUY', 'A', 3.3, 18.9, 3.8, 81, 365.0, 320.0, 'breakout_long', 15.0),
  buildDynamicTicker('SOUN', 'SoundHound AI', 9.65, 8.18, 4.4, 'STRONG_BUY', 'A+', 5.0, 25.4, 4.6, 93, 12.5, 8.8, 'breakout_long', 0.7),
  buildDynamicTicker('IONQ', 'IonQ Inc', 21.20, 6.80, 3.2, 'STRONG_BUY', 'A', 3.8, 22.3, 4.9, 85, 25.5, 19.6, 'breakout_long', 1.2),
  buildDynamicTicker('CLSK', 'CleanSpark Inc', 17.80, 8.21, 3.7, 'STRONG_BUY', 'A+', 4.2, 23.6, 4.4, 88, 21.5, 16.2, 'breakout_long', 1.1),
  buildDynamicTicker('RIOT', 'Riot Platforms', 15.90, 7.43, 3.2, 'STRONG_BUY', 'A', 3.6, 19.5, 4.0, 82, 19.5, 14.8, 'breakout_long', 1.0),
  buildDynamicTicker('RIVN', 'Rivian Automotive', 14.65, 5.02, 2.6, 'STRONG_BUY', 'A', 3.1, 17.8, 3.6, 74, 17.5, 13.8, 'breakout_long', 0.9),
  buildDynamicTicker('LCID', 'Lucid Group', 3.62, 5.85, 2.4, 'ACCUMULATING', 'B', 2.7, 28.4, 7.2, 68, 4.5, 3.35, 'accumulation', 0.35),

  // 17-26: AI Infrastructure & Semiconductor Shorty Universe
  buildDynamicTicker('ARM', 'Arm Holdings', 154.20, 3.40, 2.1, 'STRONG_BUY', 'A', 3.1, 5.2, 2.4, 76, 170.0, 148.0, 'breakout_long', 6.0),
  buildDynamicTicker('AVGO', 'Broadcom Inc', 184.60, 2.15, 1.8, 'STRONG_BUY', 'A', 2.9, 1.8, 1.4, 74, 200.0, 178.0, 'breakout_long', 7.0),
  buildDynamicTicker('MU', 'Micron Technology', 112.40, 4.30, 2.6, 'STRONG_BUY', 'A+', 3.7, 3.4, 1.9, 83, 126.0, 107.5, 'breakout_long', 4.5),
  buildDynamicTicker('MRVL', 'Marvell Technology', 88.50, 3.90, 2.3, 'STRONG_BUY', 'A', 3.3, 2.9, 1.7, 77, 98.0, 84.5, 'breakout_long', 3.5),
  buildDynamicTicker('QCOM', 'Qualcomm Inc', 178.30, -0.80, 1.2, 'NEUTRAL', 'WATCH', 1.8, 2.1, 1.5, 54, 190.0, 172.0, 'consolidation', 4.0),
  buildDynamicTicker('INTC', 'Intel Corporation', 24.80, 1.20, 1.4, 'ACCUMULATING', 'B', 2.1, 3.8, 2.0, 61, 28.0, 23.5, 'accumulation', 1.1),
  buildDynamicTicker('AMAT', 'Applied Materials', 214.50, 1.90, 1.6, 'STRONG_BUY', 'A', 2.8, 2.2, 1.6, 72, 232.0, 208.0, 'breakout_long', 8.0),
  buildDynamicTicker('LRCX', 'Lam Research', 842.00, 2.40, 1.7, 'STRONG_BUY', 'A', 2.9, 2.5, 1.8, 75, 910.0, 815.0, 'breakout_long', 25.0),
  buildDynamicTicker('KLAC', 'KLA Corporation', 765.00, 2.80, 1.9, 'STRONG_BUY', 'A', 3.0, 2.3, 1.7, 76, 830.0, 740.0, 'breakout_long', 22.0),
  buildDynamicTicker('TSM', 'Taiwan Semiconductor', 194.20, 3.10, 2.2, 'STRONG_BUY', 'A+', 3.5, 1.4, 1.2, 85, 212.0, 187.0, 'breakout_long', 7.5),

  // 27-36: Software, Cloud & Cybersecurity Momentum
  buildDynamicTicker('CRWD', 'CrowdStrike Holdings', 318.40, 4.60, 2.8, 'STRONG_BUY', 'A+', 3.8, 3.2, 2.1, 84, 350.0, 305.0, 'breakout_long', 12.0),
  buildDynamicTicker('PANW', 'Palo Alto Networks', 386.20, 2.40, 1.9, 'STRONG_BUY', 'A', 3.0, 4.1, 2.5, 78, 415.0, 372.0, 'breakout_long', 14.0),
  buildDynamicTicker('NET', 'Cloudflare Inc', 94.60, 5.20, 2.7, 'STRONG_BUY', 'A+', 3.6, 6.8, 3.2, 82, 108.0, 90.0, 'breakout_long', 4.0),
  buildDynamicTicker('SNOW', 'Snowflake Inc', 128.50, 3.10, 2.0, 'ACCUMULATING', 'B', 2.7, 5.4, 2.8, 71, 142.0, 122.0, 'accumulation', 5.0),
  buildDynamicTicker('DDOG', 'Datadog Inc', 124.80, 4.20, 2.4, 'STRONG_BUY', 'A', 3.3, 4.6, 2.6, 79, 138.0, 119.0, 'breakout_long', 4.5),
  buildDynamicTicker('MDB', 'MongoDB Inc', 295.00, 6.10, 2.9, 'STRONG_BUY', 'A+', 3.7, 7.8, 3.4, 83, 335.0, 280.0, 'breakout_long', 12.0),
  buildDynamicTicker('ESTC', 'Elastic NV', 86.40, 4.80, 2.5, 'STRONG_BUY', 'A', 3.4, 6.2, 3.1, 80, 98.0, 82.0, 'breakout_long', 3.8),
  buildDynamicTicker('PATH', 'UiPath Inc', 14.20, 2.90, 1.8, 'ACCUMULATING', 'B', 2.4, 7.1, 3.6, 67, 16.2, 13.5, 'accumulation', 0.8),
  buildDynamicTicker('AI', 'C3.ai Inc', 26.80, 7.40, 3.4, 'STRONG_BUY', 'A+', 4.1, 28.6, 6.8, 86, 32.5, 24.8, 'breakout_long', 1.4),
  buildDynamicTicker('BBAI', 'BigBear.ai Holdings', 2.15, 8.90, 3.9, 'STRONG_BUY', 'A+', 4.4, 22.8, 5.2, 88, 2.8, 1.95, 'breakout_long', 0.2),

  // 37-46: Retail Favorites, Fintech & Crypto Proxies
  buildDynamicTicker('HOOD', 'Robinhood Markets', 24.80, 5.80, 2.9, 'STRONG_BUY', 'A+', 3.7, 8.4, 2.8, 83, 28.5, 23.2, 'breakout_long', 1.2),
  buildDynamicTicker('COIN', 'Coinbase Global', 218.40, 7.20, 3.1, 'STRONG_BUY', 'A+', 3.9, 11.2, 3.4, 85, 248.0, 205.0, 'breakout_long', 10.0),
  buildDynamicTicker('MSTR', 'MicroStrategy Inc', 188.50, 8.60, 3.5, 'STRONG_BUY', 'A+', 4.2, 15.6, 3.9, 89, 220.0, 175.0, 'breakout_long', 9.0),
  buildDynamicTicker('AFRM', 'Affirm Holdings', 44.20, 6.40, 2.8, 'STRONG_BUY', 'A+', 3.6, 16.8, 4.1, 82, 52.0, 41.0, 'breakout_long', 2.2),
  buildDynamicTicker('SOFI', 'SoFi Technologies', 9.85, 4.20, 2.3, 'STRONG_BUY', 'A', 3.2, 18.2, 4.5, 78, 11.4, 9.2, 'breakout_long', 0.6),
  buildDynamicTicker('OPEN', 'Opendoor Technologies', 2.45, 5.60, 2.6, 'STRONG_BUY', 'A', 3.4, 21.6, 5.8, 81, 3.1, 2.25, 'breakout_long', 0.25),
  buildDynamicTicker('RDDT', 'Reddit Inc', 72.80, 6.90, 3.2, 'STRONG_BUY', 'A+', 3.8, 14.5, 3.6, 84, 84.0, 67.5, 'breakout_long', 3.5),
  buildDynamicTicker('DJT', 'Trump Media & Tech', 18.60, -3.20, 2.4, 'TAKE_PROFIT', 'WATCH', 0.0, 19.8, 4.2, 38, 22.0, 16.5, 'climax_exit', 1.5),
  buildDynamicTicker('NKLA', 'Nikola Corporation', 4.80, 1.20, 1.1, 'AVOID', 'WATCH', 0.0, 26.2, 6.4, 32, 6.0, 4.2, 'consolidation', 0.4),
  buildDynamicTicker('TEM', 'Tempus AI Inc', 64.20, 8.10, 3.4, 'STRONG_BUY', 'A+', 4.0, 18.4, 4.2, 87, 76.0, 59.0, 'breakout_long', 3.2),

  // 47-56: Biotech, Quantum & Energy High-Short Moats
  buildDynamicTicker('RGTI', 'Rigetti Computing', 1.48, 9.40, 3.8, 'STRONG_BUY', 'A+', 4.3, 19.2, 4.6, 86, 1.9, 1.35, 'breakout_long', 0.15),
  buildDynamicTicker('QBTS', 'D-Wave Quantum', 1.25, 7.80, 3.2, 'STRONG_BUY', 'A', 3.8, 17.5, 4.1, 82, 1.6, 1.15, 'breakout_long', 0.12),
  buildDynamicTicker('ASTS', 'AST SpaceMobile', 29.40, 6.80, 2.9, 'STRONG_BUY', 'A+', 3.7, 26.4, 5.8, 85, 35.0, 27.2, 'breakout_long', 1.6),
  buildDynamicTicker('RKLB', 'Rocket Lab USA', 10.65, 5.40, 2.6, 'STRONG_BUY', 'A', 3.5, 16.2, 3.8, 81, 12.4, 9.9, 'breakout_long', 0.7),
  buildDynamicTicker('PLUG', 'Plug Power', 2.38, 3.10, 1.9, 'ACCUMULATING', 'B', 2.4, 27.8, 6.9, 66, 2.9, 2.2, 'accumulation', 0.25),
  buildDynamicTicker('FCEL', 'FuelCell Energy', 0.62, 2.40, 1.5, 'ACCUMULATING', 'B', 2.0, 23.4, 5.9, 62, 0.78, 0.58, 'accumulation', 0.08),
  buildDynamicTicker('CHWY', 'Chewy Inc', 32.40, 3.80, 2.2, 'STRONG_BUY', 'A', 3.2, 14.8, 3.6, 78, 36.5, 30.5, 'breakout_long', 1.8),
  buildDynamicTicker('KSS', 'Kohl\'s Corporation', 18.20, 2.10, 1.7, 'ACCUMULATING', 'B', 2.6, 34.2, 8.4, 69, 21.0, 17.1, 'accumulation', 1.2),
  buildDynamicTicker('BYND', 'Beyond Meat', 6.40, 4.20, 2.4, 'STRONG_BUY', 'A', 3.4, 38.6, 9.2, 82, 7.8, 5.9, 'breakout_long', 0.5),
  buildDynamicTicker('W', 'Wayfair Inc', 51.60, 4.90, 2.5, 'STRONG_BUY', 'A', 3.3, 25.1, 5.7, 80, 58.0, 48.0, 'breakout_long', 2.5),

  // 57-58: Special Engine Runs (Requested Tickers: PWP & BWEN)
  buildDynamicTicker('PWP', 'Perella Weinberg Partners', 15.75, 4.15, 2.8, 'STRONG_BUY', 'A+', 3.6, 6.2, 2.4, 82, 17.5, 15.1, 'breakout_long', 1.1),
  buildDynamicTicker('BWEN', 'Broadwind Inc', 4.19, 2.85, 1.9, 'ACCUMULATING', 'A', 3.4, 18.6, 4.8, 76, 5.0, 3.95, 'accumulation', 0.4),
];
