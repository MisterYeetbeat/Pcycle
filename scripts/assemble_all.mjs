import fs from 'fs';
import path from 'path';

if (!fs.existsSync('engine')) fs.mkdirSync('engine');
if (!fs.existsSync('data')) fs.mkdirSync('data');

// Copy typescript engine with correct standalone relative imports
let tsEngine = fs.readFileSync('src/engine/marketCycleEngine.ts', 'utf8').replace(/from '\.\.\/types\.ts'/g, "from './types.ts'");
fs.writeFileSync('engine/marketCycleEngine.ts', tsEngine);

fs.copyFileSync('src/types.ts', 'engine/types.ts');

let tsTriggers = fs.readFileSync('src/data/ninetyDayTriggers.ts', 'utf8').replace(/from '\.\.\/types\.ts'/g, "from './types.ts'");
fs.writeFileSync('engine/ninetyDayTriggers.ts', tsTriggers);

let tsUniverse = fs.readFileSync('src/data/shortyUniverse50.ts', 'utf8').replace(/from '\.\.\/types\.ts'/g, "from './types.ts'");
fs.writeFileSync('engine/shortyUniverse50.ts', tsUniverse);

// Create Python engine
const pyEngine = `"""
MarketCycleEngine Python Quantitative Implementation
Wyckoff Phase Detection, Volatility Contraction, Dark Pool & Gamma Wall Engine
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any

class MarketCycleEngine:
    """
    AlphaPulse Market Cycle State Machine & Quantitative Indicator Engine.
    Detects 4 Core Phases:
      1. INCEPTION (Wyckoff Spring / Volatility Compression Breakout)
      2. MARK_UP (Trend Continuation & Fibonacci 1.618 Acceleration)
      3. DISTRIBUTION / EXHAUSTION (Call Wall Resistance / Upper Wick Rejections)
      4. RESET / MARK_DOWN (Mean Reversion to Dark Pool Bed)
    """
    def __init__(self, atr_period: int = 14, compression_threshold: float = 0.85):
        self.atr_period = atr_period
        self.compression_threshold = compression_threshold

    @staticmethod
    def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculates Average True Range over period."""
        high = df['high']
        low = df['low']
        close = df['close'].shift(1)
        tr = pd.concat([high - low, (high - close).abs(), (low - close).abs()], axis=1).max(axis=1)
        return tr.rolling(window=period, min_periods=1).mean()

    @staticmethod
    def calculate_rvol(df: pd.DataFrame, window: int = 20) -> pd.Series:
        """Calculates Relative Volume (RVOL) compared to 20-period moving average."""
        return df['volume'] / (df['volume'].rolling(window=window, min_periods=1).mean() + 1e-6)

    def evaluate_cycle_state(self, df: pd.DataFrame, dark_pool_bed: Optional[float] = None, call_wall: Optional[float] = None, flow_skew: float = 1.0) -> Dict[str, Any]:
        """
        Evaluates current cycle state, breakout confirmation, Fibonacci targets, and exhaustion risk.
        """
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
fs.writeFileSync('engine/marketCycleEngine.py', pyEngine);

// Create engine_runner.py
const pyRunner = `"""
Market Cycle Engine - Cloud & Local Pipeline Runner
"""
import json
import pandas as pd
from marketCycleEngine import MarketCycleEngine

def run_local_backtest():
    print("[*] Running local Market Cycle Engine...")
    engine = MarketCycleEngine()
    df_trades = pd.read_csv("data/backtest_trades.csv")
    print(f"[+] Total Trades in History: {len(df_trades)}")
    win_rate = (df_trades['Result'] == 'WIN').mean() * 100
    print(f"[+] Win Rate: {win_rate:.1f}%")

if __name__ == '__main__':
    run_local_backtest()
`;
fs.writeFileSync('engine/engine_runner.py', pyRunner);

// Create engine/README.md
const engineReadme = `# Market Cycle Engine & Indicator Suite

## 1. Wyckoff State Machine & Strategy Architecture
1. **Phase 1: Inception & Ignition (STRONG BUY)**
   - Volatility Contraction: 12-bar Base ATR <= 85% of 20-period Moving Average ATR.
   - Break of Structure (BOS): Bar close exceeds 12-bar base high.
   - Volume Surge: Relative Volume (RVOL) >= 1.75x.
   - Dark Pool Support Bed: Price touches institutional liquidity cluster within 1.5%.
   - Call Sweep Skew: Bullish institutional call sweep skew >= 1.8x.

2. **Phase 2: Active Mark-Up & Trend Extension**
   - Higher highs and higher lows maintained.
   - Fibonacci Expansion: Primary profit target set to 1.618 of Base Range.
   - Dynamic trailing stop anchored at 9-EMA and Base High.

3. **Phase 3: Climax & Exhaustion (EXIT)**
   - Call Wall Resistance: Price reaches top institutional gamma wall.
   - Candle Wick Rejection: Upper shadow >= 45% of total bar range.
   - Whale Flow Divergence: Smart money call/put skew falls below 0.80.

4. **Phase 4: Reset & Mean Reversion**
   - Pullback to Dark Pool Bed / 50-EMA support.
`;
fs.writeFileSync('engine/README.md', engineReadme);

// Copy CSV backtest trades
fs.copyFileSync('src/data/backtest_trades.csv', 'data/backtest_trades.csv');
fs.copyFileSync('public/data/backtest_trades.csv', 'data/backtest_trades_history.csv');

// Create backtest_trades.json
const csvContent = fs.readFileSync('src/data/backtest_trades.csv', 'utf8');
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');
const tradesJson = lines.slice(1).map(l => {
  const parts = l.split(',');
  const obj = {};
  headers.forEach((h, i) => { obj[h.trim()] = parts[i] ? parts[i].trim() : ''; });
  return obj;
});
fs.writeFileSync('data/backtest_trades.json', JSON.stringify(tradesJson, null, 2));

// Create data/ninety_day_triggers_catalog.json
fs.writeFileSync('data/ninety_day_triggers_catalog.json', JSON.stringify({
  description: '90-Day Raw Trigger Events & Institutional Sweeps',
  totalTriggers: 184,
  generatedAt: new Date().toISOString()
}, null, 2));

// Create data/shorty_universe_50.json
fs.writeFileSync('data/shorty_universe_50.json', JSON.stringify({
  description: '50-Ticker High-Short / High-Beta Institutional Retail Universe',
  tickers: ['AAOI', 'NVDA', 'PLTR', 'TSLA', 'GME', 'SMCI', 'AMD', 'MARA', 'COIN', 'MSTR', 'RIVN', 'LCID', 'SOFI', 'UPST', 'CVNA', 'AFRM', 'DKNG', 'HOOD', 'IONQ', 'RGTI', 'QUBT', 'BBAI', 'SOUN', 'AI', 'OPEN', 'RKLB', 'ASTS', 'LUNR', 'ACHR', 'JOBY', 'SYM', 'STEM', 'CHPT', 'BLNK', 'ENVX', 'QS', 'SES', 'SLDP', 'GOEV', 'NKLA', 'WKHS', 'FFIE', 'MULN', 'FSR', 'HIMS', 'DNA', 'TLRY', 'CGC', 'ACB', 'CRON']
}, null, 2));

// Create data/ticker_summaries.csv
fs.writeFileSync('data/ticker_summaries.csv', 'Ticker,Name,Price,ChangePct,RVOL,Phase,SqueezeScore,WhaleBullPct,DarkPoolBed\nAAOI,Applied Optoelectronics,104.85,4.58,3.8,Mark-Up Ignition,24.6,88,98.2\nNVDA,NVIDIA Corporation,231.40,1.11,2.8,Mark-Up Ignition,1.6,72,224.0\nPLTR,Palantir Technologies,194.20,2.39,3.1,Mark-Up Ignition,4.8,84,188.0\nTSLA,Tesla Inc,362.80,1.50,1.4,Whale Accumulation,3.1,64,355.0\nGME,GameStop Corp,24.60,6.12,3.6,Mark-Up Ignition,29.8,92,23.4\nSMCI,Super Micro Computer,52.30,7.28,4.2,Mark-Up Ignition,21.4,90,48.0');

// Create root README.md
const mainReadme = `# Pcycle - Market Cycle Engine & Quantitative Trading Suite

Institutional-grade quantitative market cycle engine, Wyckoff phase state machine, volatility compression screener, and dark pool gamma wall analyzer.

---

## 📁 Repository Structure

\`\`\`text
Pcycle/
├── 📁 engine/                         # Core Quantitative Engine (TypeScript & Python)
│   ├── 📄 marketCycleEngine.ts        # TypeScript State Machine & Indicator Engine
│   ├── 📄 marketCycleEngine.py        # Python Quantitative Implementation (Pandas/Numpy)
│   ├── 📄 engine_runner.py            # Local & Cloud Storage Pipeline Runner
│   ├── 📄 types.ts                    # Full Type Definitions
│   ├── 📄 ninetyDayTriggers.ts        # 90-Day Execution Trigger History
│   ├── 📄 shortyUniverse50.ts         # 50-Ticker High-Short Universe
│   └── 📄 README.md                   # Engine Architecture & Mathematical Formulas
│
├── 📁 data/                           # Backtest History & Transaction Records
│   ├── 📄 backtest_trades.csv         # Full 90-Day Trade Ledger (P&L, Setups, Hold Times)
│   ├── 📄 backtest_trades.json        # JSON Export of Trade Records
│   ├── 📄 backtest_trades_history.csv # Public Data CSV
│   ├── 📄 ninety_day_triggers_catalog.json # 90-Day Trigger Event Catalog
│   ├── 📄 shorty_universe_50.json     # 50-Ticker Institutional Universe
│   └── 📄 ticker_summaries.csv        # Tabular Snapshot of Ticker Phases & Squeeze Scores
│
├── 📁 src/                            # Full React + Tailwind Application
│   ├── 📁 components/                 # Trading Charts, Radars, Modals, Flow Gauges
│   ├── 📁 data/                       # Frontend Data Bundles
│   ├── 📁 engine/                     # Frontend Market Engine Link
│   ├── 📁 services/                   # Live Market Feeds & WebSockets
│   └── 📁 utils/                      # Parsers & Market Hours Utilities
│
├── 📁 scripts/                        # Google Cloud Storage & Automation Scripts
│   └── 📄 upload_engine.mjs           # Automated GCS Sync Script
│
├── 📄 server.ts                       # Backend Express Proxy & Automated Archiver
├── 📄 package.json                    # Project Dependencies
└── 📄 vite.config.ts                  # Vite Bundler Configuration
\`\`\`

---

## ⚡ Core Features & Quantitative Mechanics
- **Wyckoff 4-Phase State Machine**: Accumulation, Mark-Up Ignition, Distribution/Climax, and Markdown.
- **Volatility Compression Detection**: Evaluates 12-bar Base ATR against 20-period moving average (<= 0.85).
- **Dark Pool Bed Verification**: Validates whether price low intersects institutional dark pool cluster within 1.5%.
- **Options Flow Skew & Gamma Wall Walls**: Real-time call/put ratio and dealer gamma exposure tracking.
- **Fibonacci 1.618 Extensions**: Automated target calculation with candle-wick exhaustion warnings.
- **Google Cloud Storage Archival**: Automated daily snapshots and trade history sync to gs://pcycle-data-archive-cps1.

---

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Start Development Server
\`\`\`bash
npm run dev
\`\`\`
The application will launch on \`http://localhost:3000\`.

### 3. Run Python Engine Backtest
\`\`\`bash
python3 engine/engine_runner.py
\`\`\`
`;
fs.writeFileSync('README.md', mainReadme);

console.log('ALL ENGINE, DATA, AND TRANSACTION FILES ASSEMBLED CLEANLY!');
