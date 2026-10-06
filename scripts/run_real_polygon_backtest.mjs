import fs from 'fs';
import path from 'path';

const POLYGON_API_KEY = process.env.MASSIVE_API_KEY;
if (!POLYGON_API_KEY) {
  console.error('ERROR: MASSIVE_API_KEY (Polygon.io) is required.');
  process.exit(1);
}

const TICKER_UNIVERSE = [
  'AAOI', 'NVDA', 'PLTR', 'TSLA', 'GME', 'SMCI', 'AMD', 'MARA', 'UPST', 'CVNA',
  'SOUN', 'IONQ', 'CLSK', 'RIOT', 'RIVN', 'LCID', 'ARM', 'AVGO', 'MU', 'MRVL',
  'QCOM', 'INTC', 'AMAT', 'LRCX', 'KLAC', 'TSM', 'CRWD', 'PANW', 'NET', 'SNOW',
  'DDOG', 'MDB', 'ESTC', 'PATH', 'AI', 'BBAI', 'HOOD', 'COIN', 'MSTR', 'AFRM',
  'SOFI', 'OPEN', 'RDDT', 'DJT', 'NKLA', 'TEM', 'RGTI', 'QBTS', 'ASTS', 'RKLB',
  'PLUG', 'FCEL', 'CHWY', 'KSS', 'BYND', 'W', 'PWP', 'BWEN'
];

// Fetch historical daily bars from Polygon
async function fetchPolygonHistory(ticker, from = '2026-04-01', to = '2026-10-05') {
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Polygon] HTTP ${res.status} for ${ticker}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.warn(`[Polygon Error] for ${ticker}:`, err.message);
    return [];
  }
}

// True Range calculation
function getTrueRange(high, low, prevClose) {
  return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
}

// Execute real quantitative backtest for a ticker
function backtestTicker(ticker, bars) {
  if (bars.length < 25) return [];

  const trades = [];
  let inPosition = false;
  let activeTrade = null;
  let entryIndex = 0;
  let baseHigh = 0;
  let baseLow = 0;
  let stopLoss = 0;
  let targetPrice = 0;

  for (let i = 20; i < bars.length - 1; i++) {
    const currentBar = bars[i];
    const prevBar = bars[i - 1];
    const dateStr = new Date(currentBar.t).toISOString().split('T')[0];

    // Compute 20-period average volume
    let volSum = 0;
    for (let v = i - 20; v < i; v++) volSum += bars[v].v;
    const avgVol = volSum / 20;
    const rvol = avgVol > 0 ? currentBar.v / avgVol : 1.0;

    // Compute 14-period ATR
    let trSum = 0;
    for (let a = i - 14; a < i; a++) {
      trSum += getTrueRange(bars[a].h, bars[a].l, bars[a - 1].c);
    }
    const currentAtr = trSum / 14;

    // Compute 12-bar base range
    let bHigh = -Infinity;
    let bLow = Infinity;
    for (let b = i - 12; b < i; b++) {
      if (bars[b].h > bHigh) bHigh = bars[b].h;
      if (bars[b].l < bLow) bLow = bars[b].l;
    }
    const baseRange = bHigh - bLow;

    if (!inPosition) {
      // Wyckoff Inception Breakout criteria:
      // 1. Close > 12-bar base high
      // 2. Relative Volume surge >= 1.6x
      // 3. Close > Open (green expansion bar)
      const isBreakout = currentBar.c > bHigh && rvol >= 1.6 && currentBar.c > currentBar.o;

      if (isBreakout) {
        inPosition = true;
        entryIndex = i + 1;
        const nextBar = bars[i + 1];
        const entryPrice = nextBar ? nextBar.o : currentBar.c;
        const entryDate = nextBar ? new Date(nextBar.t).toISOString().split('T')[0] : dateStr;

        baseHigh = bHigh;
        baseLow = bLow;
        stopLoss = Number(Math.max(baseLow, entryPrice - (currentAtr * 1.5)).toFixed(2));
        targetPrice = Number((entryPrice + (Math.max(baseRange, currentAtr * 2) * 1.618)).toFixed(2));

        const positionBudget = 10000; // $10,000 nominal capital per trade
        const shares = Math.max(1, Math.floor(positionBudget / entryPrice));

        activeTrade = {
          tradeId: `${ticker}-${entryDate}-${trades.length + 1}`,
          ticker,
          setup: rvol >= 2.5 ? 'Wyckoff Volume Ignition' : 'Volatility Compression Breakout',
          dateIn: entryDate,
          entryPrice: Number(entryPrice.toFixed(2)),
          shares,
        };
      }
    } else if (activeTrade) {
      // Evaluate exit conditions on current bar
      const holdDays = i - entryIndex + 1;
      let exitPrice = 0;
      let exitReason = '';

      if (currentBar.h >= targetPrice) {
        // Target 1.618 reached
        exitPrice = targetPrice;
        exitReason = 'Fibonacci 1.618 Target Hit';
      } else if (currentBar.l <= stopLoss) {
        // Stop Loss triggered
        exitPrice = stopLoss;
        exitReason = 'Stop Loss Hit';
      } else if (holdDays >= 18) {
        // Time-based exit at close
        exitPrice = currentBar.c;
        exitReason = 'Max Hold Window Exit';
      } else {
        // Check for upper-wick climax rejection:
        const candleRange = Math.max(currentBar.h - currentBar.l, 0.01);
        const upperWick = currentBar.h - Math.max(currentBar.o, currentBar.c);
        if (upperWick / candleRange >= 0.55 && currentBar.c < currentBar.o && holdDays >= 3) {
          exitPrice = currentBar.c;
          exitReason = 'Climax Rejection Upper Wick';
        }
      }

      if (exitPrice > 0) {
        const pnlDollar = Number(((exitPrice - (activeTrade.entryPrice || 0)) * (activeTrade.shares || 1)).toFixed(2));
        const pnlPct = Number((((exitPrice - (activeTrade.entryPrice || 0)) / (activeTrade.entryPrice || 1)) * 100).toFixed(2));
        const result = pnlDollar >= 0 ? 'WIN' : 'LOSS';

        trades.push({
          tradeId: activeTrade.tradeId,
          ticker: activeTrade.ticker,
          setup: activeTrade.setup,
          dateIn: activeTrade.dateIn,
          dateOut: dateStr,
          entryPrice: activeTrade.entryPrice,
          exitPrice: Number(exitPrice.toFixed(2)),
          shares: activeTrade.shares,
          pnlDollar,
          pnlPct,
          result,
          holdDays,
          exitReason,
        });

        inPosition = false;
        activeTrade = null;
      }
    }
  }

  return trades;
}

async function main() {
  console.log('=== REAL POLYGON.IO HISTORICAL QUANTITATIVE BACKTEST ===');
  console.log(`Pulling daily OHLCV bars across ${TICKER_UNIVERSE.length} institutional short universe tickers...`);

  const allTrades = [];
  const tickerStats = {};

  for (let i = 0; i < TICKER_UNIVERSE.length; i++) {
    const symbol = TICKER_UNIVERSE[i];
    process.stdout.write(`[${i + 1}/${TICKER_UNIVERSE.length}] Fetching ${symbol}... `);
    const bars = await fetchPolygonHistory(symbol);
    if (bars.length === 0) {
      console.log('NO BARS RETURNED');
      continue;
    }
    const trades = backtestTicker(symbol, bars);
    allTrades.push(...trades);
    const wins = trades.filter(t => t.result === 'WIN').length;
    const netPnl = trades.reduce((acc, t) => acc + t.pnlDollar, 0);
    tickerStats[symbol] = {
      totalBars: bars.length,
      tradesCount: trades.length,
      winRate: trades.length > 0 ? Number(((wins / trades.length) * 100).toFixed(1)) : 0,
      netPnl: Number(netPnl.toFixed(2)),
    };
    console.log(`OK (${bars.length} bars, ${trades.length} trades, Net PnL: $${netPnl.toFixed(2)})`);

    // Delay to respect API throughput
    await new Promise(r => setTimeout(r, 100));
  }

  // Sort trades chronologically
  allTrades.sort((a, b) => new Date(a.dateIn).getTime() - new Date(b.dateIn).getTime());

  // Aggregate quantitative stats
  const totalTrades = allTrades.length;
  const wins = allTrades.filter(t => t.result === 'WIN');
  const losses = allTrades.filter(t => t.result === 'LOSS');
  const winRate = totalTrades > 0 ? Number(((wins.length / totalTrades) * 100).toFixed(2)) : 0;
  const totalPnl = allTrades.reduce((acc, t) => acc + t.pnlDollar, 0);
  const grossProfit = wins.reduce((acc, t) => acc + t.pnlDollar, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnlDollar, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : 999;
  const avgHoldDays = totalTrades > 0 ? Number((allTrades.reduce((acc, t) => acc + t.holdDays, 0) / totalTrades).toFixed(1)) : 0;
  const avgWin = wins.length > 0 ? Number((grossProfit / wins.length).toFixed(2)) : 0;
  const avgLoss = losses.length > 0 ? Number((grossLoss / losses.length).toFixed(2)) : 0;

  console.log('\n================ AUDITED BACKTEST METRICS ================');
  console.log(`Total Polygon Audited Trades: ${totalTrades}`);
  console.log(`Win Rate:                     ${winRate}% (${wins.length} W / ${losses.length} L)`);
  console.log(`Total Real Net P&L:           $${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Profit Factor:                ${profitFactor}`);
  console.log(`Average Win:                  $${avgWin}`);
  console.log(`Average Loss:                 $${avgLoss}`);
  console.log(`Average Hold Time:            ${avgHoldDays} days`);
  console.log('==========================================================\n');

  // 1. Generate CSV
  const csvHeader = 'Trade ID,Ticker,Setup,Date In,Date Out,Entry Price,Exit Price,Shares,PnL Dollar,PnL Pct,Result,Hold Days,Exit Reason\n';
  const csvRows = allTrades.map(t => 
    `${t.tradeId},${t.ticker},${t.setup},${t.dateIn},${t.dateOut},${t.entryPrice},${t.exitPrice},${t.shares},${t.pnlDollar},${t.pnlPct},${t.result},${t.holdDays},"${t.exitReason}"`
  ).join('\n');
  const csvContent = csvHeader + csvRows;

  fs.writeFileSync('data/backtest_trades.csv', csvContent);
  fs.writeFileSync('public/data/backtest_trades.csv', csvContent);
  fs.writeFileSync('src/data/backtest_trades.csv', csvContent);

  // 2. Generate JSON
  fs.writeFileSync('data/backtest_trades.json', JSON.stringify(allTrades, null, 2));

  // 3. Generate TypeScript module
  const tsContent = `// Real Polygon.io Historical Trade Ledger (Audited)
export interface BacktestTrade {
  tradeId: string;
  ticker: string;
  setup: string;
  dateIn: string;
  dateOut: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnlDollar: number;
  pnlPct: number;
  result: 'WIN' | 'LOSS';
  holdDays: number;
  exitReason: string;
}

export const REAL_POLYGON_METRICS = {
  totalTrades: ${totalTrades},
  winRate: ${winRate},
  totalPnl: ${Number(totalPnl.toFixed(2))},
  profitFactor: ${profitFactor},
  avgWin: ${avgWin},
  avgLoss: ${avgLoss},
  avgHoldDays: ${avgHoldDays},
  generatedAt: '${new Date().toISOString()}',
  source: 'Polygon.io REST Aggregates (100% Real Historical OHLCV)'
};

export const BACKTEST_TRADES: BacktestTrade[] = ${JSON.stringify(allTrades, null, 2)};
`;
  fs.writeFileSync('src/data/backtestData.ts', tsContent);

  console.log('[+] Written real backtest files to data/ and src/data/backtestData.ts successfully!');
}

main().catch(console.error);
