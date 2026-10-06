import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { CyclePhase } from '../types.ts';
import { EvaluationDetails } from '../engine/marketCycleEngine.ts';

interface CycleSignalCardProps {
  evalDetails: EvaluationDetails;
}

export const CycleSignalCard: React.FC<CycleSignalCardProps> = ({ evalDetails }) => {
  const { state, baseAtr, avgAtr, isContracted, rvol, isBreakout, hasDpBed, flowSkew } = evalDetails;

  const getPhaseColor = (phase: CyclePhase) => {
    switch (phase) {
      case CyclePhase.UPTICK_START:
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          glow: 'shadow-emerald-500/10',
          icon: <ArrowUpRight className="h-6 w-6 text-emerald-400" />,
        };
      case CyclePhase.CYCLE_HIGH_END:
        return {
          bg: 'bg-rose-950/40 border-rose-500/40 text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          glow: 'shadow-rose-500/10',
          icon: <TrendingDown className="h-6 w-6 text-rose-400" />,
        };
      case CyclePhase.ACCUMULATION:
        return {
          bg: 'bg-amber-950/40 border-amber-500/40 text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          glow: 'shadow-amber-500/10',
          icon: <Layers className="h-6 w-6 text-amber-400" />,
        };
      case CyclePhase.MARKUP:
        return {
          bg: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          glow: 'shadow-cyan-500/10',
          icon: <TrendingUp className="h-6 w-6 text-cyan-400" />,
        };
      default:
        return {
          bg: 'bg-zinc-900/60 border-zinc-800 text-zinc-300',
          badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          glow: '',
          icon: <Clock className="h-6 w-6 text-zinc-400" />,
        };
    }
  };

  const style = getPhaseColor(state.phase);

  return (
    <div className={`border rounded-2xl p-5 shadow-2xl transition-all ${style.bg} ${style.glow} flex flex-col gap-5`}>
      {/* Header with state indicator */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 backdrop-blur">
            {style.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
                Engine State
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono border ${style.badge}`}>
                {state.phase}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {state.ticker}
            </h2>
          </div>
        </div>

        {/* Expectancy Gate Pill */}
        {state.phase === CyclePhase.UPTICK_START && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold">
                Expectancy Gate Passed
              </div>
              <div className="text-sm font-mono font-bold text-emerald-200">
                RRR {state.real_rrr}:1 <span className="text-xs text-emerald-400 font-normal">(&ge; 2.5:1)</span>
              </div>
            </div>
          </div>
        )}

        {state.phase === CyclePhase.CYCLE_HIGH_END && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <div className="text-right">
              <div className="text-[10px] text-rose-300 uppercase tracking-wider font-semibold">
                Terminal Cycle High
              </div>
              <div className="text-sm font-mono font-bold text-rose-200">
                Distribution Active
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Parameters (if active signal) */}
      {(state.entry_price || state.invalidation_level || state.cycle_target) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-4 rounded-xl border border-white/5 font-mono">
          <div>
            <div className="text-[10px] uppercase text-zinc-400 font-medium">Entry Price</div>
            <div className="text-lg font-bold text-white mt-0.5">
              ${state.entry_price?.toFixed(2) ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-rose-400 font-medium">Invalidation (SL)</div>
            <div className="text-lg font-bold text-rose-300 mt-0.5">
              ${state.invalidation_level?.toFixed(2) ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-emerald-400 font-medium">Cycle Target</div>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">
              ${state.cycle_target?.toFixed(2) ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-cyan-400 font-medium">Real RRR</div>
            <div className="text-lg font-bold text-cyan-300 mt-0.5">
              {state.real_rrr > 0 ? `${state.real_rrr.toFixed(2)}:1` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Microstructure Condition Audit Checklist */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>Microstructure Criteria Audit</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {/* 1. Base Contraction */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-400">1. Base Volatility Contraction</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className={isContracted ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {baseAtr > 0 ? `${baseAtr.toFixed(2)} vs ${(avgAtr * 0.85).toFixed(2)}` : 'N/A'}
              </span>
              {isContracted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-zinc-600" />
              )}
            </div>
          </div>

          {/* 2. Break of Structure */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-400">2. BOS on Expanding RVOL</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className={isBreakout ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {rvol > 0 ? `${rvol.toFixed(2)}x (≥ 1.75x)` : 'N/A'}
              </span>
              {isBreakout ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-zinc-600" />
              )}
            </div>
          </div>

          {/* 3. Dark Pool Bed */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-400">3. Dark Pool Support Bed</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className={hasDpBed ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {hasDpBed ? 'Bed Validated' : 'No Cluster'}
              </span>
              {hasDpBed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-zinc-600" />
              )}
            </div>
          </div>

          {/* 4. Options Flow Skew */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-400">4. Call Sweep Skew (UW)</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className={flowSkew >= 1.8 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {flowSkew.toFixed(2)}x (≥ 1.80x)
              </span>
              {flowSkew >= 1.8 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-zinc-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Engine Evidence Logs */}
      <div>
        <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          Engine Evidence & Logged Logic
        </div>
        <div className="space-y-1.5">
          {state.evidence.map((line: string, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-xs font-mono bg-black/50 p-2 rounded-lg border border-white/5 text-zinc-300"
            >
              <span className="text-emerald-400 font-bold">&bull;</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
