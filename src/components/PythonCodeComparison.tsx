import React, { useState } from 'react';
import { Check, Copy, FileCode, Play, Terminal } from 'lucide-react';

export const PythonCodeComparison: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const pythonCode = `import zoneinfo
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import requests

class CyclePhase(Enum):
    ACCUMULATION = "ACCUMULATION"
    UPTICK_START = "UPTICK_START"
    MARKUP = "MARKUP"
    CYCLE_HIGH_END = "CYCLE_HIGH_END"
    NEUTRAL = "NEUTRAL"

@dataclass
class CycleState:
    ticker: str
    phase: CyclePhase
    entry_price: Optional[float]
    invalidation_level: Optional[float]
    cycle_target: Optional[float]
    real_rrr: float
    evidence: List[str]

class MarketCycleEngine:
    def __init__(self, massive_api_key: str, uw_api_key: str):
        self.massive_headers = {"Authorization": f"Bearer {massive_api_key}"}
        self.uw_headers = {"Authorization": f"Bearer {uw_api_key}", "Accept": "application/json"}
        self.massive_base = "https://api.massive.com/v1"
        self.uw_base = "https://api.unusualwhales.com/api"
        self.ny_tz = zoneinfo.ZoneInfo("America/New_York")

    # [1] BASE CONTRACTION & BREAK OF STRUCTURE (BOS)
    # base_atr < (avg_atr * 0.85)
    # current_close > base_high AND rvol >= 1.75
    # dark pool bed: base_low * 0.9925 <= lvl <= current_close
    # flow_skew >= 1.8 at Ask

    # [2] TERMINAL CYCLE CEILING & EXHAUSTION
    # delta = base_high - base_low
    # fib_1618 = base_high + (1.618 * delta)
    # cycle_target = min(fib_1618, call_wall)
    # Climax churn: rvol > 2.8 and upper_wick > 40%
    # Flow divergence: put aggression skew < 0.7

    # [3] EXPECTANCY GATE
    # stop_loss = base_low * 0.9985
    # real_rrr = (target - current_price) / (current_price - stop_loss)
    # gate: real_rrr >= 2.5:1`;

  const copyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Python MarketCycleEngine Architecture
          </h3>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white border border-zinc-700 transition"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Python Code'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
            <span>[1] Uptick Inception Gate</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Requires 4 concurrent signals:
            <br />
            &bull; Base ATR &lt; 85% of 20-period average
            <br />
            &bull; BOS: Close &gt; Prior 4-bar High
            <br />
            &bull; RVOL &ge; 1.75x surge
            <br />
            &bull; UW Call Ask Skew &ge; 1.80x
          </p>
        </div>

        <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
          <div className="font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
            <span>[2] Target & Asymmetric RRR</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            &bull; Fib 1.618 expansion: <code className="text-cyan-300">base_high + 1.618*&Delta;</code>
            <br />
            &bull; Target = <code className="text-cyan-300">min(Fib1.618, GEX Call Wall)</code>
            <br />
            &bull; Stop Loss = <code className="text-rose-300">base_low * 0.9985</code>
            <br />
            &bull; Gate: <strong className="text-emerald-400">RRR &ge; 2.50:1</strong>
          </p>
        </div>

        <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
          <div className="font-bold text-rose-400 flex items-center gap-1.5 font-mono">
            <span>[3] Cycle Ceiling Exhaustion</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Triggers CYCLE_HIGH_END if &ge; 2 conditions:
            <br />
            &bull; Price &ge; 99.5% of Target / Call Wall
            <br />
            &bull; Climax churn: RVOL &gt; 2.8x &amp; Wick &gt; 40%
            <br />
            &bull; Flow divergence: Net Delta Skew &lt; 0.70x
          </p>
        </div>
      </div>

      <div className="bg-black/60 rounded-xl border border-white/5 p-4 font-mono text-xs overflow-x-auto text-zinc-300">
        <pre>{pythonCode}</pre>
      </div>
    </div>
  );
};
