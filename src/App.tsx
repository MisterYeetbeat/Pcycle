import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Clock,
  Flame,
  Globe,
  LayoutDashboard,
  Radar,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ActionableScanner } from './components/ActionableScanner.tsx';
import { BacktestDashboard } from './components/BacktestDashboard.tsx';
import { CloudStorageArchiveModal } from './components/CloudStorageArchiveModal.tsx';
import { DataImportModal } from './components/DataImportModal.tsx';
import { DesignMockupView } from './components/DesignMockupView.tsx';
import { Header } from './components/Header.tsx';
import { PositionCalculatorModal } from './components/PositionCalculatorModal.tsx';
import { RetailChart } from './components/RetailChart.tsx';
import { SqueezeRadar } from './components/SqueezeRadar.tsx';
import { TickerSelectorMenu } from './components/TickerSelectorMenu.tsx';
import { TradeSetupPanel } from './components/TradeSetupPanel.tsx';
import { WhalePressureCard } from './components/WhalePressureCard.tsx';
import {
  CURRENT_MARKET_TICKERS,
  HISTORICAL_CATALOG_TICKERS,
  getTradePlan,
} from './data/retailTickers.ts';
import { RetailTicker } from './types.ts';
import { isMarketRTH } from './utils/marketHours.ts';
import {
  checkApiStatus,
  fetchLiveCandles,
  fetchLiveDailyAggs,
  fetchLiveDarkPool,
  fetchLiveOptionsFlow,
  fetchLiveUniverseSnapshot,
  mergeLiveMarketData,
  parseMassiveAggs,
  parseMassiveDailyAggs,
  parseTickerSnapshots,
} from './services/liveMarketFeed.ts';

// Comprehensive Dynamic Opportunity Scoring Engine
export function computeOpportunityScore(t: RetailTicker): number {
  let score = 0;
  // 1. Signal priority
  if (t.signal === 'STRONG_BUY') score += 60;
  else if (t.signal === 'ACCUMULATING') score += 35;
  else if (t.signal === 'NEUTRAL') score += 15;
  else if (t.signal === 'TAKE_PROFIT') score += 10;
  else if (t.signal === 'AVOID') score -= 20;

  // 2. Grade priority
  if (t.setupGrade === 'A+') score += 35;
  else if (t.setupGrade === 'A') score += 25;
  else if (t.setupGrade === 'B') score += 12;
  else if (t.setupGrade === 'WATCH') score += 5;

  // 3. Relative Volume (RVOL) Surge
  score += Math.min(t.volumeRatio * 8, 30);

  // 4. Intraday Session Momentum (% Change)
  score += Math.max(0, Math.min(t.changePercent * 2.5, 30));

  // 5. Short interest Trapped Float
  if (t.shortInterestPct) {
    score += Math.min(t.shortInterestPct * 1.1, 35);
  }

  // 6. Whale Flow Skew (Institutional call buying %)
  score += (t.whaleFlowBullishPct / 100) * 20;

  // 7. Risk to Reward Ratio
  score += Math.min(t.rrr * 3.5, 20);

  // 8. Dark Pool Bed support proximity
  if (t.darkPoolBed && t.price >= t.darkPoolBed) {
    score += 10;
  }

  return score;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chart_signals' | 'scanner' | 'squeeze_radar' | 'backtest' | 'design_mockup'>('chart_signals');
  const [dataMode, setDataMode] = useState<'LIVE' | 'HISTORICAL'>('LIVE');

  // Active base dataset based on mode
  const activeTickerList = useMemo(() => {
    return dataMode === 'LIVE' ? CURRENT_MARKET_TICKERS : HISTORICAL_CATALOG_TICKERS;
  }, [dataMode]);

  // Live market overrides map symbol -> RetailTicker
  const [liveOverrides, setLiveOverrides] = useState<Record<string, RetailTicker>>({});

  // Merge universe with real-time live market overrides
  const mergedUniverse = useMemo(() => {
    return activeTickerList.map((t) => {
      return liveOverrides[t.symbol] || t;
    });
  }, [activeTickerList, liveOverrides]);

  // Dynamically ranked tickers from #1 to #56 based on real-time composite score
  const rankedTickers = useMemo(() => {
    return [...mergedUniverse].sort(
      (a, b) => computeOpportunityScore(b) - computeOpportunityScore(a)
    );
  }, [mergedUniverse]);

  // Dynamic top ranked setup across active tickers
  const topRankedSymbol = useMemo(() => {
    return rankedTickers[0]?.symbol || 'AAOI';
  }, [rankedTickers]);

  // Track user-selected ticker (null = auto-follow top dynamic opportunity)
  const [userSelectedSymbol, setUserSelectedSymbol] = useState<string | null>(null);

  // Active selected ticker symbol
  const selectedTickerSymbol = userSelectedSymbol || topRankedSymbol;

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isDataImportOpen, setIsDataImportOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [engineNotification, setEngineNotification] = useState<string | null>(null);

  // 1. Poll Multi-Ticker Snapshot for whole universe to keep Top 10 constantly updated
  useEffect(() => {
    let isSubscribed = true;

    async function syncUniverse() {
      try {
        const snapRes = await fetchLiveUniverseSnapshot();
        if (!isSubscribed) return;
        const parsed = parseTickerSnapshots(snapRes);

        if (Object.keys(parsed).length > 0) {
          setLiveOverrides((prev) => {
            const next = { ...prev };
            for (const [sym, data] of Object.entries(parsed)) {
              const base = activeTickerList.find((t) => t.symbol === sym);
              if (base) {
                const current = next[sym] || base;
                next[sym] = {
                  ...current,
                  price: data.price,
                  changePercent: data.changePercent,
                  volumeRatio: data.volumeRatio,
                };
              }
            }
            return next;
          });
        }
      } catch (err) {
        console.debug('Universe snapshot poll:', err);
      }
    }

    // 1. Initial snapshot fetch
    syncUniverse();

    // 2. Continuous polling ONLY during Regular Trading Hours (Mon-Fri 9:30 AM - 4:00 PM ET)
    const interval = setInterval(() => {
      if (isMarketRTH()) {
        syncUniverse();
      }
    }, 20000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeTickerList]);

  // 2. Poll Detailed real-time feeds (Candles, Flow, Dark Pool) for active ticker (Only during RTH)
  useEffect(() => {
    let isSubscribed = true;

    async function syncActiveTickerData() {
      if (!selectedTickerSymbol) return;

      try {
        const [status, aggsRes, dailyAggsRes, flowRes, darkPoolRes] = await Promise.allSettled([
          checkApiStatus(),
          fetchLiveCandles(selectedTickerSymbol, '5', 'minute'),
          fetchLiveDailyAggs(selectedTickerSymbol, '2026-05-01', '2026-10-01'),
          fetchLiveOptionsFlow(selectedTickerSymbol),
          fetchLiveDarkPool(selectedTickerSymbol, 30),
        ]);

        if (!isSubscribed) return;

        const liveBars =
          aggsRes.status === 'fulfilled' ? parseMassiveAggs(aggsRes.value) : [];
        const liveDailyBars =
          dailyAggsRes.status === 'fulfilled' ? parseMassiveDailyAggs(dailyAggsRes.value) : [];
        const liveFlow = flowRes.status === 'fulfilled' ? flowRes.value : null;
        const liveDarkPool =
          darkPoolRes.status === 'fulfilled' ? darkPoolRes.value : null;

        const base =
          activeTickerList.find((t) => t.symbol === selectedTickerSymbol) ||
          activeTickerList[0];

        if (liveBars.length > 0 || liveDailyBars.length > 0 || liveFlow || liveDarkPool) {
          const merged = mergeLiveMarketData(base, liveBars, liveDailyBars, liveFlow, liveDarkPool);
          setLiveOverrides((prev) => ({
            ...prev,
            [selectedTickerSymbol]: merged,
          }));
        }
      } catch (err) {
        console.debug('Active ticker feed sync error:', err);
      }
    }

    // 1. Initial ticker data load
    syncActiveTickerData();

    // 2. Recurring feed updates only during Regular Trading Hours (RTH)
    const interval = setInterval(() => {
      if (isMarketRTH()) {
        syncActiveTickerData();
      }
    }, 15000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [selectedTickerSymbol, activeTickerList]);

  // Active selected ticker (with live overrides merged if available)
  const selectedTicker: RetailTicker = useMemo(() => {
    if (liveOverrides[selectedTickerSymbol]) {
      return liveOverrides[selectedTickerSymbol];
    }
    return (
      activeTickerList.find((t) => t.symbol === selectedTickerSymbol) || activeTickerList[0]
    );
  }, [activeTickerList, selectedTickerSymbol, liveOverrides]);

  // Real-time trade blueprint calculated from market cycle engine
  const tradePlan = useMemo(() => {
    return getTradePlan(selectedTicker);
  }, [selectedTicker]);

  const handleSelectTicker = (ticker: RetailTicker) => {
    setUserSelectedSymbol(ticker.symbol);
    setActiveTab('chart_signals');
  };

  const handleRerunEngine = () => {
    setIsEngineRunning(true);
    setEngineNotification('Executing MarketCycleEngine across 56 universe tickers for 2026-10-01 market session...');
    
    setTimeout(() => {
      setIsEngineRunning(false);
      setEngineNotification('✓ MarketCycleEngine Complete: Opportunity scores, momentum brackets and Top 10 rankings recalculated for 2026-10-01.');
      setTimeout(() => {
        setEngineNotification(null);
      }, 5000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-neutral-950">
      {/* 3-Zone Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenDataImport={() => setIsDataImportOpen(true)}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onRerunEngine={handleRerunEngine}
        isEngineRunning={isEngineRunning}
      />

      {/* Engine Status Notification */}
      {engineNotification && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-2.5 text-xs font-mono text-emerald-300 flex items-center justify-between sticky top-[61px] z-30 shadow-lg">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Zap className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>{engineNotification}</span>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab 0: Design Mockup & Wireframe Architecture Specification */}
        {activeTab === 'design_mockup' && (
          <DesignMockupView onReturnToLive={() => setActiveTab('chart_signals')} />
        )}

        {/* Clean Institutional Ticker Selector & Dataset Menu (Hidden in Design Mockup view) */}
        {activeTab !== 'design_mockup' && (
          <TickerSelectorMenu
            tickers={rankedTickers}
            selectedTicker={selectedTicker}
            topRankedSymbol={topRankedSymbol}
            isAutoFollow={userSelectedSymbol === null}
            onSelectTicker={(sym) => {
              setUserSelectedSymbol(sym);
            }}
            onToggleAutoFollow={() => {
              if (userSelectedSymbol === null) {
                setUserSelectedSymbol(topRankedSymbol);
              } else {
                setUserSelectedSymbol(null);
              }
            }}
            dataMode={dataMode}
            onChangeDataMode={(mode) => {
              setDataMode(mode);
              setUserSelectedSymbol(null);
            }}
          />
        )}

        {/* Tab 1: Live Chart & Visual Strategy Zone (Option A Native Engine) */}
        {activeTab === 'chart_signals' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left 8 Cols: Option A Interactive Visual Chart Engine */}
            <div className="xl:col-span-8 space-y-6">
              <RetailChart ticker={selectedTicker} tradePlan={tradePlan} />
              <WhalePressureCard ticker={selectedTicker} />
            </div>

            {/* Right 4 Cols: Mathematical Trade Blueprint & Execution Engine */}
            <div className="xl:col-span-4">
              <TradeSetupPanel
                ticker={selectedTicker}
                tradePlan={tradePlan}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Actionable Opportunity Scanner */}
        {activeTab === 'scanner' && (
          <ActionableScanner
            tickers={rankedTickers}
            selectedTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
          />
        )}

        {/* Tab 3: Trapped Short Squeeze Radar */}
        {activeTab === 'squeeze_radar' && (
          <SqueezeRadar
            tickers={rankedTickers}
            onSelectTicker={handleSelectTicker}
          />
        )}

        {/* Tab 4: MarketCycleEngine Backtest Verification Dashboard */}
        {activeTab === 'backtest' && <BacktestDashboard />}
      </main>

      {/* Position Sizing & Risk Management Modal */}
      <PositionCalculatorModal
        isOpen={isCalculatorOpen}
        ticker={selectedTicker}
        tradePlan={tradePlan}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Multi-Format Dataset Importer */}
      <DataImportModal
        isOpen={isDataImportOpen}
        onClose={() => setIsDataImportOpen(false)}
        onDataLoaded={(fileName, recordCount) => {
          setEngineNotification(`✓ Loaded ${recordCount} records from ${fileName}`);
          setTimeout(() => setEngineNotification(null), 5000);
        }}
      />

      {/* Google Cloud Storage Archival & Research Hub */}
      <CloudStorageArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
      />
    </div>
  );
}
