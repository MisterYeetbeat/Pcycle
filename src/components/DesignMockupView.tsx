import React, { useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  BarChart3,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  Database,
  Eye,
  Filter,
  Flame,
  Info,
  Layers,
  LayoutDashboard,
  Maximize2,
  Radar,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface DesignMockupViewProps {
  onReturnToLive: () => void;
}

export const DesignMockupView: React.FC<DesignMockupViewProps> = ({ onReturnToLive }) => {
  const [activeCallout, setActiveCallout] = useState<number | null>(1);
  const [activePreviewMenu, setActivePreviewMenu] = useState<'asset' | 'boxes' | 'indicators' | 'feeds'>('boxes');

  const callouts = [
    {
      id: 1,
      title: 'Header Page Dropdown & Utilities Menu',
      category: 'Header Architecture',
      before: 'Multiple raw buttons competing in the header bar with unorganized links and status chips.',
      after: 'Unified Page Dropdown selector (Dashboard, Scanner, Squeeze, Backtest) + grouped "Data & Feeds ▾" dropdown + Position Sizer CTA.',
      uxPrinciple: 'Clear visual hierarchy: separates destination navigation from secondary utility actions.',
    },
    {
      id: 2,
      title: 'Unified Asset Selector Dropdown',
      category: 'Page Subheader',
      before: 'A horizontal strip of 10+ individual ticker button pills wrapping and cluttering the viewport.',
      after: 'A single high-end Asset Selector button showing Symbol, Name, Price, Change %, and Grade, opening an instant search modal.',
      uxPrinciple: 'Progressive disclosure: shows the active context while keeping the full catalog instantly searchable.',
    },
    {
      id: 3,
      title: 'Consolidated Chart Menus (Option A)',
      category: 'Chart Command Center',
      before: '15+ loose button pills spread across 3 stacked rows (VWAP, EMA, Whale, 90D, 5M, Hit, Stop, Contraction, etc.).',
      after: 'Clean 2-way timeframe segment [90D | 5M] + 4 structured dropdown menus (Indicators ▾, Visual Boxes ▾, Layer ▾, View ▾).',
      uxPrinciple: 'Hick’s Law & Chunking: groups related tools under clear categories to reduce decision fatigue.',
    },
    {
      id: 4,
      title: 'Direct Shaded Strategy Zones (Option A)',
      category: 'Visual Data Visualization',
      before: 'Flat 1D price lines with no time duration or coiling phase context.',
      after: 'Direct 2D shaded boxes: Emerald Hit Box (Target 1), Rose Stop Loss Box, Amber Contraction Base (Coil Phase).',
      uxPrinciple: 'Spatial context: simultaneously visualizes both price levels and expected execution time horizons.',
    },
    {
      id: 5,
      title: 'Zero-Pill Typography & Hairline Dividers',
      category: 'Anti-Slop Design Constitution',
      before: 'Pill-shaped badges on every label, button, and metadata item creating visual candy noise.',
      after: 'Clean unboxed typography with typographic dot separators (·) and subtle hairline borders.',
      uxPrinciple: 'Legibility and restraint: professional fintech aesthetic inspired by Bloomberg and TradingView.',
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner: Design Mode Active */}
      <div className="p-4 rounded-2xl bg-neutral-900/90 border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Design Mode &amp; UX Architecture Mockup
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500 text-neutral-950">
                PROPOSED SPEC
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Visual mockup and interactive wireframe demonstrating the reorganization from 27+ buttons into 4 structured menus.
            </p>
          </div>
        </div>

        <button
          onClick={onReturnToLive}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer border border-neutral-700 shadow-md"
        >
          <span>Return to Live App</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Before vs After Audit Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block uppercase font-sans">Homepage Buttons</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-400 line-through">27</span>
            <ArrowRight className="h-4 w-4 text-neutral-600" />
            <span className="text-2xl font-bold text-emerald-400">5</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">81% reduction in clutter</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block uppercase font-sans">Menu Structure</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-400 line-through">0</span>
            <ArrowRight className="h-4 w-4 text-neutral-600" />
            <span className="text-2xl font-bold text-cyan-400">4 Menus</span>
          </div>
          <span className="text-[10px] text-cyan-400/80 mt-1 block">Progressive disclosure</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block uppercase font-sans">Visual Depth</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-400">Single</span>
            <span className="text-xs text-neutral-400 font-sans">Elevation</span>
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Anti-slop zero pill rules</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block uppercase font-sans">Option A Visuals</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">3 Zones</span>
            <span className="text-xs text-neutral-400 font-sans">Direct Canvas</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Hit, Exit, &amp; Contraction</span>
        </div>
      </div>

      {/* Main Mockup Canvas: Static High-Fidelity Blueprint */}
      <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/90 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive Design Blueprint (1440px Viewport Reference)
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              Click the numbered badge callouts (1–5) to inspect individual UX decisions
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs">
            {callouts.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCallout(c.id)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                  activeCallout === c.id
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                #{c.id}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Callout Drawer */}
        {activeCallout !== null && (
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-neutral-950 font-bold flex items-center justify-center text-[11px]">
                  {activeCallout}
                </span>
                <span className="font-bold text-white text-sm">
                  {callouts[activeCallout - 1].title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                  {callouts[activeCallout - 1].category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] font-sans">
              <div className="p-2.5 bg-neutral-950/80 rounded-lg border border-rose-500/20">
                <span className="text-rose-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  Before (Cluttered)
                </span>
                <p className="text-neutral-300">{callouts[activeCallout - 1].before}</p>
              </div>

              <div className="p-2.5 bg-neutral-950/80 rounded-lg border border-emerald-500/20">
                <span className="text-emerald-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  After (Redesigned)
                </span>
                <p className="text-neutral-300">{callouts[activeCallout - 1].after}</p>
              </div>

              <div className="p-2.5 bg-neutral-950/80 rounded-lg border border-cyan-500/20">
                <span className="text-cyan-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  UX &amp; Cognitive Principle
                </span>
                <p className="text-neutral-300">{callouts[activeCallout - 1].uxPrinciple}</p>
              </div>
            </div>
          </div>
        )}

        {/* STATIC UI MOCKUP RENDER */}
        <div className="rounded-xl border border-neutral-800 bg-[#09090b] p-4 shadow-2xl space-y-4 select-none">
          {/* Mock Header (Marker 1) */}
          <div className="relative p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4">
            <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 font-bold text-[10px] shadow-sm">
              Callout #1: Clean Header Page Nav
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="h-3.5 w-3.5 fill-emerald-400/20" />
              </div>
              <span className="font-bold text-white text-sm">AlphaPulse</span>
              <span className="text-[10px] text-emerald-400 hidden sm:inline">CYCLE ENGINE</span>
            </div>

            {/* Page Nav */}
            <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-xs">
              <span className="px-3 py-1 rounded-lg bg-neutral-800 text-white font-bold border border-neutral-700">
                Dashboard ▾
              </span>
            </div>

            {/* Right Tools Menu */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-1.5">
                <SlidersHorizontal className="h-3 w-3 text-neutral-400" />
                <span>Data &amp; Feeds ▾</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-500 text-neutral-950 text-xs font-bold">
                Position Sizer
              </div>
            </div>
          </div>

          {/* Mock Page Subheader (Marker 2 & 5) */}
          <div className="relative p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-cyan-500 text-neutral-950 font-bold text-[10px] shadow-sm">
              Callout #2: Consolidated Asset Selector Dropdown
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white font-bold">
                <span>AAOI · Applied Optoelectronics</span>
                <span className="text-neutral-400 font-normal">$104.85</span>
                <span className="text-emerald-400 font-semibold">+18.2%</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                <Flame className="h-3 w-3 text-amber-400" />
                <span>Auto-Follow Top</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                <Database className="h-3 w-3 text-cyan-400" />
                <span>Real-Time Feed ▾</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
              <span>Win Rate: <strong className="text-emerald-400">85.7%</strong></span>
              <span>·</span>
              <span>RRR: <strong className="text-white">4.4:1</strong></span>
              <span>·</span>
              <span>Short Float: <strong className="text-amber-400">28.4%</strong></span>
              <span>·</span>
              <span>RelVol: <strong className="text-white">3.8x</strong></span>
            </div>
          </div>

          {/* Mock Chart Workspace (Marker 3 & 4) */}
          <div className="relative p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-purple-500 text-white font-bold text-[10px] shadow-sm">
              Callout #3: Grouped Chart Menus &amp; Option A Shaded Boxes
            </div>

            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">AAOI</span>
                <span className="text-emerald-400 font-semibold">$104.85 (+18.2%)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-neutral-950 font-bold text-[10px]">
                  TRIGGER READY NOW
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Timeframe */}
                <div className="flex items-center p-0.5 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px]">
                  <span className="px-2 py-0.5 bg-neutral-800 text-white rounded font-bold">90D Timeline</span>
                  <span className="px-2 py-0.5 text-neutral-400">5M Intraday</span>
                </div>

                {/* 4 Grouped Menus */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Layers className="h-3 w-3 text-cyan-400" />
                  <span>Indicators (3) ▾</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-bold">
                  <Box className="h-3 w-3 text-emerald-400" />
                  <span>Visual Boxes (3) ▾</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Eye className="h-3 w-3 text-neutral-400" />
                  <span>Dual Mode ▾</span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                  <Maximize2 className="h-3 w-3" />
                  <span>View ▾</span>
                </div>
              </div>
            </div>

            {/* Static Simulated Chart Area with Option A Shaded Zones */}
            <div className="relative h-64 rounded-lg bg-[#0c0c0e] border border-neutral-800/80 overflow-hidden flex items-center justify-center">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 divide-x divide-y divide-neutral-900/60 pointer-events-none" />

              {/* Shaded Box 1: Contraction Base (Amber) */}
              <div className="absolute left-[15%] top-[45%] w-[20%] h-[35%] rounded bg-amber-500/10 border border-amber-500/70 border-dashed flex flex-col justify-between p-1.5">
                <span className="text-[9px] font-bold text-amber-400 px-1 py-0.2 rounded bg-neutral-950/80 border border-amber-500/40 self-start">
                  ⚡ CONTRACTION BASE (65% COIL)
                </span>
                <span className="text-[8px] text-amber-500 font-mono self-end">$22.40 – $24.80 Base</span>
              </div>

              {/* Shaded Box 2: Hit Box (Target 1 - Emerald) */}
              <div className="absolute left-[36%] top-[12%] w-[38%] h-[38%] rounded bg-emerald-500/15 border-t-2 border-emerald-400 border-x border-b border-emerald-500/30 flex flex-col justify-between p-1.5">
                <span className="text-[9px] font-bold text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/50 self-start">
                  🎯 TARGET HIT BOX (+39.6%) Target: $34.20
                </span>
                <span className="text-[8px] text-emerald-400 font-mono self-end">✓ Target Reached</span>
              </div>

              {/* Entry Level Divider with RRR Badge */}
              <div className="absolute left-[36%] top-[50%] w-[38%] border-t border-dashed border-white/60 flex items-center justify-center">
                <span className="text-[8px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-white font-bold -translate-y-1/2">
                  ⚖️ 4.4:1 RRR · ENTRY $24.50
                </span>
              </div>

              {/* Shaded Box 3: Stop Box (Rose) */}
              <div className="absolute left-[36%] top-[50%] w-[38%] h-[20%] rounded bg-rose-500/12 border-b-2 border-rose-500 border-x border-t border-rose-500/30 flex flex-col justify-between p-1.5">
                <span className="text-[8px] text-rose-400 font-mono">Cut Loss Risk Area</span>
                <span className="text-[9px] font-bold text-rose-300 px-1 py-0.2 rounded bg-rose-950 border border-rose-500/50 self-start">
                  🛡️ STOP LOSS (-6.9%) $22.80
                </span>
              </div>

              {/* Simulated Candlestick Bars */}
              <div className="absolute inset-0 flex items-end justify-around px-8 pb-6 pointer-events-none opacity-60">
                {[40, 45, 42, 48, 44, 46, 50, 48, 55, 62, 58, 70, 78, 74, 85, 92, 88, 104].map((h, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-0.5 bg-neutral-700" style={{ height: `${h * 0.4}px` }} />
                    <div
                      className={`w-2 rounded-xs ${
                        i > 7 ? 'bg-emerald-400' : i % 2 === 0 ? 'bg-emerald-500/80' : 'bg-rose-500/80'
                      }`}
                      style={{ height: `${Math.max(8, h * 0.9)}px` }}
                    />
                    <div className="w-0.5 bg-neutral-700" style={{ height: `${h * 0.3}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Dropdown Preview Showcase */}
      <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive Menu Preview Inspector
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              Test how each grouped dropdown menu appears in its expanded, accessible state
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActivePreviewMenu('boxes')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                activePreviewMenu === 'boxes' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Visual Boxes Menu
            </button>
            <button
              onClick={() => setActivePreviewMenu('asset')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                activePreviewMenu === 'asset' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Asset Selector Menu
            </button>
            <button
              onClick={() => setActivePreviewMenu('indicators')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                activePreviewMenu === 'indicators' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Indicators Menu
            </button>
            <button
              onClick={() => setActivePreviewMenu('feeds')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                activePreviewMenu === 'feeds' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Feeds &amp; Tools Menu
            </button>
          </div>
        </div>

        {/* Render Preview State */}
        <div className="p-6 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-center min-h-[300px]">
          {activePreviewMenu === 'boxes' && (
            <div className="w-80 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl space-y-1 text-xs">
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase">
                STRATEGY VISUAL ZONES (OPTION A)
              </div>
              <div className="p-2 rounded-lg bg-neutral-900/90 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-emerald-500 flex items-center justify-center text-neutral-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold">Target Hit Box</div>
                    <div className="text-[10px] text-neutral-400">Emerald target profit zone</div>
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900/90 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-emerald-500 flex items-center justify-center text-neutral-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold">Stop Loss Box</div>
                    <div className="text-[10px] text-neutral-400">Rose risk invalidation zone</div>
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900/90 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-emerald-500 flex items-center justify-center text-neutral-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold">Contraction Base</div>
                    <div className="text-[10px] text-neutral-400">Amber coiling compression phase</div>
                  </div>
                </div>
              </div>
              <div className="my-1 border-t border-neutral-800" />
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase">
                DISPLAY SCOPE
              </div>
              <div className="p-1.5 rounded-lg bg-neutral-900 text-white flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full border border-emerald-500 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <span>All 90-Day Setups</span>
              </div>
              <div className="p-1.5 rounded-lg text-neutral-400 hover:text-white flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full border border-neutral-700" />
                <span>Selected Setup Only</span>
              </div>
            </div>
          )}

          {activePreviewMenu === 'asset' && (
            <div className="w-88 rounded-xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl space-y-2 text-xs">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-neutral-500" />
                <input
                  type="text"
                  readOnly
                  value="AAOI"
                  className="w-full pl-8 pr-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-xs"
                />
              </div>
              <div className="flex gap-1 text-[10px] p-1 bg-neutral-900 rounded-lg">
                <span className="flex-1 py-0.5 rounded text-center bg-neutral-800 text-white font-bold">All (10)</span>
                <span className="flex-1 py-0.5 rounded text-center text-neutral-400">Strong Buy</span>
                <span className="flex-1 py-0.5 rounded text-center text-neutral-400">Squeeze</span>
              </div>
              <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <span className="font-bold">AAOI</span>
                  <span className="text-[10px] text-neutral-400">Applied Opto</span>
                  <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300">#1 TOP</span>
                </div>
                <div className="text-right">
                  <span className="font-bold tabular-nums">$104.85</span>
                  <span className="text-emerald-400 text-[10px] ml-1.5 font-bold">+18.2%</span>
                </div>
              </div>
              <div className="p-2 rounded-lg hover:bg-neutral-900 flex justify-between items-center text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">SOUN</span>
                  <span className="text-[10px] text-neutral-400">SoundHound AI</span>
                </div>
                <div className="text-right">
                  <span className="font-bold tabular-nums">$7.85</span>
                  <span className="text-emerald-400 text-[10px] ml-1.5 font-bold">+14.6%</span>
                </div>
              </div>
            </div>
          )}

          {activePreviewMenu === 'indicators' && (
            <div className="w-80 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl space-y-1 text-xs">
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase">
                CHART OVERLAYS &amp; TECHNICALS
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-emerald-500 flex items-center justify-center text-neutral-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold">VWAP Benchmark</div>
                    <div className="text-[10px] text-neutral-400">Volume-weighted average price line</div>
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-emerald-500 flex items-center justify-center text-neutral-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold">EMA 9 / 21 Ribbon</div>
                    <div className="text-[10px] text-neutral-400">Fast and slow momentum ribbon</div>
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-emerald-500 flex items-center justify-center text-neutral-950">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-bold">Whale Levels</div>
                    <div className="text-[10px] text-neutral-400">Dark pool bed &amp; call wall ceiling</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePreviewMenu === 'feeds' && (
            <div className="w-80 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl space-y-1 text-xs">
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase">
                DATA &amp; SYSTEM FEEDS
              </div>
              <div className="p-2 rounded-lg hover:bg-neutral-900 text-white flex items-center gap-2.5 cursor-pointer">
                <RefreshCw className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="font-bold">Run Market Engine</div>
                  <div className="text-[10px] text-neutral-400">Recalculate squeeze &amp; RRR triggers</div>
                </div>
              </div>
              <div className="p-2 rounded-lg hover:bg-neutral-900 text-white flex items-center gap-2.5 cursor-pointer">
                <Database className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="font-bold">Import Dataset Files</div>
                  <div className="text-[10px] text-neutral-400">Upload Polygon JSON/CSV or SI prints</div>
                </div>
              </div>
              <div className="my-1 border-t border-neutral-800" />
              <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-500 uppercase">
                LIVE DATA TELEMETRY
              </div>
              <div className="p-1.5 flex items-center justify-between text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Unusual Whales API
                </span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="p-1.5 flex items-center justify-between text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Massive Polygon API
                </span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
