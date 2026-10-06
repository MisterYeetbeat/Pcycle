import React from 'react';
import { DollarSign, Flame, Layers, ShieldAlert, Zap } from 'lucide-react';
import { RetailTicker } from '../types.ts';

interface WhalePressureCardProps {
  ticker: RetailTicker;
}

export const WhalePressureCard: React.FC<WhalePressureCardProps> = ({ ticker }) => {
  const isBullish = ticker.whaleFlowBullishPct >= 65;
  const isBearish = ticker.whaleFlowBullishPct <= 40;

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Whale &amp; Dark Pool Radar
          </h3>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">
          Unusual Whales Institutional Feed
        </span>
      </div>

      {/* Whale Flow Bar */}
      <div className="p-4 bg-neutral-950/70 rounded-xl border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400 font-medium">Smart Money Flow Dominance</span>
          <span
            className={`font-mono font-bold ${
              isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'
            }`}
          >
            {ticker.whaleFlowBullishPct}% Bullish Calls
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              isBullish
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : isBearish
                ? 'bg-rose-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${ticker.whaleFlowBullishPct}%` }}
          />
          <div
            className="h-full bg-rose-500/40"
            style={{ width: `${100 - ticker.whaleFlowBullishPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
          <span>Put Sweeps (Bearish)</span>
          <span>50% Neutral</span>
          <span className="text-emerald-400 font-bold">Call Sweeps at Ask (Bullish)</span>
        </div>
      </div>

      {/* Key Institutional Levels */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-sans">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Whale Support Floor</span>
          </div>
          <div className="text-base font-bold text-white mt-1">
            ${ticker.darkPoolBed?.toFixed(2) ?? 'Dynamic'}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            Dark pool blocks &ge; $500k
          </span>
        </div>

        <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-sans">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Resistance Ceiling</span>
          </div>
          <div className="text-base font-bold text-white mt-1">
            ${ticker.callWall?.toFixed(2) ?? 'Open Air'}
          </div>
          <span className="text-[10px] text-neutral-500 block mt-0.5">
            Spot GEX Call Wall
          </span>
        </div>
      </div>

      {/* Short Interest Fuel (if present) */}
      {ticker.shortInterestPct && ticker.shortInterestPct > 10 && (
        <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between text-amber-300 font-semibold font-sans">
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              Short Squeeze Catalyst
            </span>
            <span className="font-mono text-amber-400">{ticker.shortInterestPct}% Float Shorted</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
            Trapped short sellers will be forced to buy back shares if price sustains above{' '}
            <strong className="text-white font-mono">${ticker.price.toFixed(2)}</strong>. Days to
            cover: <strong className="text-white font-mono">{ticker.daysToCover} sessions</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
