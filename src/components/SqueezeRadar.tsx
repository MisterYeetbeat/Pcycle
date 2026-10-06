import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  Filter,
  Flame,
  Layers,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { RetailTicker } from '../types.ts';
import { DropdownMenu, DropdownMenuItem } from './common/DropdownMenu.tsx';

interface SqueezeRadarProps {
  tickers: RetailTicker[];
  onSelectTicker: (ticker: RetailTicker) => void;
}

export const SqueezeRadar: React.FC<SqueezeRadarProps> = ({ tickers, onSelectTicker }) => {
  const [stageFilter, setStageFilter] = useState<'ALL' | 'IGNITED' | 'COILING'>('ALL');
  const [minShortInterest, setMinShortInterest] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'si' | 'dtc' | 'rvol' | 'price'>('si');
  const [search, setSearch] = useState('');

  const squeezeCandidates = useMemo(() => {
    return tickers
      .filter((t) => {
        const si = t.shortInterestPct ?? 0;
        if (si < minShortInterest) return false;

        if (search) {
          const q = search.toLowerCase();
          if (!t.symbol.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) {
            return false;
          }
        }

        const isIgnited = t.signal === 'STRONG_BUY' && t.volumeRatio >= 2.0;
        if (stageFilter === 'IGNITED' && !isIgnited) return false;
        if (stageFilter === 'COILING' && isIgnited) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'si') return (b.shortInterestPct ?? 0) - (a.shortInterestPct ?? 0);
        if (sortBy === 'dtc') return (b.daysToCover ?? 0) - (a.daysToCover ?? 0);
        if (sortBy === 'rvol') return b.volumeRatio - a.volumeRatio;
        if (sortBy === 'price') return b.price - a.price;
        return 0;
      });
  }, [tickers, minShortInterest, stageFilter, sortBy, search]);

  const stageMenuItems: DropdownMenuItem[] = [
    {
      id: 'stage_all',
      type: 'radio',
      label: 'All Squeeze Setups',
      description: 'Show both ignited breakouts and coiling bases',
      checked: stageFilter === 'ALL',
      onClick: () => setStageFilter('ALL'),
    },
    {
      id: 'stage_ignited',
      type: 'radio',
      label: 'Squeeze Ignited Only',
      description: 'Strong Buy + RelVol >= 2.0x volume expansion',
      icon: <Zap className="h-3.5 w-3.5 text-emerald-400" />,
      checked: stageFilter === 'IGNITED',
      onClick: () => setStageFilter('IGNITED'),
    },
    {
      id: 'stage_coiling',
      type: 'radio',
      label: 'Coiling / Compressed Only',
      description: 'High short interest inside tight base consolidation',
      icon: <Flame className="h-3.5 w-3.5 text-amber-400" />,
      checked: stageFilter === 'COILING',
      onClick: () => setStageFilter('COILING'),
    },
  ];

  const shortInterestMenuItems: DropdownMenuItem[] = [
    {
      id: 'si_10',
      type: 'radio',
      label: 'Min 10% Short Float',
      checked: minShortInterest === 10,
      onClick: () => setMinShortInterest(10),
    },
    {
      id: 'si_15',
      type: 'radio',
      label: 'Min 15% Short Float',
      checked: minShortInterest === 15,
      onClick: () => setMinShortInterest(15),
    },
    {
      id: 'si_20',
      type: 'radio',
      label: 'Min 20% Short Float (High)',
      checked: minShortInterest === 20,
      onClick: () => setMinShortInterest(20),
    },
    {
      id: 'si_25',
      type: 'radio',
      label: 'Min 25% Short Float (Extreme)',
      checked: minShortInterest === 25,
      onClick: () => setMinShortInterest(25),
    },
  ];

  const sortMenuItems: DropdownMenuItem[] = [
    {
      id: 'sort_si',
      type: 'radio',
      label: 'Short % Float (High to Low)',
      checked: sortBy === 'si',
      onClick: () => setSortBy('si'),
    },
    {
      id: 'sort_dtc',
      type: 'radio',
      label: 'Days to Cover (High to Low)',
      checked: sortBy === 'dtc',
      onClick: () => setSortBy('dtc'),
    },
    {
      id: 'sort_rvol',
      type: 'radio',
      label: 'Volume Multiplier Surge',
      checked: sortBy === 'rvol',
      onClick: () => setSortBy('rvol'),
    },
    {
      id: 'sort_price',
      type: 'radio',
      label: 'Share Price',
      checked: sortBy === 'price',
      onClick: () => setSortBy('price'),
    },
  ];

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 font-mono">
      {/* Shorty Catalog Refreshed Spec Banner */}
      <div className="p-3 rounded-xl bg-neutral-950 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <div>
            <span className="text-white font-bold">Active Short Squeeze Data Stream</span>
            <span className="text-neutral-400 block text-[11px] font-sans">
              Shorty series cross-referenced with Polygon grouped daily bars &amp; Unusual Whales dark pool beds
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
          <span>Settlement: <strong className="text-emerald-400">2026-09-15</strong></span>
          <span>Float: <strong className="text-white">6,891 tickers</strong></span>
        </div>
      </div>

      {/* Page Subheader with Grouped Menus */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Short Squeeze &amp; Coiling Radar
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 font-sans">
            Identify trapped short seller imbalances before explosive gamma unwinds
          </p>
        </div>

        {/* Grouped Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Quick Search */}
          <div className="relative min-w-[180px] flex-1 md:w-56">
            <Search className="h-3.5 w-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search squeeze ticker..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Stage Menu */}
          <DropdownMenu
            label={stageFilter === 'ALL' ? 'Stage: All' : stageFilter === 'IGNITED' ? 'Stage: Ignited' : 'Stage: Coiling'}
            icon={<Filter className="h-3.5 w-3.5 text-amber-400" />}
            items={stageMenuItems}
            badgeCount={squeezeCandidates.length}
            headerTitle="Squeeze Phase"
          />

          {/* Min Short Interest Menu */}
          <DropdownMenu
            label={`Min SI: ${minShortInterest}%`}
            icon={<Layers className="h-3.5 w-3.5 text-cyan-400" />}
            items={shortInterestMenuItems}
            headerTitle="Short Interest Filter"
          />

          {/* Sort Menu */}
          <DropdownMenu
            label="Sort By"
            icon={<ArrowDownUp className="h-3.5 w-3.5 text-neutral-400" />}
            items={sortMenuItems}
            align="right"
            headerTitle="Rank Criteria"
          />
        </div>
      </div>

      {/* Squeeze Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {squeezeCandidates.map((t) => {
          const isIgnited = t.signal === 'STRONG_BUY' && t.volumeRatio >= 2.0;

          return (
            <div
              key={t.symbol}
              onClick={() => onSelectTicker(t)}
              className="p-5 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-4 group shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-white group-hover:text-amber-300 transition">
                      {t.symbol}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${
                        isIgnited
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isIgnited ? 'SQUEEZE IGNITED' : 'COILING / COMPRESSED'}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5 font-sans">{t.name}</div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-white tabular-nums">${t.price.toFixed(2)}</div>
                  <div
                    className={`text-xs font-semibold ${
                      t.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {t.changePercent >= 0 ? '+' : ''}
                    {t.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Core Squeeze Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-sans">Short % Float</span>
                  <span className="text-base font-bold text-amber-400 tabular-nums">
                    {t.shortInterestPct}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-sans">Days to Cover</span>
                  <span className="text-base font-bold text-white tabular-nums">
                    {t.daysToCover}d
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-sans">RelVol Surge</span>
                  <span
                    className={`text-base font-bold tabular-nums ${
                      t.volumeRatio >= 2.0 ? 'text-emerald-400' : 'text-neutral-300'
                    }`}
                  >
                    {t.volumeRatio.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Whale & Dark Pool Defense Footprint */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                  <span>
                    Whale Bed: <strong className="text-white">${t.darkPoolBed ? t.darkPoolBed.toFixed(2) : 'N/A'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Open Chart Blueprint</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
