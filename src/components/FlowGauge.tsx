import React from 'react';
import { DollarSign, Flame, Layers, ShieldAlert, Zap } from 'lucide-react';
import { FlowAndGex } from '../types.ts';

interface FlowGaugeProps {
  flowData: FlowAndGex;
  shortyMeta?: {
    siFloat: number;
    dtc: number;
    feeRate: string;
    coilOn: boolean;
    relvol: number;
  };
}

export const FlowGauge: React.FC<FlowGaugeProps> = ({ flowData, shortyMeta }) => {
  const { call_wall, dp_levels, call_ask_premium, net_delta_skew } = flowData;

  // Normalized skew position: 1.0 is neutral, 1.8 is trigger, 3.0+ is extreme
  const skewPct = Math.min(100, Math.max(0, (net_delta_skew / 3.0) * 100));

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Institutional Flow & Microstructure
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">Unusual Whales + Shorty</span>
      </div>

      {/* Skew Meter */}
      <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Net Delta Flow Skew</span>
          <span
            className={`font-mono font-bold ${
              net_delta_skew >= 1.8
                ? 'text-emerald-400'
                : net_delta_skew < 0.7
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {net_delta_skew.toFixed(2)}x {net_delta_skew >= 1.8 ? '(Bullish Aggression)' : net_delta_skew < 0.7 ? '(Bearish Divergence)' : '(Neutral)'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              net_delta_skew >= 1.8
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : net_delta_skew < 0.7
                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                : 'bg-zinc-600'
            }`}
            style={{ width: `${skewPct}%` }}
          />
          {/* Threshold mark at 1.8x = 60% */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
            style={{ left: '60%' }}
            title="1.8x Inception Threshold"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>0.5x Put Skew</span>
          <span className="text-emerald-400 font-bold">1.8x Inception Gate</span>
          <span>3.0x+ Extreme</span>
        </div>
      </div>

      {/* Grid of micro indicators */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Call Wall */}
        <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>Spot GEX Call Wall</span>
          </div>
          <div className="text-base font-mono font-bold text-rose-300 mt-1">
            {call_wall ? `$${call_wall.toFixed(2)}` : 'None / OTM'}
          </div>
        </div>

        {/* Dark Pool Blocks */}
        <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
            <span>DP Blocks &ge; $500k</span>
          </div>
          <div className="text-base font-mono font-bold text-cyan-300 mt-1">
            {dp_levels.length > 0 ? `${dp_levels.length} clusters` : 'No prints'}
          </div>
        </div>
      </div>

      {/* Shorty Catalog Integration Block */}
      {shortyMeta && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              Shorty Squeeze Diagnostics
            </span>
            <span className="text-[10px] font-mono text-zinc-400">si_series_full</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block">SI % Float</span>
              <span className="font-bold text-white">{shortyMeta.siFloat}%</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Days to Cover</span>
              <span className="font-bold text-white">{shortyMeta.dtc} days</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Borrow Fee</span>
              <span className="font-bold text-amber-300">{shortyMeta.feeRate}</span>
            </div>
          </div>
          {shortyMeta.coilOn && (
            <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 pt-1 border-t border-emerald-900/40">
              <Layers className="h-3 w-3" />
              <span>Coil Active: Bollinger(20, 2&sigma;) inside Keltner(20, 1.5&times;ATR)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
