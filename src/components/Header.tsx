import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Calculator,
  ChevronDown,
  Clock,
  Cloud,
  Database,
  Flame,
  LayoutDashboard,
  Radar,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from './common/DropdownMenu.tsx';
import { getMarketStatus, isMarketRTH } from '../utils/marketHours.ts';

interface HeaderProps {
  activeTab: 'chart_signals' | 'scanner' | 'squeeze_radar' | 'backtest' | 'design_mockup';
  setActiveTab: (tab: 'chart_signals' | 'scanner' | 'squeeze_radar' | 'backtest' | 'design_mockup') => void;
  onOpenCalculator: () => void;
  onOpenDataImport?: () => void;
  onOpenArchive?: () => void;
  onRerunEngine?: () => void;
  isEngineRunning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCalculator,
  onOpenDataImport,
  onOpenArchive,
  onRerunEngine,
  isEngineRunning = false,
}) => {
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef<HTMLDivElement | null>(null);
  const [marketStatus, setMarketStatus] = useState(() => getMarketStatus());

  // Periodically refresh market status clock (every 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close page dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setIsPageDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Page navigation configuration (renamed Terminal to Dashboard)
  const navItems = [
    {
      id: 'chart_signals' as const,
      label: 'Dashboard',
      description: 'Interactive Chart & Trade Setup Signals',
      icon: <LayoutDashboard className="h-4 w-4 text-emerald-400" />,
    },
    {
      id: 'scanner' as const,
      label: 'Opportunity Scanner',
      description: 'Real-time institutional flow & volume breakouts',
      icon: <Radar className="h-4 w-4 text-cyan-400" />,
    },
    {
      id: 'squeeze_radar' as const,
      label: 'Squeeze Radar',
      description: 'Short interest & coiling compression',
      icon: <Flame className="h-4 w-4 text-amber-400" />,
    },
    {
      id: 'backtest' as const,
      label: 'Backtest Engine',
      description: '90-Day Strategy Ledger & Performance',
      icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
    },
    {
      id: 'design_mockup' as const,
      label: 'Design Mockup',
      description: 'Static UX Wireframe & Architecture Spec',
      icon: <Sparkles className="h-4 w-4 text-emerald-400" />,
    },
  ];

  const currentPage = navItems.find((item) => item.id === activeTab) || navItems[0];

  // Header Tools Dropdown Menu items
  const dataToolsItems: DropdownMenuItem[] = [
    {
      id: 'market_status_hdr',
      type: 'header',
      label: `Session: ${marketStatus.label}`,
    },
    {
      id: 'market_schedule',
      label: marketStatus.isRTH ? 'RTH Live Feeds: ACTIVE' : 'RTH Polling: PAUSED (Off-Hours)',
      description: marketStatus.subLabel,
      icon: marketStatus.isRTH ? (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-amber-400" />
      ),
      disabled: true,
    },
    {
      id: 'divider_0',
      type: 'divider',
      label: '',
    },
    {
      id: 'update_data',
      label: isEngineRunning ? 'Updating Engine...' : 'Run Market Engine',
      description: 'Recalculate squeeze triggers & RRR brackets',
      icon: <RefreshCw className={`h-4 w-4 text-emerald-400 ${isEngineRunning ? 'animate-spin' : ''}`} />,
      disabled: isEngineRunning,
      onClick: onRerunEngine,
    },
    {
      id: 'upload_files',
      label: 'Import Dataset Files',
      description: 'Upload Polygon JSON/CSV or Shorty prints',
      icon: <Database className="h-4 w-4 text-cyan-400" />,
      onClick: onOpenDataImport,
    },
    {
      id: 'cloud_archive',
      label: 'Cloud Storage & Research Archive',
      description: 'Manage bucket gs://pcycle-data-archive-cps1 & daily snapshots',
      icon: <Cloud className="h-4 w-4 text-cyan-400" />,
      onClick: onOpenArchive,
    },
    {
      id: 'divider_1',
      type: 'divider',
      label: '',
    },
    {
      id: 'status_header',
      type: 'header',
      label: 'Live Data Streams',
    },
    {
      id: 'uw_status',
      label: 'Unusual Whales Stream',
      description: marketStatus.isRTH ? 'Dark Pool & Options Sweeps: Online' : 'Settlement Snapshot Loaded',
      icon: <span className={`w-2 h-2 rounded-full ${marketStatus.isRTH ? 'bg-cyan-400 animate-pulse' : 'bg-neutral-500'}`} />,
      disabled: true,
    },
    {
      id: 'massive_status',
      label: 'Massive Polygon Feed',
      description: marketStatus.isRTH ? 'Intraday Bars & Greeks: Online' : 'RTH Only (Mon-Fri 9:30-4:00 ET)',
      icon: <span className={`w-2 h-2 rounded-full ${marketStatus.isRTH ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />,
      disabled: true,
    },
  ];

  return (
    <header className="border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-2.5">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Page Dropdown Selector */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
            <Zap className="h-4 w-4 fill-emerald-400/20" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight font-mono hidden sm:inline">
              AlphaPulse
            </span>
            <span className="text-neutral-700 hidden sm:inline">/</span>

            {/* Page Navigation Dropdown */}
            <div className="relative" ref={pageDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white font-mono text-xs font-bold transition cursor-pointer shadow-sm"
                aria-expanded={isPageDropdownOpen}
              >
                <span className="shrink-0">{currentPage.icon}</span>
                <span className="tracking-tight text-white">{currentPage.label}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${
                    isPageDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {isPageDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl border border-neutral-800 bg-neutral-950/98 p-1.5 shadow-2xl backdrop-blur-xl z-50 font-mono text-xs space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Select Page View
                  </div>

                  {navItems.map((item) => {
                    const isCurrent = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsPageDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition cursor-pointer ${
                          isCurrent
                            ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">{item.icon}</span>
                        <div className="truncate">
                          <div className={isCurrent ? 'text-white' : 'text-neutral-200'}>
                            {item.label}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-normal truncate">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Market Hours Status, Global Utilities & Position Sizer CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Market Hours Indicator Badge */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono border transition ${
              marketStatus.isRTH
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
            title={marketStatus.subLabel}
          >
            {marketStatus.isRTH ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Clock className="h-3 w-3 text-amber-400" />
            )}
            <span className={marketStatus.isRTH ? 'text-emerald-300 font-semibold' : 'text-amber-400/90 font-medium'}>
              {marketStatus.label}
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400 tabular-nums">{marketStatus.nyTimeStr}</span>
          </div>

          {/* Data & Feeds Grouped Menu */}
          <DropdownMenu
            label="Data & Feeds"
            icon={<SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />}
            items={dataToolsItems}
            align="right"
            variant="default"
            headerTitle="Market Engine Controls"
          />

          {/* Position Sizer CTA */}
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-mono font-bold transition shadow-sm shadow-emerald-500/20 whitespace-nowrap cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5 text-neutral-950" />
            <span>Position Sizer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
