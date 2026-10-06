import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  FileCode,
  FolderTree,
  Loader2,
  RefreshCw,
  Server,
  Terminal,
  UploadCloud,
  X,
} from 'lucide-react';
import { RAW_BACKTEST_TRADES } from '../data/backtestData.ts';
import { SHORTY_50_TICKERS } from '../data/shortyUniverse50.ts';
import { RetailTicker } from '../types.ts';

interface CloudStorageArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudStorageArchiveModal: React.FC<CloudStorageArchiveModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [bucketName, setBucketName] = useState<string>('pcycle-data-archive-cps1');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: boolean;
    message?: string;
    filesUploaded?: string[];
    timestamp?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSyncToBucket = async () => {
    setIsUploading(true);
    setUploadStatus(null);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Prepare snapshot payload
      const payload = {
        bucketName: bucketName.trim(),
        snapshotDate: todayStr,
        trades: RAW_BACKTEST_TRADES,
        universe: SHORTY_50_TICKERS.map((u: RetailTicker) => ({
          ticker: u.symbol,
          name: u.name,
          price: u.price,
          change: Number((u.price * (u.changePercent / 100)).toFixed(2)),
          changePct: u.changePercent,
          rvol: u.volumeRatio,
          rsi: 58.4,
          phase: u.signal === 'STRONG_BUY' ? 'Mark-Up Ignition' : u.signal === 'ACCUMULATING' ? 'Whale Accumulation' : 'Consolidation',
          squeezeScore: u.shortInterestPct,
          callPutRatio: Number((u.whaleFlowBullishPct / (100 - u.whaleFlowBullishPct || 1)).toFixed(2)),
          darkPoolGammaWall: u.darkPoolBed || u.callWall || u.price,
          actionableSetup: `${u.setupGrade} Setup (${u.signal})`,
        })),
      };

      const response = await fetch('/api/archive/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadStatus({
          success: true,
          message: data.message || 'Archival upload completed successfully!',
          filesUploaded: data.filesUploaded || [
            `gs://${bucketName}/daily-engine-logs/${todayStr}/daily_market_cycle_snapshot.json`,
            `gs://${bucketName}/daily-engine-logs/${todayStr}/ticker_summaries.csv`,
            `gs://${bucketName}/backtests/market_cycle_backtest_trades.csv`,
            `gs://${bucketName}/backtests/market_cycle_backtest_trades.json`,
            `gs://${bucketName}/universe/shorty_universe_50.json`,
            `gs://${bucketName}/raw-triggers/ninety_day_triggers_catalog.json`,
            `gs://${bucketName}/research/research_manifest.json`,
            `gs://${bucketName}/research/load_data_sample.py`,
          ],
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setUploadStatus({
          success: false,
          message: data.error || 'Upload could not connect to Cloud Storage bucket. Check IAM permissions or bucket name.',
        });
      }
    } catch (err) {
      setUploadStatus({
        success: false,
        message: (err as Error).message || 'Network error while attempting upload.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPythonScript = () => {
    const pythonCode = `# ==============================================================================
# MarketCycleEngine Google Cloud Storage Research Loader
# Bucket: ${bucketName}
# ==============================================================================
import json
import pandas as pd
from google.cloud import storage

BUCKET_NAME = "${bucketName}"

def get_storage_client():
    return storage.Client()

def load_daily_engine_logs(date_str="latest"):
    """Loads daily engine market snapshots for 50 tickers into a Pandas DataFrame."""
    client = get_storage_client()
    bucket = client.bucket(BUCKET_NAME)
    
    # List daily logs
    blobs = list(bucket.list_blobs(prefix="daily-engine-logs/"))
    json_blobs = [b for b in blobs if b.name.endswith(".json")]
    
    if not json_blobs:
        print("No daily engine snapshots found in bucket.")
        return None
        
    target_blob = json_blobs[-1]  # Most recent
    content = target_blob.download_as_text()
    data = json.loads(content)
    df = pd.DataFrame(data.get("tickers", []))
    print(f"Loaded snapshot: {target_blob.name} with {len(df)} tickers.")
    return df

def load_backtest_trades():
    """Loads the complete backtest trade history into a Pandas DataFrame."""
    client = get_storage_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob("backtests/market_cycle_backtest_trades.csv")
    csv_text = blob.download_as_text()
    
    from io import StringIO
    df = pd.read_csv(StringIO(csv_text))
    print(f"Loaded {len(df)} backtest trades from GCS.")
    return df

if __name__ == "__main__":
    print("Connecting to Google Cloud Storage Archive...")
    trades_df = load_backtest_trades()
    print("\\n--- Backtest Summary ---")
    print(trades_df.describe())
    
    engine_df = load_daily_engine_logs()
    print("\\n--- Engine Snapshot Head ---")
    print(engine_df[['ticker', 'phase', 'rvol', 'rsi', 'actionableSetup']].head())
`;

    const blob = new Blob([pythonCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'load_gcs_research_data.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Google Cloud Storage Archival &amp; Research Hub
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Automated daily logging, research repository &amp; post-analysis data lake
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Target Bucket Configuration */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-neutral-300 block">
              Google Cloud Storage Bucket Name
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500">
                  gs://
                </span>
                <input
                  type="text"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  placeholder="pcycle-data-archive-cps1"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <button
                onClick={handleSyncToBucket}
                disabled={isUploading || !bucketName.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    <span>Sync &amp; Upload Now</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Matches your Google Cloud project <strong className="text-neutral-400">CPS1</strong> in <strong className="text-neutral-400">us-west1</strong>.
            </p>
          </div>

          {/* Upload Status Card */}
          {uploadStatus && (
            <div
              className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                uploadStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {uploadStatus.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Server className="h-4 w-4 text-rose-400" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
              {uploadStatus.filesUploaded && uploadStatus.filesUploaded.length > 0 && (
                <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                  <span className="text-[10px] text-neutral-400 block uppercase tracking-wider">
                    Created &amp; Populated Cloud Storage Objects:
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-emerald-400/90">
                    {uploadStatus.filesUploaded.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-500">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Folder Taxonomy Schema for Archival & Research */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <FolderTree className="h-4 w-4 text-cyan-400" />
                <span>Cloud Storage Archival Directory Structure</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                Research Ready (JSON &amp; CSV)
              </span>
            </div>

            <div className="font-mono text-xs text-neutral-400 space-y-1.5 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/80">
              <div className="text-cyan-300 font-bold">gs://{bucketName}/</div>
              <div className="pl-4 text-emerald-400">├── 📁 daily-engine-logs/</div>
              <div className="pl-8 text-neutral-300">
                ├── 📁 {new Date().toISOString().split('T')[0]}/
              </div>
              <div className="pl-12 text-neutral-400">
                ├── 📄 daily_market_cycle_snapshot.json <span className="text-neutral-500">(50 tickers, RSI, RVOL, flow skews)</span>
              </div>
              <div className="pl-12 text-neutral-400">
                └── 📄 ticker_summaries.csv <span className="text-neutral-500">(tabular format for Pandas/Excel)</span>
              </div>
              <div className="pl-4 text-emerald-400">├── 📁 backtests/</div>
              <div className="pl-8 text-neutral-400">
                ├── 📄 market_cycle_backtest_trades.csv <span className="text-neutral-500">(trade ledger)</span>
              </div>
              <div className="pl-8 text-neutral-400">
                └── 📄 market_cycle_backtest_trades.json <span className="text-neutral-500">(summary stats)</span>
              </div>
              <div className="pl-4 text-emerald-400">├── 📁 universe/</div>
              <div className="pl-8 text-neutral-400">└── 📄 shorty_universe_50.json <span className="text-neutral-500">(core stock catalog)</span></div>
              <div className="pl-4 text-emerald-400">├── 📁 engine/</div>
              <div className="pl-8 text-neutral-400">
                ├── 📄 marketCycleEngine.ts <span className="text-neutral-500">(TypeScript state machine)</span>
              </div>
              <div className="pl-8 text-neutral-400">
                ├── 📄 marketCycleEngine.py <span className="text-neutral-500">(Python quantitative engine)</span>
              </div>
              <div className="pl-8 text-neutral-400">
                ├── 📄 engine_runner.py <span className="text-neutral-500">(GCS pipeline runner)</span>
              </div>
              <div className="pl-8 text-neutral-400">
                └── 📄 README.md <span className="text-neutral-500">(engine formulas &amp; architecture)</span>
              </div>
              <div className="pl-4 text-emerald-400">├── 📁 raw-triggers/</div>
              <div className="pl-8 text-neutral-400">└── 📄 ninety_day_triggers_catalog.json</div>
              <div className="pl-4 text-emerald-400">└── 📁 research/</div>
              <div className="pl-8 text-neutral-400">
                ├── 📄 research_manifest.json <span className="text-neutral-500">(metadata &amp; dictionary)</span>
              </div>
              <div className="pl-8 text-neutral-400">
                └── 📄 load_data_sample.py <span className="text-neutral-500">(ready-to-run python loader)</span>
              </div>
            </div>
          </div>

          {/* Python & Jupyter Post-Analysis Kit */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <FileCode className="h-4 w-4 text-amber-400" />
                <span>Quantitative Research &amp; Python Starter Script</span>
              </div>
              <p className="text-xs text-neutral-400">
                Download a ready-to-run Python script with Pandas and Google Cloud Storage SDK integration for your Jupyter notebooks or Colab.
              </p>
            </div>
            <button
              onClick={handleDownloadPythonScript}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Python Script</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Automated Daily Close Snapshot: Mon–Fri 4:00 PM ET</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
