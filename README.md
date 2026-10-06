# Pcycle - Market Cycle Engine & Quantitative Trading Suite

Institutional-grade quantitative market cycle engine, Wyckoff phase state machine, volatility compression screener, and dark pool gamma wall analyzer.

---

## 📁 Repository Structure

```text
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
```

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
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 3. Run Python Engine Backtest
```bash
python3 engine/engine_runner.py
```
