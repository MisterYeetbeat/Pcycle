import React, { useMemo } from 'react';
import { BarData } from '../types.ts';

interface CandlestickChartProps {
  bars: BarData[];
  baseHigh?: number;
  baseLow?: number;
  callWall?: number | null;
  dpLevels?: number[];
  invalidationLevel?: number | null;
  cycleTarget?: number | null;
  ticker: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  bars,
  baseHigh,
  baseLow,
  callWall,
  dpLevels = [],
  invalidationLevel,
  cycleTarget,
  ticker,
}) => {
  const chartHeight = 280;
  const volHeight = 60;
  const padding = { top: 20, right: 70, bottom: 25, left: 10 };

  const { minPrice, maxPrice, maxVol, avgVol } = useMemo(() => {
    if (!bars.length) {
      return { minPrice: 0, maxPrice: 100, maxVol: 1000, avgVol: 500 };
    }
    const allLows = bars.map((b) => b.low);
    const allHighs = bars.map((b) => b.high);

    if (baseLow) allLows.push(baseLow);
    if (invalidationLevel) allLows.push(invalidationLevel);
    if (baseHigh) allHighs.push(baseHigh);
    if (callWall && callWall < Math.max(...allHighs) * 1.3) allHighs.push(callWall);
    if (cycleTarget && cycleTarget < Math.max(...allHighs) * 1.3) allHighs.push(cycleTarget);

    const min = Math.min(...allLows);
    const max = Math.max(...allHighs);
    const rangePad = (max - min) * 0.1 || 1;

    const vols = bars.map((b) => b.volume);
    const maxV = Math.max(...vols);
    const avgV = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);

    return {
      minPrice: min - rangePad,
      maxPrice: max + rangePad,
      maxVol: maxV * 1.15 || 1000,
      avgVol: avgV,
    };
  }, [bars, baseHigh, baseLow, callWall, dpLevels, invalidationLevel, cycleTarget]);

  const priceToY = (price: number) => {
    const range = maxPrice - minPrice || 1;
    return padding.top + (1 - (price - minPrice) / range) * (chartHeight - padding.top - padding.bottom);
  };

  const volToH = (vol: number) => {
    return (vol / maxVol) * volHeight;
  };

  const candleWidth = 6;
  const spacing = 16;
  const totalSvgWidth = Math.max(600, bars.length * spacing + padding.left + padding.right);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-wide">{ticker} 5M Intraday</span>
          <span className="text-xs text-zinc-400">({bars.length} bars)</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          {callWall && (
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-0.5 bg-rose-400"></span>
              <span>GEX Call Wall: ${callWall.toFixed(2)}</span>
            </div>
          )}
          {dpLevels.length > 0 && (
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400 border-dashed"></span>
              <span>Dark Pool Bed: ${dpLevels[0].toFixed(2)}</span>
            </div>
          )}
          {baseHigh && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-0.5 bg-amber-400"></span>
              <span>Base High (BOS): ${baseHigh.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-x-auto select-none">
        <svg width={totalSvgWidth} height={chartHeight + volHeight} className="overflow-visible font-mono">
          <defs>
            <linearGradient id="volGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="volRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="volSurge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const p = minPrice + pct * (maxPrice - minPrice);
            const y = priceToY(p);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={totalSvgWidth - padding.right}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="3 3"
                />
                <text
                  x={totalSvgWidth - padding.right + 8}
                  y={y + 4}
                  fill="#71717a"
                  fontSize="10"
                >
                  ${p.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Base Contraction Box if baseHigh & baseLow available */}
          {baseHigh && baseLow && (
            <g>
              <rect
                x={padding.left + (bars.length - 6) * spacing - 4}
                y={priceToY(baseHigh)}
                width={5 * spacing + 8}
                height={Math.max(4, priceToY(baseLow) - priceToY(baseHigh))}
                fill="#f59e0b"
                fillOpacity="0.08"
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <line
                x1={padding.left}
                y1={priceToY(baseHigh)}
                x2={totalSvgWidth - padding.right}
                y2={priceToY(baseHigh)}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />
              <text
                x={padding.left + (bars.length - 6) * spacing}
                y={priceToY(baseHigh) - 6}
                fill="#f59e0b"
                fontSize="10"
                fontWeight="bold"
              >
                BOS Pivot (${baseHigh.toFixed(2)})
              </text>
            </g>
          )}

          {/* Call Wall Line */}
          {callWall && (
            <g>
              <line
                x1={padding.left}
                y1={priceToY(callWall)}
                x2={totalSvgWidth - padding.right}
                y2={priceToY(callWall)}
                stroke="#f43f5e"
                strokeWidth="1.5"
              />
              <text
                x={totalSvgWidth - padding.right + 8}
                y={priceToY(callWall) + 3}
                fill="#f43f5e"
                fontSize="10"
                fontWeight="bold"
              >
                GEX Call Wall
              </text>
            </g>
          )}

          {/* Dark Pool Support Bed Lines */}
          {dpLevels.map((lvl, idx) => (
            <g key={`dp-${idx}`}>
              <line
                x1={padding.left}
                y1={priceToY(lvl)}
                x2={totalSvgWidth - padding.right}
                y2={priceToY(lvl)}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              <text
                x={padding.left + 6}
                y={priceToY(lvl) - 4}
                fill="#06b6d4"
                fontSize="9"
              >
                Dark Pool Bed ${lvl.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Invalidation Stop Loss level */}
          {invalidationLevel && (
            <g>
              <line
                x1={padding.left}
                y1={priceToY(invalidationLevel)}
                x2={totalSvgWidth - padding.right}
                y2={priceToY(invalidationLevel)}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <text
                x={totalSvgWidth - padding.right + 8}
                y={priceToY(invalidationLevel) + 3}
                fill="#ef4444"
                fontSize="10"
                fontWeight="bold"
              >
                SL: ${invalidationLevel.toFixed(2)}
              </text>
            </g>
          )}

          {/* Cycle Target level */}
          {cycleTarget && (
            <g>
              <line
                x1={padding.left}
                y1={priceToY(cycleTarget)}
                x2={totalSvgWidth - padding.right}
                y2={priceToY(cycleTarget)}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x={totalSvgWidth - padding.right + 8}
                y={priceToY(cycleTarget) + 3}
                fill="#10b981"
                fontSize="10"
                fontWeight="bold"
              >
                Target: ${cycleTarget.toFixed(2)}
              </text>
            </g>
          )}

          {/* Volume separator */}
          <line
            x1={padding.left}
            y1={chartHeight}
            x2={totalSvgWidth - padding.right}
            y2={chartHeight}
            stroke="#3f3f46"
            strokeWidth="1"
          />

          {/* Candles & Volume Bars */}
          {bars.map((bar, i) => {
            const x = padding.left + i * spacing;
            const isGreen = bar.close >= bar.open;
            const candleTop = priceToY(Math.max(bar.open, bar.close));
            const candleBot = priceToY(Math.min(bar.open, bar.close));
            const bodyHeight = Math.max(1.5, candleBot - candleTop);
            const wickTop = priceToY(bar.high);
            const wickBot = priceToY(bar.low);

            const isSurge = avgVol > 0 && bar.volume / avgVol >= 1.75;
            const volH = volToH(bar.volume);
            const volY = chartHeight + volHeight - volH;

            return (
              <g key={i}>
                {/* Candle wick */}
                <line
                  x1={x}
                  y1={wickTop}
                  x2={x}
                  y2={wickBot}
                  stroke={isGreen ? '#10b981' : '#ef4444'}
                  strokeWidth="1"
                />

                {/* Candle body */}
                <rect
                  x={x - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isGreen ? '#10b981' : '#ef4444'}
                  rx="1"
                />

                {/* Volume bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volH}
                  fill={isSurge ? 'url(#volSurge)' : isGreen ? 'url(#volGreen)' : 'url(#volRed)'}
                  rx="1"
                />

                {/* Surge indicator dot on volume */}
                {isSurge && (
                  <circle cx={x} cy={chartHeight + 6} r="2.5" fill="#06b6d4" />
                )}

                {/* Timestamp label every 5 bars */}
                {i % 5 === 0 && (
                  <text
                    x={x}
                    y={chartHeight + volHeight + 14}
                    fill="#71717a"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {bar.timestamp}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"></span> Bullish
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-rose-500 inline-block"></span> Bearish
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block"></span> Volume Surge RVOL &ge; 1.75x
          </span>
        </div>
        <div className="font-mono text-zinc-400">
          Last Close: <span className="text-white font-bold">${bars[bars.length - 1]?.close.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
