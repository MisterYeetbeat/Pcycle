import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

async function uploadEngineFiles() {
  const storage = new Storage();
  const bucketName = 'pcycle-data-archive-cps1';
  const bucket = storage.bucket(bucketName);

  const engineTs = fs.readFileSync('./src/engine/marketCycleEngine.ts', 'utf8');
  const typesTs = fs.readFileSync('./src/types.ts', 'utf8');
  const triggersTs = fs.readFileSync('./src/data/ninetyDayTriggers.ts', 'utf8');
  const shortyTs = fs.readFileSync('./src/data/shortyUniverse50.ts', 'utf8');

  const enginePy = `"""
MarketCycleEngine Python Implementation
Wyckoff Phase Detection, Volatility Contraction, Dark Pool & Gamma Wall Engine
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any

class MarketCycleEngine:
    def __init__(self, atr_period: int = 14, compression_threshold: float = 0.85):
        self.atr_period = atr_period
        self.compression_threshold = compression_threshold

    @staticmethod
    def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
        high = df['high']
        low = df['low']
        close = df['close'].shift(1)
        tr = pd.concat([high - low, (high - close).abs(), (low - close).abs()], axis=1).max(axis=1)
        return tr.rolling(window=period, min_periods=1).mean()

    @staticmethod
    def calculate_rvol(df: pd.DataFrame, window: int = 20) -> pd.Series:
        return df['volume'] / (df['volume'].rolling(window=window, min_periods=1).mean() + 1e-6)

    def evaluate_cycle_state(self, df: pd.DataFrame, dark_pool_bed: Optional[float] = None, call_wall: Optional[float] = None, flow_skew: float = 1.0) -> Dict[str, Any]:
        if len(df) < 15:
            return {'state': 'INSUFFICIENT_DATA', 'signal': 'NEUTRAL'}

        atr_series = self.calculate_atr(df, self.atr_period)
        rvol_series = self.calculate_rvol(df)
        
        current_close = df['close'].iloc[-1]
        current_high = df['high'].iloc[-1]
        current_low = df['low'].iloc[-1]
        current_open = df['open'].iloc[-1]
        current_rvol = rvol_series.iloc[-1]
        current_atr = atr_series.iloc[-1]
        avg_atr = atr_series.iloc[-20:].mean() if len(atr_series) >= 20 else current_atr

        base_df = df.iloc[-12:-1] if len(df) >= 13 else df.iloc[:-1]
        base_high = base_df['high'].max()
        base_low = base_df['low'].min()
        base_atr = atr_series.iloc[-12:-1].mean() if len(df) >= 13 else current_atr

        is_contracted = (base_atr / avg_atr) <= self.compression_threshold if avg_atr > 0 else False
        is_breakout = (current_close > base_high) and (current_rvol >= 1.75)
        has_dp_bed = False
        if dark_pool_bed is not None:
            has_dp_bed = abs(base_low - dark_pool_bed) / dark_pool_bed <= 0.015

        base_range = max(base_high - base_low, current_atr)
        fib_1618 = base_high + (base_range * 1.618)
        target = min(fib_1618, call_wall) if call_wall and call_wall > current_close else fib_1618

        candle_range = max(current_high - current_low, 0.01)
        upper_wick = max(current_high - max(current_open, current_close), 0)
        wick_ratio = upper_wick / candle_range

        exhaustion_signals = []
        if wick_ratio >= 0.45:
            exhaustion_signals.append('UPPER_WICK_REJECTION')
        if call_wall and (current_high >= call_wall * 0.995):
            exhaustion_signals.append('CALL_WALL_TOUCH')
        if flow_skew < 0.8:
            exhaustion_signals.append('BEARISH_FLOW_DIVERGENCE')

        if is_breakout and (is_contracted or has_dp_bed or flow_skew >= 1.8):
            state = 'IGNITION_BUY'
            phase = 'Mark-Up Ignition'
        elif current_close > base_high and not exhaustion_signals:
            state = 'RIDING_TREND'
            phase = 'Active Mark-Up'
        elif len(exhaustion_signals) >= 2:
            state = 'CLIMAX_EXIT'
            phase = 'Distribution / Climax'
        else:
            state = 'CONSOLIDATION'
            phase = 'Accumulation / Base'

        return {
            'state': state,
            'phase': phase,
            'current_close': round(current_close, 2),
            'base_high': round(base_high, 2),
            'base_low': round(base_low, 2),
            'rvol': round(current_rvol, 2),
            'target_1618': round(target, 2),
            'call_wall': call_wall,
            'dark_pool_bed': dark_pool_bed,
            'exhaustion_signals': exhaustion_signals
        }
`;

  const runnerPy = `"""
Market Cycle Engine - Automated Cloud Storage Runner
"""
import json
import pandas as pd
from google.cloud import storage
from marketCycleEngine import MarketCycleEngine

def run_pipeline():
    bucket_name = "${bucketName}"
    client = storage.Client()
    bucket = client.bucket(bucket_name)

    print(f"[*] Connecting to Cloud Storage bucket: {bucket_name}")
    engine = MarketCycleEngine()

    blob_universe = bucket.blob("universe/shorty_universe_50.json")
    if blob_universe.exists():
        universe_data = json.loads(blob_universe.download_as_text())
        print(f"[+] Loaded Universe: {universe_data.get('count', len(universe_data.get('universe', [])))} tickers")

    blob_trades = bucket.blob("backtests/market_cycle_backtest_trades.csv")
    if blob_trades.exists():
        df_trades = pd.read_csv(blob_trades.open("r"))
        print(f"[+] Loaded {len(df_trades)} backtest trades.")

    print("[✓] Engine Pipeline Execution Complete.")

if __name__ == '__main__':
    run_pipeline()
`;

  const engineReadme = `# AlphaPulse Market Cycle Engine Specification

## 1. Overview
The Market Cycle Engine implements a high-frequency and multi-timeframe quantitative state machine designed for institutional volatility compression and short-squeeze tracking across the 500+ ticker universe.

## 2. The 4-State Wyckoff Phase Engine
1. **Phase 1 - Inception / Ignition (STRONG BUY)**
   - Volatility Contraction: 12-bar Base ATR <= 85% of 20-period Moving Average ATR.
   - Break of Structure (BOS): Bar close exceeds 12-bar base high.
   - Volume Surge: Relative Volume (RVOL) >= 1.75x.
   - Dark Pool Validation: Low touches institutional dark pool liquidity cluster within 1.5%.
   - Options Flow Skew: Bullish call sweep ratio >= 1.8x.

2. **Phase 2 - Mark-Up Acceleration**
   - Higher highs and higher lows maintained.
   - Fibonacci Extension: Primary target set to 1.618 of Base Range.
   - Dynamic trailing stop anchored at 9-EMA and Base High.

3. **Phase 3 - Climax / Exhaustion (EXIT)**
   - Call Wall Resistance Collision: Price reaches top institutional gamma barrier.
   - Candle Wick Rejection: Upper shadow >= 45% of total bar range.
   - Whale Flow Divergence: Smart money call/put skew falls below 0.80.

4. **Phase 4 - Reset / Mean Reversion**
   - Pullback to Dark Pool Bed / 50-EMA support.

## 3. Cloud Storage Archive File Catalog
- engine/marketCycleEngine.ts - Production TypeScript engine
- engine/marketCycleEngine.py - Quantitative Python implementation for Jupyter & Pandas
- engine/engine_runner.py - Automated GCS runner script
- engine/types.ts - Core type definitions
- engine/ninetyDayTriggers.ts - 90-day trigger execution history
- engine/shortyUniverse50.ts - 50-ticker institutional short universe catalog
`;

  const files = [
    { path: 'engine/marketCycleEngine.ts', content: engineTs, type: 'text/typescript' },
    { path: 'engine/marketCycleEngine.py', content: enginePy, type: 'text/x-python' },
    { path: 'engine/engine_runner.py', content: runnerPy, type: 'text/x-python' },
    { path: 'engine/types.ts', content: typesTs, type: 'text/typescript' },
    { path: 'engine/ninetyDayTriggers.ts', content: triggersTs, type: 'text/typescript' },
    { path: 'engine/shortyUniverse50.ts', content: shortyTs, type: 'text/typescript' },
    { path: 'engine/README.md', content: engineReadme, type: 'text/markdown' },
  ];

  for (const f of files) {
    const file = bucket.file(f.path);
    await file.save(f.content, { contentType: f.type });
    console.log('Successfully saved to GCS: ' + f.path);
  }

  console.log('ALL ENGINE FILES UPLOADED TO gs://' + bucketName + '/engine/');
}

uploadEngineFiles().catch(console.error);
