import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Flame,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { RetailTicker, TradePlan } from '../types.ts';

interface TradeSetupPanelProps {
  ticker: RetailTicker;
  tradePlan: TradePlan;
  onOpenCalculator: () => void;
}

export const TradeSetupPanel: React.FC<TradeSetupPanelProps> = ({
  ticker,
  tradePlan,
  onOpenCalculator,
}) => {
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);

  const currentPrice = ticker.price;
  const stopLoss = tradePlan.stopLoss;
  const riskPerShare = Math.max(0.01, currentPrice - stopLoss);
  const dollarRisk = (accountSize * riskPercent) / 100;
  const sharesToBuy = Math.max(1, Math.floor(dollarRisk / riskPerShare));
  const capitalRequired = sharesToBuy * currentPrice;
  const profitAtTarget1 = sharesToBuy * Math.max(0, tradePlan.target1 - currentPrice);

  const isBuy = tradePlan.signal === 'STRONG_BUY';
  const isTakeProfit = tradePlan.signal === 'TAKE_PROFIT';

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-xs font-mono">
      {/* Top Signal & Setup Grade Header */}
      <div className="pb-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold shadow-md shrink-0 ${
              isBuy
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                : isTakeProfit
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                : 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
            }`}
          >
            {isBuy ? (
              <TrendingUp className="h-4.5 w-4.5" />
            ) : isTakeProfit ? (
              <TrendingDown className="h-4.5 w-4.5" />
            ) : (
              <Zap className="h-4.5 w-4.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isBuy
                    ? 'bg-emerald-500 text-neutral-950'
                    : isTakeProfit
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-500 text-neutral-950'
                }`}
              >
                {tradePlan.badgeText}
              </span>
              <span className="text-[10px] text-amber-400 font-bold border border-amber-500/30 px-1.5 py-0.5 rounded bg-amber-500/10">
                Grade {ticker.setupGrade}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-1 truncate">
              {ticker.symbol} · ${ticker.price.toFixed(2)}
            </h3>
          </div>
        </div>

        {isBuy && (
          <div className="text-right shrink-0">
            <span className="text-[10px] text-neutral-400 block">EDGE</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {tradePlan.rrr}:1 RRR
            </span>
          </div>
        )}
      </div>

      {/* Actionable Plain-English Summary */}
      <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-[11px] font-sans text-neutral-300 leading-snug">
        <span className="text-white font-semibold block mb-0.5">Execution Summary:</span>
        {tradePlan.actionSummary}
      </div>

      {/* Key Trading Level Brackets */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/80 border border-neutral-800">
          <span className="text-neutral-400">Entry Target</span>
          <span className="font-bold text-white">${tradePlan.entryPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/80 border border-rose-900/40">
          <span className="text-rose-400">Stop Loss</span>
          <span className="font-bold text-rose-300">
            ${tradePlan.stopLoss.toFixed(2)}{' '}
            <span className="text-[10px] font-normal">(-{tradePlan.riskPercent}%)</span>
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/80 border border-emerald-900/40">
          <span className="text-emerald-400">Target 1</span>
          <span className="font-bold text-emerald-300">
            ${tradePlan.target1.toFixed(2)}{' '}
            <span className="text-[10px] font-normal">(+{tradePlan.rewardPercent}%)</span>
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/80 border border-cyan-900/40">
          <span className="text-cyan-400">Target 2</span>
          <span className="font-bold text-cyan-300">
            ${tradePlan.target2.toFixed(2)}{' '}
            <span className="text-[10px] font-normal">
              (+{(tradePlan.rewardPercent * 1.5).toFixed(1)}%)
            </span>
          </span>
        </div>
      </div>

      {/* Compact Position Sizer */}
      {isBuy && (
        <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Sizer ({riskPercent}% Risk)
            </span>
            <button
              onClick={onOpenCalculator}
              className="text-cyan-400 hover:text-cyan-300 underline text-[10px]"
            >
              Full Calc
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Buy Shares</span>
              <span className="font-bold text-emerald-400 text-xs">
                {sharesToBuy.toLocaleString()} shs
              </span>
            </div>
            <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-rose-400 block">Risk Cap</span>
              <span className="font-bold text-rose-300 text-xs">-${dollarRisk.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Whale Confirmation Points */}
      <div>
        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5">
          Microstructure Factors
        </span>
        <div className="space-y-1 text-[11px] font-sans">
          {tradePlan.reasons.slice(0, 3).map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-neutral-300 p-1.5 rounded bg-neutral-950/50 border border-neutral-800/60 leading-tight"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
