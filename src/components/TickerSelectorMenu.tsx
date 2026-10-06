import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Database,
  Flame,
  Globe,
  Radio,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { RetailTicker } from '../types.ts';

interface TickerSelectorMenuProps {
  tickers: RetailTicker[];
  selectedTicker: RetailTicker;
  topRankedSymbol: string;
  isAutoFollow: boolean;
  onSelectTicker: (symbol: string) => void;
  onToggleAutoFollow: () => void;
  dataMode: 'LIVE' | 'HISTORICAL';
  onChangeDataMode: (mode: 'LIVE' | 'HISTORICAL') => void;
}

export const TickerSelectorMenu: React.FC<TickerSelectorMenuProps> = ({
  tickers,
  selectedTicker,
  topRankedSymbol,
  isAutoFollow,
  onSelectTicker,
  onToggleAutoFollow,
  dataMode,
  onChangeDataMode,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SQUEEZE'>('ALL');

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const dataMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) {
        setIsDataMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Split tickers into Top 10 and the rest
  const top10Tickers = useMemo(() => tickers.slice(0, 10), [tickers]);
  const remainingTickers = useMemo(() => tickers.slice(10), [tickers]);

  // Check if currently selected ticker is inside the remaining list
  const isSelectedInRemaining = remainingTickers.some(
    (t) => t.symbol === selectedTicker.symbol
  );

  // Filter for remaining tickers dropdown search
  const filteredRemainingTickers = useMemo(() => {
    return remainingTickers.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSymbol = t.symbol.toLowerCase().includes(q);
        const matchesName = t.name.toLowerCase().includes(q);
        if (!matchesSymbol && !matchesName) return false;
      }

      if (filterType === 'BUY') return t.signal === 'STRONG_BUY';
      if (filterType === 'SQUEEZE') return (t.shortInterestPct ?? 0) >= 15;
      return true;
    });
  }, [remainingTickers, searchQuery, filterType]);

  return (
    <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl shadow-xl flex flex-col gap-3 font-mono">
      {/* Subheader Toolbar: Section Title + Global Ticker Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>TOP 10 MARKET WATCH</span>
          </div>
          <span className="text-[11px] text-neutral-400 hidden md:inline font-sans">
            Highest-conviction cycle setups ranked by momentum, whale pressure &amp; RRR
          </span>
        </div>

        {/* Right side: More Tickers dropdown, Auto-Follow, and Data Source */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown for the Rest of the Tickers */}
          <div className="relative shrink-0" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition cursor-pointer select-none ${
                isSelectedInRemaining
                  ? 'bg-neutral-800 border-cyan-500/80 text-white shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
              }`}
            >
              {isSelectedInRemaining ? (
                <>
                  <span className="font-bold text-cyan-300">{selectedTicker.symbol}</span>
                  <span className="text-neutral-300 tabular-nums">
                    ${selectedTicker.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-sans">(Active)</span>
                  <ChevronDown className="h-3 w-3 text-cyan-400" />
                </>
              ) : (
                <>
                  <span>More Tickers ({remainingTickers.length})</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${
                      isMoreMenuOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </>
              )}
            </button>

            {/* Dropdown Menu for Remaining Tickers */}
            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] rounded-xl border border-neutral-800 bg-neutral-950/98 p-3 shadow-2xl backdrop-blur-xl z-50 font-mono text-xs">
                {/* Search Bar */}
                <div className="relative mb-2.5">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder={`Search remaining ${remainingTickers.length} tickers...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/50 text-xs"
                    autoFocus
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800/80 mb-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilterType('ALL')}
                    className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                      filterType === 'ALL'
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({remainingTickers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('BUY')}
                    className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                      filterType === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                        : 'text-neutral-400 hover:text-emerald-400'
                    }`}
                  >
                    Strong Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('SQUEEZE')}
                    className={`flex-1 py-1 rounded text-center transition cursor-pointer ${
                      filterType === 'SQUEEZE'
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-neutral-400 hover:text-amber-400'
                    }`}
                  >
                    Squeeze ({'>'}15%)
                  </button>
                </div>

                {/* Remaining Tickers List */}
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {filteredRemainingTickers.map((t, i) => {
                    const isCurrent = t.symbol === selectedTicker.symbol;

                    return (
                      <button
                        key={t.symbol}
                        type="button"
                        onClick={() => {
                          onSelectTicker(t.symbol);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition cursor-pointer text-left ${
                          isCurrent
                            ? 'bg-neutral-800/90 border border-neutral-700 text-white shadow-sm'
                            : 'hover:bg-neutral-900/80 text-neutral-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-neutral-500 w-6 font-mono">
                            #{i + 11}
                          </span>
                          <span className="font-bold text-white w-14">{t.symbol}</span>
                          <span className="truncate max-w-[120px] text-[11px] text-neutral-400">
                            {t.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span className="tabular-nums text-white">${t.price.toFixed(2)}</span>
                          <span
                            className={`tabular-nums text-[11px] w-14 text-right font-semibold ${
                              t.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {t.changePercent >= 0 ? '+' : ''}
                            {t.changePercent.toFixed(1)}%
                          </span>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Auto-Follow #1 Setup Button */}
          <button
            type="button"
            onClick={onToggleAutoFollow}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer border ${
              isAutoFollow
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
            title="Automatically track the #1 mathematically ranked market cycle opportunity"
          >
            <Flame
              className={`h-3.5 w-3.5 ${
                isAutoFollow ? 'text-amber-400 animate-pulse' : 'text-neutral-500'
              }`}
            />
            <span className="hidden sm:inline">Auto-Follow</span>
            <span>#1 ({topRankedSymbol})</span>
            {isAutoFollow && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            )}
          </button>

          {/* Data Source Selector Menu */}
          <div className="relative shrink-0" ref={dataMenuRef}>
            <button
              type="button"
              onClick={() => setIsDataMenuOpen(!isDataMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">
                {dataMode === 'LIVE' ? 'Real-Time 2026' : 'Shorty Catalog'}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${
                  isDataMenuOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {isDataMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-800 bg-neutral-950/98 p-2 shadow-2xl backdrop-blur-xl z-50 font-mono text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Select Active Dataset
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onChangeDataMode('LIVE');
                    setIsDataMenuOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                    dataMode === 'LIVE'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-bold">Real-Time Market Feed (2026)</div>
                    <div className="text-[10px] text-neutral-400 font-normal mt-0.5 font-sans">
                      Live 5M session bars, options sweeps &amp; dark pool flow.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChangeDataMode('HISTORICAL');
                    setIsDataMenuOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                    dataMode === 'HISTORICAL'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Globe className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-bold">Shorty Catalog Archive</div>
                    <div className="text-[10px] text-neutral-400 font-normal mt-0.5 font-sans">
                      56,531 historical rows across top short interest tickers.
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 10 Displayed in Exactly 2 Rows of 5 (No Scroll) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {top10Tickers.map((t, idx) => {
          const isSelected = t.symbol === selectedTicker.symbol;
          const isTopRanked = t.symbol === topRankedSymbol;

          return (
            <button
              key={t.symbol}
              type="button"
              onClick={() => onSelectTicker(t.symbol)}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-mono transition cursor-pointer select-none ${
                isSelected
                  ? 'bg-neutral-800 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                  : 'bg-neutral-950/80 border-neutral-800/90 text-neutral-300 hover:border-neutral-700 hover:text-white hover:bg-neutral-900'
              }`}
              title={`${t.name} · ${t.signal} · ${t.volumeRatio.toFixed(1)}x Vol`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isTopRanked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  #{idx + 1}
                </span>

                <div className="text-left">
                  <span className="font-bold text-white block leading-tight">{t.symbol}</span>
                  <span className="text-[10px] text-neutral-500 truncate block max-w-[65px] font-sans">
                    {t.name.split(' ')[0]}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="tabular-nums text-white text-xs font-semibold leading-tight">
                  ${t.price.toFixed(2)}
                </div>
                <div
                  className={`tabular-nums text-[10px] font-bold ${
                    t.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {t.changePercent >= 0 ? '+' : ''}
                  {t.changePercent.toFixed(1)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
