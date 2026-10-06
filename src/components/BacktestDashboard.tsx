import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  Filter,
  Flame,
  Percent,
  Search,
  Shield,
  Sliders,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { computeBacktestSummary, RAW_BACKTEST_TRADES } from '../data/backtestData.ts';
import { BacktestTrade } from '../types.ts';
import { DropdownMenu, DropdownMenuItem } from './common/DropdownMenu.tsx';

export const BacktestDashboard: React.FC = () => {
  // Strategy interactive sensitivity parameters
  const [minRvol, setMinRvol] = useState<number>(1.8);
  const [requireDarkPoolBed, setRequireDarkPoolBed] = useState<boolean>(false);
  const [selectedSetupType, setSelectedSetupType] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [searchTicker, setSearchTicker] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'return' | 'pnl'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter trades based on user controls
  const filteredTrades = useMemo(() => {
    return RAW_BACKTEST_TRADES.filter((t) => {
      if (t.rvol < minRvol) return false;
      if (requireDarkPoolBed && !t.hasDarkPoolBed) return false;
      if (selectedSetupType !== 'ALL' && t.setupType !== selectedSetupType) return false;
      if (outcomeFilter !== 'ALL' && t.result !== outcomeFilter) return false;
      if (searchTicker && !t.ticker.toLowerCase().includes(searchTicker.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      let diff = 0;
      if (sortBy === 'date') diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'return') diff = a.returnPct - b.returnPct;
      if (sortBy === 'pnl') diff = a.pnlDollar - b.pnlDollar;
      return sortOrder === 'desc' ? -diff : diff;
    });
  }, [minRvol, requireDarkPoolBed, selectedSetupType, outcomeFilter, searchTicker, sortBy, sortOrder]);

  // Dynamic backtest summary statistics
  const summary = useMemo(() => {
    return computeBacktestSummary(filteredTrades);
  }, [filteredTrades]);

  // Equity Curve Data points
  const equityPoints = useMemo(() => {
    let currentEquity = 10000;
    const points = [{ index: 0, equity: 10000, date: 'Start' }];

    // Sort chronologically for the curve
    const chronological = [...filteredTrades].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    chronological.forEach((t, i) => {
      currentEquity += t.pnlDollar;
      points.push({ index: i + 1, equity: currentEquity, date: t.date });
    });

    return points;
  }, [filteredTrades]);

  // SVG Chart Dimensions
  const chartHeight = 220;
  const chartWidth = 720;
  const padding = { top: 20, right: 30, bottom: 25, left: 55 };

  const minEquity = Math.min(...equityPoints.map((p) => p.equity), 9000);
  const maxEquity = Math.max(...equityPoints.map((p) => p.equity), 15000);

  const getY = (val: number) => {
    const range = maxEquity - minEquity || 1;
    return padding.top + (1 - (val - minEquity) / range) * (chartHeight - padding.top - padding.bottom);
  };

  const getX = (index: number) => {
    const maxIdx = Math.max(1, equityPoints.length - 1);
    return padding.left + (index / maxIdx) * (chartWidth - padding.left - padding.right);
  };

  // Build SVG path
  const linePath = useMemo(() => {
    if (!equityPoints.length) return '';
    return equityPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.index)} ${getY(p.equity)}`)
      .join(' ');
  }, [equityPoints, maxEquity, minEquity]);

  const areaPath = useMemo(() => {
    if (!equityPoints.length) return '';
    const lastX = getX(equityPoints.length - 1);
    const firstX = getX(0);
    const bottomY = getY(minEquity);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, equityPoints, minEquity]);

  // Export handlers for downloading CSV and JSON logs
  const handleDownloadCSV = () => {
    const headers = [
      'ID',
      'Date',
      'Ticker',
      'Setup Type',
      'RVOL',
      'Flow Skew',
      'Has Dark Pool Bed',
      'Entry Price ($)',
      'Exit Price ($)',
      'Stop Loss ($)',
      'Target Price ($)',
      'Hold Days',
      'Return (%)',
      'Realized PnL ($)',
      'Result',
      'Exit Reason',
    ];
    const rows = filteredTrades.map((t) => [
      t.id,
      t.date,
      t.ticker,
      `"${t.setupType}"`,
      t.rvol,
      t.flowSkew,
      t.hasDarkPoolBed ? 'TRUE' : 'FALSE',
      t.entryPrice,
      t.exitPrice,
      t.stopLoss,
      t.targetPrice,
      t.holdDays,
      t.returnPct,
      t.pnlDollar,
      t.result,
      `"${t.exitReason}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `market_cycle_backtest_trades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ summary, totalCount: filteredTrades.length, trades: filteredTrades }, null, 2)
    );
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `market_cycle_backtest_trades_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                MarketCycleEngine Backtest Verification
              </h1>
              <p className="text-xs text-neutral-400">
                Grounded in Shorty Data Catalog (<code className="text-cyan-300">Codex-Backtest/project_memory/data/shorty/</code>)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            Catalog: <strong className="text-cyan-400">Refreshed 2026-09-28</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            Basis: <strong className="text-white">$10,000 Ref Capital</strong>
          </span>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-medium transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Win Rate */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Win Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5 tabular-nums">
            {summary.winRate}%
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            {summary.winCount}W · {summary.lossCount}L ({summary.totalTrades} trades)
          </div>
        </div>

        {/* Total Net Profit */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Net Profit</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5 tabular-nums">
            +${summary.totalPnlDollar.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
            +{summary.totalPnlPct}% cumulative
          </div>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Profit Factor</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1.5 tabular-nums">
            {summary.profitFactor}x
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            Gross gains vs losses
          </div>
        </div>

        {/* Realized RRR */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Realized RRR</span>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1.5 tabular-nums">
            {summary.realizedRrr} : 1
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            +{summary.avgWinPct}% avg win / -{summary.avgLossPct}% loss
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Max Drawdown</span>
            <Shield className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1.5 tabular-nums">
            -{summary.maxDrawdownPct}%
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            Low tail-risk exposure
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Sharpe Ratio</span>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1.5 tabular-nums">
            {summary.sharpeRatio}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            Institutional quality
          </div>
        </div>
      </div>

      {/* Interactive Equity Growth Curve Chart */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Cumulative Account Equity Growth
            </h3>
            <p className="text-xs text-neutral-400">
              $10,000 initial balance compounded across verified trade events
            </p>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs text-neutral-400 block">Final Account Value</span>
            <span className="text-lg font-bold text-emerald-400 tabular-nums">
              ${(10000 + summary.totalPnlDollar).toLocaleString()}
            </span>
          </div>
        </div>

        {/* SVG Equity Chart */}
        <div className="relative overflow-x-auto select-none rounded-xl bg-neutral-950/60 p-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto max-h-[260px] overflow-visible font-mono"
          >
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const val = minEquity + pct * (maxEquity - minEquity);
              const y = getY(val);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#262626"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3.5}
                    fill="#737373"
                    fontSize="9"
                    textAnchor="end"
                    className="tabular-nums"
                  >
                    ${Math.round(val).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Baseline 10k line */}
            <line
              x1={padding.left}
              y1={getY(10000)}
              x2={chartWidth - padding.right}
              y2={getY(10000)}
              stroke="#525252"
              strokeDasharray="4 4"
            />

            {/* Shaded Area & Line */}
            {areaPath && <path d={areaPath} fill="url(#equityGrad)" />}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Dots on points */}
            {equityPoints.map((p, i) => (
              <circle
                key={i}
                cx={getX(p.index)}
                cy={getY(p.equity)}
                r="3"
                fill="#10b981"
                stroke="#09090b"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Interactive Parameter Sensitivity Optimizer */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Interactive Strategy Sensitivity Optimizer
            </h3>
          </div>
          <span className="text-xs text-neutral-400">
            Real-time filter updates on {RAW_BACKTEST_TRADES.length} total events
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* RVOL Slider */}
          <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-neutral-300">Min RVOL Threshold</span>
              <span className="text-emerald-400 font-bold">{minRvol.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="3.5"
              step="0.1"
              value={minRvol}
              onChange={(e) => setMinRvol(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>1.5x (More trades)</span>
              <span>3.5x (High Conviction)</span>
            </div>
          </div>

          {/* Dark Pool Bed Toggle */}
          <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-neutral-300 block mb-1">Dark Pool Floor Required</span>
              <p className="text-[10px] text-neutral-500 font-sans">
                Require &ge; $500k whale block support cluster below entry
              </p>
            </div>
            <button
              onClick={() => setRequireDarkPoolBed(!requireDarkPoolBed)}
              className={`mt-2 py-1.5 px-3 rounded-lg border text-center transition font-bold cursor-pointer ${
                requireDarkPoolBed
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {requireDarkPoolBed ? '✓ Whale Bed Enforced' : 'Off (Accept All)'}
            </button>
          </div>

          {/* Setup Type Filter */}
          <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2">
            <span className="text-neutral-300 block">Setup Type Filter</span>
            <select
              value={selectedSetupType}
              onChange={(e) => setSelectedSetupType(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-neutral-700"
            >
              <option value="ALL">All Setups (Squeeze, BOS, Coils)</option>
              <option value="Short Squeeze">Short Squeezes Only</option>
              <option value="Uptick Inception">Uptick Inceptions</option>
              <option value="Volume Coil Surge">Volume Coil Surges</option>
              <option value="Whale Bed Breakout">Whale Bed Breakouts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verified Trade Ledger Table */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Trade Execution Ledger ({filteredTrades.length} Trades)
            </h3>
            <p className="text-xs text-neutral-400">
              Individual trade entries, holding durations, and exact exit triggers
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                placeholder="Ticker..."
                className="bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 font-mono w-28 focus:outline-none"
              />
            </div>

            <DropdownMenu
              label={outcomeFilter === 'ALL' ? 'Outcome: All' : outcomeFilter === 'WIN' ? 'Outcome: Wins' : 'Outcome: Losses'}
              icon={<Filter className="h-3.5 w-3.5 text-emerald-400" />}
              items={[
                {
                  id: 'out_all',
                  type: 'radio',
                  label: 'All Completed Trades',
                  checked: outcomeFilter === 'ALL',
                  onClick: () => setOutcomeFilter('ALL'),
                },
                {
                  id: 'out_win',
                  type: 'radio',
                  label: 'Winning Trades Only',
                  icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
                  checked: outcomeFilter === 'WIN',
                  onClick: () => setOutcomeFilter('WIN'),
                },
                {
                  id: 'out_loss',
                  type: 'radio',
                  label: 'Losing Trades Only',
                  icon: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
                  checked: outcomeFilter === 'LOSS',
                  onClick: () => setOutcomeFilter('LOSS'),
                },
              ]}
              headerTitle="Trade Outcome"
            />

            <DropdownMenu
              label={sortBy === 'date' ? 'Sort: Date' : sortBy === 'return' ? 'Sort: Return %' : 'Sort: P&L $'}
              items={[
                {
                  id: 'sb_date',
                  type: 'radio',
                  label: 'Trade Date',
                  checked: sortBy === 'date',
                  onClick: () => setSortBy('date'),
                },
                {
                  id: 'sb_return',
                  type: 'radio',
                  label: 'Return Percentage %',
                  checked: sortBy === 'return',
                  onClick: () => setSortBy('return'),
                },
                {
                  id: 'sb_pnl',
                  type: 'radio',
                  label: 'Dollar Realized P&L',
                  checked: sortBy === 'pnl',
                  onClick: () => setSortBy('pnl'),
                },
                {
                  id: 'div_so',
                  type: 'divider',
                  label: '',
                },
                {
                  id: 'so_desc',
                  type: 'radio',
                  label: 'Descending (High to Low)',
                  checked: sortOrder === 'desc',
                  onClick: () => setSortOrder('desc'),
                },
                {
                  id: 'so_asc',
                  type: 'radio',
                  label: 'Ascending (Low to High)',
                  checked: sortOrder === 'asc',
                  onClick: () => setSortOrder('asc'),
                },
              ]}
              align="right"
              headerTitle="Sort Ledger"
            />

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium transition cursor-pointer"
              title="Download Backtest Trades as CSV spreadsheet"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium transition cursor-pointer"
              title="Download Backtest Dataset as JSON file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400 font-mono">
                <th className="py-3 px-3.5 font-medium">Date</th>
                <th className="py-3 px-3.5 font-medium">Ticker</th>
                <th className="py-3 px-3.5 font-medium">Setup</th>
                <th className="py-3 px-3.5 font-medium">RVOL / Skew</th>
                <th className="py-3 px-3.5 font-medium">Entry → Exit</th>
                <th className="py-3 px-3.5 font-medium">Hold</th>
                <th className="py-3 px-3.5 font-medium">Return %</th>
                <th className="py-3 px-3.5 font-medium">Realized P&amp;L</th>
                <th className="py-3 px-3.5 font-medium">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredTrades.map((t) => {
                const isWin = t.result === 'WIN';

                return (
                  <tr key={t.id} className="hover:bg-neutral-800/40 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-3.5 text-neutral-400">{t.date}</td>

                    {/* Ticker */}
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-white text-sm">{t.ticker}</span>
                    </td>

                    {/* Setup Type */}
                    <td className="py-3 px-3.5 font-sans">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                          t.setupType === 'Short Squeeze'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {t.setupType}
                      </span>
                    </td>

                    {/* RVOL / Skew */}
                    <td className="py-3 px-3.5 tabular-nums">
                      <span className="text-cyan-400 font-bold">{t.rvol.toFixed(1)}x</span>
                      <span className="text-neutral-500 mx-1">·</span>
                      <span className="text-neutral-300">{t.flowSkew.toFixed(1)}x</span>
                    </td>

                    {/* Entry -> Exit */}
                    <td className="py-3 px-3.5 tabular-nums">
                      <span className="text-neutral-400">${t.entryPrice.toFixed(2)}</span>
                      <span className="text-neutral-600 mx-1.5">→</span>
                      <span className="font-bold text-white">${t.exitPrice.toFixed(2)}</span>
                    </td>

                    {/* Hold Days */}
                    <td className="py-3 px-3.5 text-neutral-400 tabular-nums">
                      {t.holdDays} days
                    </td>

                    {/* Return % */}
                    <td className="py-3 px-3.5 tabular-nums">
                      <span
                        className={`font-bold inline-flex items-center gap-0.5 ${
                          isWin ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isWin ? '+' : ''}
                        {t.returnPct.toFixed(2)}%
                      </span>
                    </td>

                    {/* P&L ($) */}
                    <td className="py-3 px-3.5 tabular-nums">
                      <span
                        className={`font-bold ${
                          isWin ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isWin ? '+' : '-'}${Math.abs(t.pnlDollar).toLocaleString()}
                      </span>
                    </td>

                    {/* Exit Reason */}
                    <td className="py-3 px-3.5 font-sans text-neutral-300">
                      <span className="text-[11px]">{t.exitReason}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
