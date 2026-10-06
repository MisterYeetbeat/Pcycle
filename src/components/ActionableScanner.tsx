import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Flame,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { RetailTicker, SignalType } from '../types.ts';
import { DropdownMenu, DropdownMenuItem } from './common/DropdownMenu.tsx';

interface ActionableScannerProps {
  tickers: RetailTicker[];
  selectedTicker: RetailTicker;
  onSelectTicker: (ticker: RetailTicker) => void;
}

export const ActionableScanner: React.FC<ActionableScannerProps> = ({
  tickers,
  selectedTicker,
  onSelectTicker,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'BUY_ONLY' | 'SQUEEZE' | 'EXIT'>('ALL');
  const [sortBy, setSortBy] = useState<'rvol' | 'flow' | 'rrr' | 'price' | 'symbol'>('rvol');
  const [search, setSearch] = useState('');

  const filteredTickers = useMemo(() => {
    return tickers
      .filter((t) => {
        if (search) {
          const q = search.toLowerCase();
          if (!t.symbol.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) {
            return false;
          }
        }

        if (filter === 'BUY_ONLY') return t.signal === 'STRONG_BUY';
        if (filter === 'EXIT') return t.signal === 'TAKE_PROFIT';
        if (filter === 'SQUEEZE') return (t.shortInterestPct ?? 0) >= 15;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rvol') return b.volumeRatio - a.volumeRatio;
        if (sortBy === 'flow') return b.whaleFlowBullishPct - a.whaleFlowBullishPct;
        if (sortBy === 'rrr') return b.rrr - a.rrr;
        if (sortBy === 'price') return b.price - a.price;
        if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol);
        return 0;
      });
  }, [tickers, filter, sortBy, search]);

  // Filter Menu Items
  const filterMenuItems: DropdownMenuItem[] = [
    {
      id: 'all',
      type: 'radio',
      label: `All Setups (${tickers.length})`,
      description: 'Show full universe of monitored assets',
      checked: filter === 'ALL',
      onClick: () => setFilter('ALL'),
    },
    {
      id: 'buy',
      type: 'radio',
      label: 'Strong Buy Only',
      description: 'Institutional accumulation & breakout triggers',
      icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
      checked: filter === 'BUY_ONLY',
      onClick: () => setFilter('BUY_ONLY'),
    },
    {
      id: 'squeeze',
      type: 'radio',
      label: 'Short Squeeze (>15% SI)',
      description: 'High short interest float compression',
      icon: <Flame className="h-3.5 w-3.5 text-amber-400" />,
      checked: filter === 'SQUEEZE',
      onClick: () => setFilter('SQUEEZE'),
    },
    {
      id: 'exit',
      type: 'radio',
      label: 'Take Profit / Exit',
      description: 'Overextended climax or trailing stop hit',
      icon: <TrendingDown className="h-3.5 w-3.5 text-rose-400" />,
      checked: filter === 'EXIT',
      onClick: () => setFilter('EXIT'),
    },
  ];

  // Sort Menu Items
  const sortMenuItems: DropdownMenuItem[] = [
    {
      id: 'sort_rvol',
      type: 'radio',
      label: 'Relative Volume Surge',
      description: 'Highest volume multiplier vs 20D avg',
      checked: sortBy === 'rvol',
      onClick: () => setSortBy('rvol'),
    },
    {
      id: 'sort_flow',
      type: 'radio',
      label: 'Whale Flow Bullish %',
      description: 'Highest dark pool & ask sweep pressure',
      checked: sortBy === 'flow',
      onClick: () => setSortBy('flow'),
    },
    {
      id: 'sort_rrr',
      type: 'radio',
      label: 'Reward / Risk Ratio',
      description: 'Highest mathematical payout vs stop risk',
      checked: sortBy === 'rrr',
      onClick: () => setSortBy('rrr'),
    },
    {
      id: 'sort_price',
      type: 'radio',
      label: 'Share Price (High to Low)',
      description: 'Sort by current market quotation',
      checked: sortBy === 'price',
      onClick: () => setSortBy('price'),
    },
    {
      id: 'sort_symbol',
      type: 'radio',
      label: 'Ticker Symbol (A - Z)',
      description: 'Alphabetical sorting',
      checked: sortBy === 'symbol',
      onClick: () => setSortBy('symbol'),
    },
  ];

  const getFilterLabel = () => {
    switch (filter) {
      case 'BUY_ONLY':
        return 'Filter: Strong Buy';
      case 'SQUEEZE':
        return 'Filter: Squeezes';
      case 'EXIT':
        return 'Filter: Exits';
      case 'ALL':
      default:
        return 'Filter: All Setups';
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'rvol':
        return 'Sort: RelVol';
      case 'flow':
        return 'Sort: Whale Flow';
      case 'rrr':
        return 'Sort: RRR';
      case 'price':
        return 'Sort: Price';
      case 'symbol':
        return 'Sort: Symbol';
      default:
        return 'Sort';
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Page Subheader with Grouped Menus & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-mono">
            High-Probability Setup Scanner
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time institutional flow &amp; volume expansion opportunities across active universe
          </p>
        </div>

        {/* Grouped Controls: Search, Filter Menu, Sort Menu */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 md:w-60">
            <Search className="h-3.5 w-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker or name..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>

          {/* Filter Menu */}
          <DropdownMenu
            label={getFilterLabel()}
            icon={<Filter className="h-3.5 w-3.5 text-cyan-400" />}
            items={filterMenuItems}
            badgeCount={filteredTickers.length}
            headerTitle="Filter Criteria"
          />

          {/* Sort Menu */}
          <DropdownMenu
            label={getSortLabel()}
            icon={<ArrowDownUp className="h-3.5 w-3.5 text-amber-400" />}
            items={sortMenuItems}
            align="right"
            headerTitle="Rank Order"
          />
        </div>
      </div>

      {/* Scanner Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60 shadow-inner">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-mono">
              <th className="py-3 px-4 font-medium">Ticker</th>
              <th className="py-3 px-4 font-medium">Price</th>
              <th className="py-3 px-4 font-medium">Action Signal</th>
              <th className="py-3 px-4 font-medium">Grade</th>
              <th className="py-3 px-4 font-medium">Reward / Risk</th>
              <th className="py-3 px-4 font-medium">Whale Flow</th>
              <th className="py-3 px-4 font-medium">Volume Surge</th>
              <th className="py-3 px-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-mono">
            {filteredTickers.map((t) => {
              const isSelected = t.symbol === selectedTicker.symbol;
              const isBuy = t.signal === 'STRONG_BUY';
              const isExit = t.signal === 'TAKE_PROFIT';

              return (
                <tr
                  key={t.symbol}
                  onClick={() => onSelectTicker(t)}
                  className={`hover:bg-neutral-800/40 transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-800/60' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{t.symbol}</span>
                      <span className="text-neutral-500 text-[11px] truncate max-w-[120px]">
                        {t.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    ${t.price.toFixed(2)}
                    <span
                      className={`text-[10px] ml-1.5 ${
                        t.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.changePercent >= 0 ? '+' : ''}
                      {t.changePercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBuy
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isExit
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isBuy ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : isExit ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      <span>
                        {t.signal === 'STRONG_BUY'
                          ? 'STRONG BUY'
                          : t.signal === 'TAKE_PROFIT'
                          ? 'TAKE PROFIT'
                          : 'ACCUMULATING'}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px]">
                      {t.setupGrade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{t.rrr}:1 RRR</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${t.whaleFlowBullishPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-neutral-300">
                        {t.whaleFlowBullishPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    <span className={t.volumeRatio >= 2.0 ? 'text-amber-400 font-bold' : ''}>
                      {t.volumeRatio.toFixed(1)}x
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicker(t);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span>Chart</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
