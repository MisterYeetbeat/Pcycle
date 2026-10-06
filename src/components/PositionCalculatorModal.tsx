import React, { useState } from 'react';
import { Calculator, Check, ShieldCheck, X } from 'lucide-react';
import { RetailTicker, TradePlan } from '../types.ts';

interface PositionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: RetailTicker;
  tradePlan: TradePlan;
}

export const PositionCalculatorModal: React.FC<PositionCalculatorModalProps> = ({
  isOpen,
  onClose,
  ticker,
  tradePlan,
}) => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);

  if (!isOpen) return null;

  const currentPrice = ticker.price;
  const stopLoss = tradePlan.stopLoss;
  const riskPerShare = Math.max(0.01, currentPrice - stopLoss);
  const dollarRisk = (accountBalance * riskPercent) / 100;
  const shares = Math.max(1, Math.floor(dollarRisk / riskPerShare));
  const capitalRequired = shares * currentPrice;
  const target1Profit = shares * Math.max(0, tradePlan.target1 - currentPrice);
  const target2Profit = shares * Math.max(0, tradePlan.target2 - currentPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Position Sizer &amp; Risk Manager
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                {ticker.symbol} · ${currentPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-neutral-300 font-medium block mb-1.5">
              Total Trading Account Capital ($)
            </label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Math.max(100, Number(e.target.value)))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-neutral-300 font-medium">Risk Tolerance per Trade</label>
              <span className="text-emerald-400 font-bold">{riskPercent}% (${dollarRisk.toFixed(0)})</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 1.5, 2, 3].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setRiskPercent(pct)}
                  className={`py-2 rounded-lg border text-center font-bold transition cursor-pointer ${
                    riskPercent === pct
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation Result Breakdown */}
        <div className="p-4 bg-neutral-950/90 rounded-xl border border-emerald-500/30 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-white">
            <span className="text-neutral-400">Recommended Order:</span>
            <span className="text-base font-bold text-emerald-400">
              {shares.toLocaleString()} Shares
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Capital Required:</span>
            <span className="text-white font-semibold tabular-nums">
              ${capitalRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Max Dollar Risk:</span>
            <span className="text-rose-400 font-bold tabular-nums">
              -${dollarRisk.toFixed(0)} ({riskPercent}% of account)
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Profit at Target 1 (${tradePlan.target1.toFixed(2)}):</span>
            <span className="text-emerald-300 font-bold tabular-nums">
              +${target1Profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Profit at Target 2 (${tradePlan.target2.toFixed(2)}):</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              +${target2Profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer"
        >
          Apply Sizing to Plan
        </button>
      </div>
    </div>
  );
};
