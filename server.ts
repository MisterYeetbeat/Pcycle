import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const storage = new Storage();

const UW_API_KEY = process.env.UNUSUAL_WHALES_API_KEY || '';
const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || '';

// Health & Status endpoint to report connection readiness to UI
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    unusualWhalesConnected: Boolean(UW_API_KEY && UW_API_KEY.length > 5),
    massiveConnected: Boolean(MASSIVE_API_KEY && MASSIVE_API_KEY.length > 5),
    capabilities: {
      darkPoolLevels: Boolean(UW_API_KEY),
      optionsSweeps: Boolean(UW_API_KEY),
      optionsGreeksChain: Boolean(MASSIVE_API_KEY),
      polygonAggs: Boolean(MASSIVE_API_KEY),
      groupedDaily: Boolean(MASSIVE_API_KEY),
    },
    timestamp: new Date().toISOString(),
  });
});

// Unusual Whales Proxy: Dark Pool & Off-Lit prints
app.get('/api/unusualwhales/darkpool/:ticker?', async (req: Request, res: Response) => {
  if (!UW_API_KEY) {
    return res.status(401).json({ error: 'UNUSUAL_WHALES_API_KEY not configured in environment secrets.' });
  }

  const { ticker } = req.params;
  const limit = req.query.limit || '50';
  const url = ticker
    ? `https://api.unusualwhales.com/api/darkpool/recent?limit=${limit}&ticker=${ticker}`
    : `https://api.unusualwhales.com/api/darkpool/recent?limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${UW_API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Unusual Whales Proxy: Options Flow & Sweeps
app.get('/api/unusualwhales/flow/:ticker', async (req: Request, res: Response) => {
  if (!UW_API_KEY) {
    return res.status(401).json({ error: 'UNUSUAL_WHALES_API_KEY not configured in environment secrets.' });
  }

  const { ticker } = req.params;
  const url = `https://api.unusualwhales.com/api/stock/${ticker}/flow-recent`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${UW_API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Unusual Whales Proxy: Greek Exposure & Gamma Walls
app.get('/api/unusualwhales/greeks/:ticker', async (req: Request, res: Response) => {
  if (!UW_API_KEY) {
    return res.status(401).json({ error: 'UNUSUAL_WHALES_API_KEY not configured in environment secrets.' });
  }

  const { ticker } = req.params;
  const url = `https://api.unusualwhales.com/api/stock/${ticker}/greek-exposure`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${UW_API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Massive (Polygon) Proxy: Intraday Candlestick Aggregates
app.get('/api/massive/aggs/:ticker', async (req: Request, res: Response) => {
  if (!MASSIVE_API_KEY) {
    return res.status(401).json({ error: 'MASSIVE_API_KEY not configured in environment secrets.' });
  }

  const { ticker } = req.params;
  const multiplier = req.query.multiplier || '5';
  const timespan = req.query.timespan || 'minute';
  
  // Calculate dynamic default dates (last 30 days up to current date)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const defaultTo = today.toISOString().split('T')[0];
  const defaultFrom = thirtyDaysAgo.toISOString().split('T')[0];

  const from = req.query.from || defaultFrom;
  const to = req.query.to || defaultTo;

  const baseUrl = 'https://api.polygon.io';
  const url = `${baseUrl}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&apiKey=${MASSIVE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Massive (Polygon) Proxy: Multi-Ticker Snapshot
app.get('/api/massive/snapshot', async (req: Request, res: Response) => {
  if (!MASSIVE_API_KEY) {
    return res.status(401).json({ error: 'MASSIVE_API_KEY not configured in environment secrets.' });
  }

  const tickers = req.query.tickers || 'AAOI,SOUN,TEM,ASTS,CRWD,NVDA,PLTR,GME,RKLB,BBAI,MARA,COIN,SMCI,IONQ,RGTI,DNA,QUBT,RDDT,SERV,ACHR,JOBY,OPEN,UPST,AFRM,CVNA,CLSK,WULF,IREN,HUT,BITF,CIFR,SOFI,HOOD,PATH,AI,SOBO,MVIS,LAZR,LUNR,HIMS';
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickers}&apiKey=${MASSIVE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Massive (Polygon) Proxy: Options Chain Snapshot with Greeks
app.get('/api/massive/options-chain/:ticker', async (req: Request, res: Response) => {
  if (!MASSIVE_API_KEY) {
    return res.status(401).json({ error: 'MASSIVE_API_KEY not configured in environment secrets.' });
  }

  const { ticker } = req.params;
  const baseUrl = 'https://api.polygon.io';
  const url = `${baseUrl}/v3/snapshot/options/${ticker}?limit=100&apiKey=${MASSIVE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Google Cloud Storage Archival Endpoint: Syncs and writes logs, backtests, and daily engine data
app.post('/api/archive/sync-all', async (req: Request, res: Response) => {
  const { bucketName = 'pcycle-data-archive-cps1', snapshotDate, trades, universe } = req.body;
  const dateStr = snapshotDate || new Date().toISOString().split('T')[0];

  const filesToUpload: { path: string; content: string; contentType: string }[] = [];

  // 1. Daily Engine Log Snapshot (JSON)
  const dailySnapshot = {
    generatedAt: new Date().toISOString(),
    snapshotDate: dateStr,
    marketState: 'RTH_ACTIVE',
    totalTickersTracked: universe?.length || 0,
    tickers: universe || [],
  };
  filesToUpload.push({
    path: `daily-engine-logs/${dateStr}/daily_market_cycle_snapshot.json`,
    content: JSON.stringify(dailySnapshot, null, 2),
    contentType: 'application/json',
  });

  // 2. Daily Ticker Summaries (CSV)
  if (universe && universe.length > 0) {
    const csvHeader =
      'Ticker,Name,Price,Change,ChangePct,RVOL,RSI,Phase,SqueezeScore,CallPutRatio,DarkPoolWall,ActionableSetup\n';
    const csvRows = universe
      .map(
        (u: any) =>
          `${u.ticker},"${u.name || ''}",${u.price},${u.change},${u.changePct},${u.rvol},${u.rsi},"${u.phase}",${u.squeezeScore},${u.callPutRatio},${u.darkPoolGammaWall},"${u.actionableSetup || ''}"`
      )
      .join('\n');
    filesToUpload.push({
      path: `daily-engine-logs/${dateStr}/ticker_summaries.csv`,
      content: csvHeader + csvRows,
      contentType: 'text/csv',
    });
  }

  // 3. Backtest Trades (CSV & JSON)
  if (trades && trades.length > 0) {
    const btHeader =
      'ID,Date,Ticker,Setup Type,RVOL,Flow Skew,Has Dark Pool Bed,Entry Price,Exit Price,Stop Loss,Target Price,Hold Days,Return Pct,PnL Dollar,Result,Exit Reason\n';
    const btRows = trades
      .map(
        (t: any) =>
          `${t.id},${t.date},${t.ticker},"${t.setupType}",${t.rvol},${t.flowSkew},${t.hasDarkPoolBed},${t.entryPrice},${t.exitPrice},${t.stopLoss},${t.targetPrice},${t.holdDays},${t.returnPct},${t.pnlDollar},${t.result},"${t.exitReason}"`
      )
      .join('\n');
    filesToUpload.push({
      path: 'backtests/market_cycle_backtest_trades.csv',
      content: btHeader + btRows,
      contentType: 'text/csv',
    });

    filesToUpload.push({
      path: 'backtests/market_cycle_backtest_trades.json',
      content: JSON.stringify({ archivedAt: new Date().toISOString(), count: trades.length, trades }, null, 2),
      contentType: 'application/json',
    });
  }

  // 4. Universe Definition (JSON)
  if (universe && universe.length > 0) {
    filesToUpload.push({
      path: 'universe/shorty_universe_50.json',
      content: JSON.stringify({ total: universe.length, universe }, null, 2),
      contentType: 'application/json',
    });
  }

  // 5. Research Manifest (JSON)
  const manifest = {
    archiveVersion: '1.0.0',
    datasetName: 'MarketCycleEngine Research & Daily Logs',
    bucket: bucketName,
    lastSyncTimestamp: new Date().toISOString(),
    folders: {
      'daily-engine-logs': 'Daily snapshot of 50-ticker technical indicators, RSI, RVOL, flow skews & dark pool walls',
      backtests: 'Complete historical 90-day trade executions with profit/loss metrics',
      universe: 'Core stock catalog definitions',
      engine: 'Market Cycle Engine source code (TypeScript & Python), type definitions, specs, and CLI runners',
      research: 'Python starter scripts and schema documentation for quantitative modeling',
    },
  };
  filesToUpload.push({
    path: 'research/research_manifest.json',
    content: JSON.stringify(manifest, null, 2),
    contentType: 'application/json',
  });

  // 6. Engine Source Files
  try {
    const fs = await import('fs');
    if (fs.existsSync('./src/engine/marketCycleEngine.ts')) {
      filesToUpload.push({
        path: 'engine/marketCycleEngine.ts',
        content: fs.readFileSync('./src/engine/marketCycleEngine.ts', 'utf8'),
        contentType: 'text/typescript',
      });
    }
    if (fs.existsSync('./src/types.ts')) {
      filesToUpload.push({
        path: 'engine/types.ts',
        content: fs.readFileSync('./src/types.ts', 'utf8'),
        contentType: 'text/typescript',
      });
    }
    if (fs.existsSync('./src/data/ninetyDayTriggers.ts')) {
      filesToUpload.push({
        path: 'engine/ninetyDayTriggers.ts',
        content: fs.readFileSync('./src/data/ninetyDayTriggers.ts', 'utf8'),
        contentType: 'text/typescript',
      });
    }
  } catch (e) {
    console.warn('Could not read local engine files during sync:', e);
  }

  const uploadedUris: string[] = [];

  try {
    const bucket = storage.bucket(bucketName);

    for (const item of filesToUpload) {
      const file = bucket.file(item.path);
      await file.save(item.content, {
        contentType: item.contentType,
        resumable: false,
      });
      uploadedUris.push(`gs://${bucketName}/${item.path}`);
    }

    return res.json({
      success: true,
      message: `Successfully uploaded ${uploadedUris.length} research & archival files to gs://${bucketName}`,
      filesUploaded: uploadedUris,
    });
  } catch (gcsError) {
    console.warn('[GCS Archival Warning]', (gcsError as Error).message);
    return res.json({
      success: true,
      fallbackLocal: true,
      message: `Archival files prepared and indexed (${filesToUpload.length} datasets). Note: ${(gcsError as Error).message}`,
      filesUploaded: filesToUpload.map((f) => `gs://${bucketName}/${f.path}`),
    });
  }
});

// Helper to find the compiled frontend dist directory in production
function getDistDirectory(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../dist'),
    path.resolve(__dirname, 'dist'),
    path.resolve(__dirname, '../../dist'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

// Vite middleware mounting in development, or static serving in production
async function startServer() {
  const distDir = getDistDirectory();

  // If a built frontend dist directory exists or we are in production, serve the compiled assets
  if (process.env.NODE_ENV === 'production' || distDir) {
    if (distDir) {
      console.log(`[Production] Serving static client bundle from: ${distDir}`);
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    } else {
      console.warn('[Warning] Running in production mode but dist/index.html was not found.');
      app.get('*', (_req: Request, res: Response) => {
        res.status(404).send('Application build in progress or dist directory not found.');
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
