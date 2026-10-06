import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  SeriesMarker,
} from 'lightweight-charts';
import {
  Box,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Layers,
  Maximize2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from './common/DropdownMenu.tsx';
import { BarData, RetailTicker, TradePlan, TriggerEvent } from '../types.ts';
import { getMarketStatus } from '../utils/marketHours.ts';

interface RetailChartProps {
  ticker: RetailTicker;
  tradePlan: TradePlan;
}

export const RetailChart: React.FC<RetailChartProps> = ({ ticker, tradePlan }) => {
  // Chart container DOM refs
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Option A: Interactive Shaded Zones Canvas Ref
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tvCandlesRef = useRef<any[]>([]);

  // Timeframe view
  const [viewTimeframe, setViewTimeframe] = useState<'90D_TIMELINE' | 'INTRADAY_5M'>('90D_TIMELINE');
  // Engine mode
  const [engineMode, setEngineMode] = useState<'DUAL' | 'INDICATOR_ONLY' | 'STRATEGY_ONLY'>('DUAL');

  // Stream controls (Anti-Distraction Best Practice)
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [marketStatus, setMarketStatus] = useState(() => getMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Technical toggles
  const [showVwap, setShowVwap] = useState<boolean>(true);
  const [showEma, setShowEma] = useState<boolean>(true);
  const [showWhaleBeds, setShowWhaleBeds] = useState<boolean>(true);

  // Option A: Visual Shaded Boxes Controls
  const [showHitBoxes, setShowHitBoxes] = useState<boolean>(true);
  const [showExitBoxes, setShowExitBoxes] = useState<boolean>(true);
  const [showContractionBoxes, setShowContractionBoxes] = useState<boolean>(true);
  const [boxDisplayScope, setBoxDisplayScope] = useState<'ALL_TRIGGERS' | 'SELECTED_ONLY'>('ALL_TRIGGERS');
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Selected trigger to inspect
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);

  // Live Crosshair HUD Inspection
  const [crosshairInfo, setCrosshairInfo] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  const is90D = viewTimeframe === '90D_TIMELINE';
  const bars: BarData[] = is90D ? ticker.ninetyDayBars : ticker.bars;
  const triggers: TriggerEvent[] = ticker.ninetyDayTriggers;

  const showIndicator = engineMode === 'DUAL' || engineMode === 'INDICATOR_ONLY';
  const showStrategy = engineMode === 'DUAL' || engineMode === 'STRATEGY_ONLY';

  // Active inspected trigger
  const activeTrigger = React.useMemo(() => {
    if (selectedTriggerId) {
      return triggers.find((t) => t.id === selectedTriggerId) || triggers[triggers.length - 1];
    }
    return triggers[triggers.length - 1];
  }, [selectedTriggerId, triggers]);

  // Trigger Accuracy calculation
  const completedTriggers = triggers.filter((t) => t.status === 'HISTORICAL_FIRED');
  const winCount = completedTriggers.filter((t) => t.accuracySuccess).length;
  const triggerAccuracyPct =
    completedTriggers.length > 0
      ? Number(((winCount / completedTriggers.length) * 100).toFixed(1))
      : 100;

  // Track current symbol & timeframe to know when a full re-fit is warranted vs in-place update
  const currentSymbolRef = useRef<string>(ticker.symbol);
  const currentTimeframeRef = useRef<string>(viewTimeframe);

  // =========================================================================
  // OPTION A ENGINE: Render Shaded Hit, Exit & Contraction Boxes directly on Chart
  // =========================================================================
  const drawShadedZones = useCallback(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const canvas = overlayCanvasRef.current;
    const container = chartContainerRef.current;
    if (!chart || !candleSeries || !canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Limit drawing strictly to the time-scale area so price axis is clean
    const timeScaleWidth = chart.timeScale().width();
    if (timeScaleWidth <= 0) {
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.rect(0, 0, timeScaleWidth, height);
    ctx.clip();

    const candles = tvCandlesRef.current;
    if (!candles || candles.length === 0) {
      ctx.restore();
      return;
    }

    // Helper: Map Bar Index (or projected future bar) to exact X coordinate on canvas
    const getXForBar = (barIndex: number): number | null => {
      // 1. Try logicalToCoordinate first (Lightweight Charts native coordinate system)
      const lx = chart.timeScale().logicalToCoordinate(barIndex as any);
      if (lx !== null && !isNaN(lx)) {
        return lx;
      }

      // 2. Try timeToCoordinate if within candle range
      if (barIndex >= 0 && barIndex < candles.length) {
        const c = candles[barIndex];
        if (c && c.time) {
          const tx = chart.timeScale().timeToCoordinate(c.time);
          if (tx !== null && !isNaN(tx)) return tx;
        }
      }

      // 3. Fallback projection for future bars
      const lastIdx = candles.length - 1;
      if (lastIdx >= 0) {
        const lastLx = chart.timeScale().logicalToCoordinate(lastIdx as any);
        if (lastLx !== null && !isNaN(lastLx)) {
          const prevLx = chart.timeScale().logicalToCoordinate(Math.max(0, lastIdx - 1) as any);
          const spacing = prevLx !== null && lastLx > prevLx ? lastLx - prevLx : (is90D ? 14 : 20);
          return lastLx + (barIndex - lastIdx) * spacing;
        }
      }
      return null;
    };

    if (is90D) {
      // 90-Day Timeline Mode: render boxes for selected trigger or all triggers
      const triggersToRender =
        boxDisplayScope === 'SELECTED_ONLY'
          ? activeTrigger ? [activeTrigger] : []
          : triggers;

      triggersToRender.forEach((trig) => {
        const isSelected = activeTrigger?.id === trig.id;

        // Resolve exact start bar index using date or trigger metadata
        let triggerBarIdx = trig.barIndex;
        if (trig.date) {
          const matchedIdx = candles.findIndex((c) => c.time === trig.date);
          if (matchedIdx !== -1) {
            triggerBarIdx = matchedIdx;
          }
        }
        if (trig.status === 'CURRENT_READY' && triggerBarIdx >= candles.length) {
          triggerBarIdx = Math.max(0, candles.length - 1);
        }

        // 1. SHADED CONTRACTION BOX (Pre-Breakout Coiling Base)
        if (showContractionBoxes) {
          const coilBarsCount = Math.max(4, Math.round(10 * (trig.coilRatio || 0.7)));
          const startBarIdx = Math.max(0, triggerBarIdx - coilBarsCount);
          const endBarIdx = triggerBarIdx;

          const xStart = getXForBar(startBarIdx);
          const xEnd = getXForBar(endBarIdx);

          if (xStart !== null && xEnd !== null) {
            const coilSlice = bars.slice(startBarIdx, endBarIdx + 1);
            const coilHigh =
              coilSlice.length > 0 ? Math.max(...coilSlice.map((b) => b.high)) : trig.price * 1.02;
            const coilLow =
              coilSlice.length > 0 ? Math.min(...coilSlice.map((b) => b.low)) : trig.price * 0.96;

            const yTop = candleSeries.priceToCoordinate(coilHigh);
            const yBottom = candleSeries.priceToCoordinate(coilLow);

            if (yTop !== null && yBottom !== null) {
              const bX = Math.min(xStart, xEnd);
              const bW = Math.max(14, Math.abs(xEnd - xStart));
              const bY = Math.min(yTop, yBottom);
              const bH = Math.max(10, Math.abs(yBottom - yTop));

              if (bX + bW >= 0 && bX <= timeScaleWidth) {
                ctx.save();
                // Amber linear gradient
                const grad = ctx.createLinearGradient(0, bY, 0, bY + bH);
                grad.addColorStop(0, isSelected ? 'rgba(245, 158, 11, 0.20)' : 'rgba(245, 158, 11, 0.08)');
                grad.addColorStop(1, isSelected ? 'rgba(217, 119, 6, 0.12)' : 'rgba(217, 119, 6, 0.03)');
                ctx.fillStyle = grad;
                ctx.fillRect(bX, bY, bW, bH);

                // Dashed border
                ctx.strokeStyle = isSelected ? 'rgba(245, 158, 11, 0.95)' : 'rgba(245, 158, 11, 0.5)';
                ctx.lineWidth = isSelected ? 1.75 : 1;
                ctx.setLineDash([4, 3]);
                ctx.strokeRect(bX, bY, bW, bH);
                ctx.setLineDash([]);

                // Top Label Badge
                const coilPct = (trig.coilRatio ? trig.coilRatio * 100 : 65).toFixed(0);
                const coilLabel = isSelected
                  ? `⚡ CONTRACTION BASE (${coilPct}% COIL)`
                  : `⚡ BASE ${coilPct}%`;
                ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
                const tm = ctx.measureText(coilLabel);
                const pW = tm.width + 12;
                const pH = 15;
                const pX = Math.max(bX + 4, Math.min(bX + bW - pW - 2, bX + 4));
                const pY = Math.max(4, bY - pH / 2);

                ctx.fillStyle = 'rgba(18, 18, 20, 0.94)';
                ctx.fillRect(pX, pY, pW, pH);
                ctx.strokeStyle = isSelected ? 'rgba(245, 158, 11, 0.85)' : 'rgba(245, 158, 11, 0.4)';
                ctx.strokeRect(pX, pY, pW, pH);

                ctx.fillStyle = isSelected ? '#fbbf24' : '#f59e0b';
                ctx.fillText(coilLabel, pX + 6, pY + 11);
                ctx.restore();
              }
            }
          }
        }

        // 2. STRATEGY HIT BOX & EXIT STOP BOX
        const entryPrice = trig.strategy?.entryPrice ?? trig.price;
        const targetPrice = trig.strategy?.target1 ?? (entryPrice * 1.18);
        const stopPrice = trig.strategy?.stopLoss ?? (entryPrice * 0.94);

        const startX = getXForBar(triggerBarIdx);

        let exitBarIdx = triggerBarIdx + (trig.status === 'CURRENT_READY' ? 10 : 8);
        if (trig.strategy?.exitDate) {
          const matchedExitIdx = candles.findIndex((c) => c.time === trig.strategy?.exitDate);
          if (matchedExitIdx !== -1) {
            exitBarIdx = matchedExitIdx;
          }
        } else if (trig.strategy?.exitBarIndex !== undefined) {
          const offset = Math.max(4, trig.strategy.exitBarIndex - trig.barIndex);
          exitBarIdx = triggerBarIdx + offset;
        }

        const endX = getXForBar(exitBarIdx);

        if (startX !== null && endX !== null) {
          const yEntry = candleSeries.priceToCoordinate(entryPrice);
          const yTarget = candleSeries.priceToCoordinate(targetPrice);
          const yStop = candleSeries.priceToCoordinate(stopPrice);

          const bX = Math.min(startX, endX);
          const bW = Math.max(24, Math.abs(endX - startX));

          // 2A. SHADED HIT BOX (Emerald Target Profit Zone)
          if (showHitBoxes && yEntry !== null && yTarget !== null) {
            const topY = Math.min(yTarget, yEntry);
            const bH = Math.max(8, Math.abs(yEntry - yTarget));

            if (bX + bW >= 0 && bX <= timeScaleWidth) {
              ctx.save();
              const grad = ctx.createLinearGradient(0, topY, 0, topY + bH);
              grad.addColorStop(0, isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.11)');
              grad.addColorStop(1, isSelected ? 'rgba(5, 150, 105, 0.12)' : 'rgba(5, 150, 105, 0.04)');
              ctx.fillStyle = grad;
              ctx.fillRect(bX, topY, bW, bH);

              // Solid vibrant top border at Target Price
              ctx.strokeStyle = isSelected ? 'rgba(16, 185, 129, 0.95)' : 'rgba(16, 185, 129, 0.65)';
              ctx.lineWidth = isSelected ? 2 : 1.25;
              ctx.beginPath();
              ctx.moveTo(bX, topY);
              ctx.lineTo(bX + bW, topY);
              ctx.stroke();

              // Side borders
              ctx.strokeStyle = isSelected ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.3)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(bX, topY);
              ctx.lineTo(bX, topY + bH);
              ctx.moveTo(bX + bW, topY);
              ctx.lineTo(bX + bW, topY + bH);
              ctx.stroke();

              // Hit Box Label Badge
              const gainPct = (((targetPrice - entryPrice) / entryPrice) * 100).toFixed(1);
              const isHit =
                trig.strategy?.status === 'TARGET_HIT' ||
                (trig.accuracySuccess && trig.status === 'HISTORICAL_FIRED');
              const hitLabel = isHit
                ? `✓ TARGET HIT +${trig.strategy?.pnlPercent ? trig.strategy.pnlPercent.toFixed(1) : gainPct}% ($${targetPrice.toFixed(2)})`
                : `🎯 HIT BOX +${gainPct}% ($${targetPrice.toFixed(2)})`;

              ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
              const tm = ctx.measureText(hitLabel);
              const pW = tm.width + 12;
              const pH = 16;
              const pX = Math.max(bX + 4, Math.min(bX + bW - pW - 2, bX + 4));
              const pY = Math.max(4, topY - pH / 2);

              ctx.fillStyle = 'rgba(6, 44, 33, 0.95)';
              ctx.fillRect(pX, pY, pW, pH);
              ctx.strokeStyle = isSelected ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 0.5)';
              ctx.strokeRect(pX, pY, pW, pH);

              ctx.fillStyle = isSelected ? '#34d399' : '#10b981';
              ctx.fillText(hitLabel, pX + 6, pY + 11);
              ctx.restore();
            }
          }

          // 2B. SHADED EXIT STOP BOX (Rose Risk Invalidation Zone)
          if (showExitBoxes && yEntry !== null && yStop !== null) {
            const topY = Math.min(yEntry, yStop);
            const bH = Math.max(8, Math.abs(yStop - yEntry));
            const bottomBorderY = topY + bH;

            if (bX + bW >= 0 && bX <= timeScaleWidth) {
              ctx.save();
              const grad = ctx.createLinearGradient(0, topY, 0, topY + bH);
              grad.addColorStop(0, isSelected ? 'rgba(244, 63, 94, 0.11)' : 'rgba(244, 63, 94, 0.04)');
              grad.addColorStop(1, isSelected ? 'rgba(225, 29, 72, 0.24)' : 'rgba(225, 29, 72, 0.10)');
              ctx.fillStyle = grad;
              ctx.fillRect(bX, topY, bW, bH);

              // Solid vibrant bottom border at Stop Loss Price
              ctx.strokeStyle = isSelected ? 'rgba(244, 63, 94, 0.95)' : 'rgba(244, 63, 94, 0.65)';
              ctx.lineWidth = isSelected ? 2 : 1.25;
              ctx.beginPath();
              ctx.moveTo(bX, bottomBorderY);
              ctx.lineTo(bX + bW, bottomBorderY);
              ctx.stroke();

              // Side borders
              ctx.strokeStyle = isSelected ? 'rgba(244, 63, 94, 0.6)' : 'rgba(244, 63, 94, 0.3)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(bX, topY);
              ctx.lineTo(bX, bottomBorderY);
              ctx.moveTo(bX + bW, topY);
              ctx.lineTo(bX + bW, bottomBorderY);
              ctx.stroke();

              // Stop Box Label Badge
              const lossPct = (((entryPrice - stopPrice) / entryPrice) * 100).toFixed(1);
              const stopLabel = `🛡️ STOP BOX -${lossPct}% ($${stopPrice.toFixed(2)})`;

              ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
              const tm = ctx.measureText(stopLabel);
              const pW = tm.width + 12;
              const pH = 16;
              const pX = Math.max(bX + 4, Math.min(bX + bW - pW - 2, bX + 4));
              const pY = Math.min(height - pH - 4, bottomBorderY - pH / 2);

              ctx.fillStyle = 'rgba(56, 6, 18, 0.95)';
              ctx.fillRect(pX, pY, pW, pH);
              ctx.strokeStyle = isSelected ? 'rgba(244, 63, 94, 0.9)' : 'rgba(244, 63, 94, 0.5)';
              ctx.strokeRect(pX, pY, pW, pH);

              ctx.fillStyle = isSelected ? '#fb7185' : '#f43f5e';
              ctx.fillText(stopLabel, pX + 6, pY + 11);
              ctx.restore();
            }
          }

          // 2C. ENTRY DIVIDER & RRR BADGE
          if (yEntry !== null && bX + bW >= 0 && bX <= timeScaleWidth) {
            ctx.save();
            ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 1.25;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(bX, yEntry);
            ctx.lineTo(bX + bW, yEntry);
            ctx.stroke();
            ctx.setLineDash([]);

            const rrrVal =
              trig.strategy?.rrr ||
              (
                Math.abs(targetPrice - entryPrice) /
                Math.max(0.01, Math.abs(entryPrice - stopPrice))
              ).toFixed(1);
            const rrrLabel = `⚖️ ${rrrVal}:1 RRR · ENTRY $${entryPrice.toFixed(2)}`;

            ctx.font = isSelected ? 'bold 9.5px monospace' : '8.5px monospace';
            const tm = ctx.measureText(rrrLabel);
            const pW = tm.width + 12;
            const pH = 15;
            const pX = Math.max(bX + 4, Math.min(bX + bW - pW - 4, bX + (bW - pW) / 2));
            const pY = yEntry - pH / 2;

            ctx.fillStyle = 'rgba(15, 15, 18, 0.95)';
            ctx.fillRect(pX, pY, pW, pH);
            ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)';
            ctx.strokeRect(pX, pY, pW, pH);

            ctx.fillStyle = isSelected ? '#ffffff' : '#d4d4d8';
            ctx.fillText(rrrLabel, pX + 6, pY + 11);
            ctx.restore();
          }
        }
      });
    } else {
      // INTRADAY 5M Session Mode: render today's active setup boxes aligned with session candles
      const entryPrice = tradePlan.entryPrice;
      const targetPrice = tradePlan.target1;
      const stopPrice = tradePlan.stopLoss;

      const sessionMidIdx = Math.max(4, Math.floor(bars.length * 0.45)); // Morning breakout bar
      const startBarIdx = 0;
      const endBarIdx = sessionMidIdx;

      // Opening Contraction Base (Morning opening session)
      if (showContractionBoxes) {
        const xStart = getXForBar(startBarIdx);
        const xEnd = getXForBar(endBarIdx);

        if (xStart !== null && xEnd !== null) {
          const openingSlice = bars.slice(startBarIdx, endBarIdx + 1);
          const coilHigh =
            openingSlice.length > 0 ? Math.max(...openingSlice.map((b) => b.high)) : entryPrice * 1.01;
          const coilLow =
            openingSlice.length > 0 ? Math.min(...openingSlice.map((b) => b.low)) : stopPrice;

          const yTop = candleSeries.priceToCoordinate(coilHigh);
          const yBottom = candleSeries.priceToCoordinate(coilLow);

          if (yTop !== null && yBottom !== null) {
            const bX = Math.min(xStart, xEnd);
            const bW = Math.max(16, Math.abs(xEnd - xStart));
            const bY = Math.min(yTop, yBottom);
            const bH = Math.max(10, Math.abs(yBottom - yTop));

            ctx.save();
            const grad = ctx.createLinearGradient(0, bY, 0, bY + bH);
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
            grad.addColorStop(1, 'rgba(217, 119, 6, 0.08)');
            ctx.fillStyle = grad;
            ctx.fillRect(bX, bY, bW, bH);

            ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(bX, bY, bW, bH);
            ctx.setLineDash([]);

            ctx.font = 'bold 9.5px monospace';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText('⚡ OPENING COIL BASE', bX + 6, bY + 12);
            ctx.restore();
          }
        }
      }

      // Hit Box & Stop Box (from breakout inception through session projection)
      const entryBarIdx = sessionMidIdx;
      const exitBarIdx = Math.min(bars.length + 8, 45);
      const xStart = getXForBar(entryBarIdx);
      const xEnd = getXForBar(exitBarIdx);

      if (xStart !== null && xEnd !== null) {
        const yEntry = candleSeries.priceToCoordinate(entryPrice);
        const yTarget = candleSeries.priceToCoordinate(targetPrice);
        const yStop = candleSeries.priceToCoordinate(stopPrice);

        const bX = Math.min(xStart, xEnd);
        const bW = Math.max(28, Math.abs(xEnd - xStart));

        // Intraday Hit Box
        if (showHitBoxes && yEntry !== null && yTarget !== null) {
          const topY = Math.min(yTarget, yEntry);
          const bH = Math.max(8, Math.abs(yEntry - yTarget));

          ctx.save();
          const grad = ctx.createLinearGradient(0, topY, 0, topY + bH);
          grad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
          grad.addColorStop(1, 'rgba(5, 150, 105, 0.08)');
          ctx.fillStyle = grad;
          ctx.fillRect(bX, topY, bW, bH);

          ctx.strokeStyle = 'rgba(16, 185, 129, 0.95)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bX, topY);
          ctx.lineTo(bX + bW, topY);
          ctx.stroke();

          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#34d399';
          ctx.fillText(`🎯 INTRADAY HIT BOX (+${tradePlan.rewardPercent}%) $${targetPrice.toFixed(2)}`, bX + 6, topY + 14);
          ctx.restore();
        }

        // Intraday Stop Box
        if (showExitBoxes && yEntry !== null && yStop !== null) {
          const topY = Math.min(yEntry, yStop);
          const bH = Math.max(8, Math.abs(yStop - yEntry));
          const bottomY = topY + bH;

          ctx.save();
          const grad = ctx.createLinearGradient(0, topY, 0, topY + bH);
          grad.addColorStop(0, 'rgba(244, 63, 94, 0.08)');
          grad.addColorStop(1, 'rgba(225, 29, 72, 0.22)');
          ctx.fillStyle = grad;
          ctx.fillRect(bX, topY, bW, bH);

          ctx.strokeStyle = 'rgba(244, 63, 94, 0.95)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bX, bottomY);
          ctx.lineTo(bX + bW, bottomY);
          ctx.stroke();

          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#fb7185';
          ctx.fillText(`🛡️ INTRADAY STOP LOSS (-${tradePlan.riskPercent}%) $${stopPrice.toFixed(2)}`, bX + 6, bottomY - 6);
          ctx.restore();
        }

        // Entry Divider
        if (yEntry !== null) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1.25;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(bX, yEntry);
          ctx.lineTo(bX + bW, yEntry);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = 'bold 9.5px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`⚖️ ${tradePlan.rrr}:1 RRR · ENTRY $${entryPrice.toFixed(2)}`, bX + 10, yEntry - 4);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }, [
    activeTrigger,
    bars,
    boxDisplayScope,
    is90D,
    showContractionBoxes,
    showExitBoxes,
    showHitBoxes,
    tradePlan,
    triggers,
  ]);

  // 1. Initialize TradingView Chart Canvas ONCE (or on symbol/timeframe switch)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;

    // Create TradingView Chart instance with high-performance dark theme
    const chart = createChart(container, {
      width: container.clientWidth || 1000,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#09090b' },
        textColor: '#a1a1aa',
        fontFamily: 'monospace, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#18181b', style: LineStyle.Dotted },
        horzLines: { color: '#18181b', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#06b6d4',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#083344',
        },
        horzLine: {
          color: '#06b6d4',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0e7490',
        },
      },
      rightPriceScale: {
        borderColor: '#27272a',
        scaleMargins: { top: 0.1, bottom: 0.25 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: is90D ? 14 : 20,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });
    candleSeriesRef.current = candleSeries;

    // 2. Volume Histogram Sub-Panel
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#38bdf8',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // 3. Technical Indicator Overlays
    const vwapSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'VWAP',
    });
    vwapSeriesRef.current = vwapSeries;

    const ema9Series = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 1,
      priceLineVisible: false,
      title: 'EMA 9',
    });
    ema9SeriesRef.current = ema9Series;

    const ema21Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1,
      priceLineVisible: false,
      title: 'EMA 21',
    });
    ema21SeriesRef.current = ema21Series;

    // Crosshair Move Subscription
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y > 480
      ) {
        setCrosshairInfo(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeries) as any;
      const volData = param.seriesData.get(volumeSeries) as any;

      if (candleData) {
        let timeStr = typeof param.time === 'string' ? param.time : '';
        if (typeof param.time === 'number') {
          const d = new Date(param.time * 1000);
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        setCrosshairInfo({
          time: timeStr,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData?.value || 0,
        });
      }
    });

    // Window resize listener
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
        drawShadedZones();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      vwapSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema21SeriesRef.current = null;
      priceLinesRef.current = [];
    };
  }, [ticker.symbol, viewTimeframe, is90D, drawShadedZones]);

  // 2. Update Series Data, Markers & Price Lines in-place without destroying the canvas
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const vwapSeries = vwapSeriesRef.current;
    const ema9Series = ema9SeriesRef.current;
    const ema21Series = ema21SeriesRef.current;
    const chart = chartRef.current;

    if (!candleSeries || !volumeSeries || !vwapSeries || !ema9Series || !ema21Series || !chart) {
      return;
    }

    const isSymbolOrTimeframeSwitch =
      currentSymbolRef.current !== ticker.symbol ||
      currentTimeframeRef.current !== viewTimeframe;

    // If stream is paused and user is inspecting the same chart, skip auto-refresh to prevent distraction
    if (isStreamPaused && !isSymbolOrTimeframeSwitch) {
      return;
    }

    // Map Bars to TradingView Data formats
    const tvCandles: any[] = [];
    const tvVolume: any[] = [];
    const tvVwap: any[] = [];
    const tvEma9: any[] = [];
    const tvEma21: any[] = [];

    const k9 = 2 / (9 + 1);
    const k21 = 2 / (21 + 1);
    let prevEma9 = bars[0]?.close || 100;
    let prevEma21 = bars[0]?.close || 100;
    let cumTypicalVol = 0;
    let cumVol = 0;

    const sessionBase = new Date('2026-10-01T09:30:00-04:00');

    bars.forEach((bar, idx) => {
      let timeVal: any;

      if (is90D) {
        const dateMatch = bar.timestamp.match(/^\d{4}-\d{2}-\d{2}$/);
        if (dateMatch) {
          timeVal = bar.timestamp;
        } else {
          // Fallback trading date calculation
          const d = new Date('2026-10-01T16:00:00-04:00');
          d.setDate(d.getDate() - (bars.length - 1 - idx));
          timeVal = d.toISOString().split('T')[0];
        }
      } else {
        timeVal = Math.floor(sessionBase.getTime() / 1000) + idx * 300;
      }

      tvCandles.push({
        time: timeVal,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      });

      tvVolume.push({
        time: timeVal,
        value: bar.volume,
        color: bar.close >= bar.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)',
      });

      const curEma9 = bar.close * k9 + prevEma9 * (1 - k9);
      const curEma21 = bar.close * k21 + prevEma21 * (1 - k21);
      prevEma9 = curEma9;
      prevEma21 = curEma21;

      tvEma9.push({ time: timeVal, value: curEma9 });
      tvEma21.push({ time: timeVal, value: curEma21 });

      const typical = (bar.high + bar.low + bar.close) / 3;
      cumTypicalVol += typical * bar.volume;
      cumVol += bar.volume;
      tvVwap.push({ time: timeVal, value: cumVol > 0 ? cumTypicalVol / cumVol : typical });
    });

    // Cache candles in ref for Option A overlay rendering
    tvCandlesRef.current = tvCandles;

    // In-place series update
    candleSeries.setData(tvCandles);
    volumeSeries.setData(tvVolume);
    vwapSeries.setData(showVwap ? tvVwap : []);
    ema9Series.setData(showEma ? tvEma9 : []);
    ema21Series.setData(showEma ? tvEma21 : []);

    // Clear previous price lines before recreating
    priceLinesRef.current.forEach((pl) => {
      try {
        candleSeries.removePriceLine(pl);
      } catch {
        // ignore
      }
    });
    priceLinesRef.current = [];

    // Horizontal Price Lines (Whale Bed & Call Wall)
    if (showWhaleBeds && ticker.darkPoolBed) {
      const pl = candleSeries.createPriceLine({
        price: ticker.darkPoolBed,
        color: '#a855f7',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'WHALE BED',
      });
      priceLinesRef.current.push(pl);
    }

    if (showWhaleBeds && ticker.callWall) {
      const pl = candleSeries.createPriceLine({
        price: ticker.callWall,
        color: '#f97316',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'CALL WALL',
      });
      priceLinesRef.current.push(pl);
    }

    // Trigger Markers
    if (showIndicator) {
      const markers: SeriesMarker<any>[] = [];

      triggers.forEach((trig) => {
        const barIdx = Math.min(tvCandles.length - 1, trig.barIndex);
        const candlePoint = tvCandles[barIdx];
        if (!candlePoint) return;

        const isReadyNow = trig.status === 'CURRENT_READY';
        const isTargetHit = trig.accuracySuccess;

        markers.push({
          time: candlePoint.time,
          position: 'belowBar',
          color: isReadyNow ? '#10b981' : isTargetHit ? '#06b6d4' : '#f43f5e',
          shape: 'arrowUp',
          text: isReadyNow
            ? 'TRIGGER'
            : isTargetHit
            ? `HIT +${trig.strategy?.pnlPercent.toFixed(0) || trig.maxGainPct}%`
            : `STOP`,
          size: 1,
        });

        if (trig.strategy && trig.strategy.status === 'TARGET_HIT') {
          const exitIdx = Math.min(tvCandles.length - 1, trig.strategy.exitBarIndex);
          const exitPoint = tvCandles[exitIdx];
          if (exitPoint) {
            markers.push({
              time: exitPoint.time,
              position: 'aboveBar',
              color: '#10b981',
              shape: 'circle',
              text: `EXIT +${trig.strategy.pnlPercent.toFixed(0)}%`,
              size: 1,
            });
          }
        }
      });

      createSeriesMarkers(candleSeries, markers);
    } else {
      createSeriesMarkers(candleSeries, []);
    }

    // Strategy Brackets
    if (showStrategy && tradePlan) {
      const p1 = candleSeries.createPriceLine({
        price: tradePlan.target1,
        color: '#10b981',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `TARGET 1: $${tradePlan.target1.toFixed(2)} (+${tradePlan.rewardPercent}%)`,
      });
      priceLinesRef.current.push(p1);

      const p2 = candleSeries.createPriceLine({
        price: tradePlan.stopLoss,
        color: '#f43f5e',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `STOP: $${tradePlan.stopLoss.toFixed(2)} (-${tradePlan.riskPercent}%)`,
      });
      priceLinesRef.current.push(p2);

      const p3 = candleSeries.createPriceLine({
        price: tradePlan.entryPrice,
        color: '#e4e4e7',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `ENTRY: $${tradePlan.entryPrice.toFixed(2)}`,
      });
      priceLinesRef.current.push(p3);
    }

    // Auto-fit on ticker or timeframe switch
    if (
      currentSymbolRef.current !== ticker.symbol ||
      currentTimeframeRef.current !== viewTimeframe
    ) {
      chart.timeScale().fitContent();
      currentSymbolRef.current = ticker.symbol;
      currentTimeframeRef.current = viewTimeframe;
    }

    // Immediate draw of shaded visual zones
    requestAnimationFrame(drawShadedZones);
  }, [
    bars,
    is90D,
    showVwap,
    showEma,
    showWhaleBeds,
    showIndicator,
    showStrategy,
    ticker.symbol,
    ticker.darkPoolBed,
    ticker.callWall,
    tradePlan,
    triggers,
    viewTimeframe,
    isStreamPaused,
    drawShadedZones,
  ]);

  // 3. Keep Shaded Boxes 100% Synchronized During Interactive Panning and Zooming
  useEffect(() => {
    const chart = chartRef.current;
    const container = chartContainerRef.current;
    if (!chart || !container) return;

    // Subscribe to Lightweight Charts coordinate updates
    const onRangeChange = () => {
      requestAnimationFrame(drawShadedZones);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);
    chart.timeScale().subscribeVisibleTimeRangeChange(onRangeChange);

    // 60FPS animation sync while mouse / pointer is dragging or scrolling wheel
    let isInteracting = false;
    let animId: number | null = null;

    const frameLoop = () => {
      drawShadedZones();
      if (isInteracting) {
        animId = requestAnimationFrame(frameLoop);
      }
    };

    const handlePointerDown = () => {
      isInteracting = true;
      if (!animId) {
        animId = requestAnimationFrame(frameLoop);
      }
    };

    const handlePointerUp = () => {
      isInteracting = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      requestAnimationFrame(drawShadedZones);
    };

    const handleWheel = () => {
      requestAnimationFrame(drawShadedZones);
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: true });

    // Initial render
    requestAnimationFrame(drawShadedZones);

    return () => {
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
        chart.timeScale().unsubscribeVisibleTimeRangeChange(onRangeChange);
      } catch {
        // chart may already be destroyed
      }
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [drawShadedZones]);

  // Focus and center viewport on a specific trigger's visual boxes
  const handleFocusTrigger = (trig: TriggerEvent) => {
    setSelectedTriggerId(trig.id);
    if (chartRef.current) {
      const startIdx = Math.max(0, trig.barIndex - 12);
      const endIdx = trig.strategy?.exitBarIndex ? trig.strategy.exitBarIndex + 10 : trig.barIndex + 16;
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: startIdx,
        to: endIdx,
      });
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const handleManualRefresh = () => {
    setIsManualSyncing(true);
    setLastSyncTime(new Date());
    setTimeout(() => {
      setIsManualSyncing(false);
      requestAnimationFrame(drawShadedZones);
    }, 350);
  };

  // Grouped Menu Item Definitions (Professional UX Architecture)
  const activeIndicatorCount = [showVwap, showEma, showWhaleBeds].filter(Boolean).length;
  const activeBoxCount = [showHitBoxes, showExitBoxes, showContractionBoxes].filter(Boolean).length;

  const indicatorMenuItems: DropdownMenuItem[] = [
    {
      id: 'vwap',
      type: 'checkbox',
      label: 'VWAP Benchmark',
      description: 'Volume-Weighted Average Price line',
      checked: showVwap,
      onClick: () => setShowVwap(!showVwap),
    },
    {
      id: 'ema',
      type: 'checkbox',
      label: 'EMA 9 / 21 Ribbon',
      description: 'Fast and slow exponential moving averages',
      checked: showEma,
      onClick: () => setShowEma(!showEma),
    },
    {
      id: 'whale',
      type: 'checkbox',
      label: 'Whale Levels',
      description: 'Dark pool support bed & options call wall',
      checked: showWhaleBeds,
      onClick: () => setShowWhaleBeds(!showWhaleBeds),
    },
  ];

  const strategyBoxMenuItems: DropdownMenuItem[] = [
    {
      id: 'hit_box',
      type: 'checkbox',
      label: 'Target Hit Box',
      description: 'Shaded emerald profit zone to Target 1',
      checked: showHitBoxes,
      onClick: () => setShowHitBoxes(!showHitBoxes),
    },
    {
      id: 'exit_box',
      type: 'checkbox',
      label: 'Stop Loss Box',
      description: 'Shaded rose risk invalidation zone',
      checked: showExitBoxes,
      onClick: () => setShowExitBoxes(!showExitBoxes),
    },
    {
      id: 'contraction_box',
      type: 'checkbox',
      label: 'Contraction Base',
      description: 'Shaded amber pre-breakout compression channel',
      checked: showContractionBoxes,
      onClick: () => setShowContractionBoxes(!showContractionBoxes),
    },
    {
      id: 'scope_divider',
      type: 'divider',
      label: '',
    },
    {
      id: 'scope_header',
      type: 'header',
      label: 'Display Scope',
    },
    {
      id: 'scope_all',
      type: 'radio',
      label: 'All 90-Day Setups',
      description: 'Show visual brackets for all cycle triggers',
      checked: boxDisplayScope === 'ALL_TRIGGERS',
      onClick: () => setBoxDisplayScope('ALL_TRIGGERS'),
    },
    {
      id: 'scope_selected',
      type: 'radio',
      label: 'Selected Setup Only',
      description: 'Focus strictly on currently inspected trigger',
      checked: boxDisplayScope === 'SELECTED_ONLY',
      onClick: () => setBoxDisplayScope('SELECTED_ONLY'),
    },
  ];

  const layerMenuItems: DropdownMenuItem[] = [
    {
      id: 'layer_dual',
      type: 'radio',
      label: 'Combined View',
      description: 'Technicals + strategy execution brackets',
      checked: engineMode === 'DUAL',
      onClick: () => setEngineMode('DUAL'),
    },
    {
      id: 'layer_indicator',
      type: 'radio',
      label: 'Indicator Signals Only',
      description: 'Triggers, volume spikes & EMA/VWAP',
      checked: engineMode === 'INDICATOR_ONLY',
      onClick: () => setEngineMode('INDICATOR_ONLY'),
    },
    {
      id: 'layer_strategy',
      type: 'radio',
      label: 'Strategy Only',
      description: 'Hit/Stop boxes and RRR execution',
      checked: engineMode === 'STRATEGY_ONLY',
      onClick: () => setEngineMode('STRATEGY_ONLY'),
    },
  ];

  const viewMenuItems: DropdownMenuItem[] = [
    {
      id: 'toggle_stream',
      type: 'checkbox',
      label: 'Live Candle Stream',
      description: isStreamPaused ? 'Paused (click to resume polling)' : 'Active (streaming live updates)',
      checked: !isStreamPaused,
      onClick: () => setIsStreamPaused(!isStreamPaused),
    },
    {
      id: 'manual_sync',
      label: 'Sync Data Now',
      description: `Last synced: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      icon: <RefreshCw className={`h-3.5 w-3.5 ${isManualSyncing ? 'animate-spin text-emerald-400' : 'text-neutral-400'}`} />,
      onClick: handleManualRefresh,
    },
    {
      id: 'view_divider_stream',
      type: 'divider',
      label: '',
    },
    {
      id: 'zoom_setup',
      label: 'Zoom to Setup',
      description: 'Center viewport on active setup',
      icon: <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />,
      onClick: () => activeTrigger && handleFocusTrigger(activeTrigger),
    },
    {
      id: 'reset_zoom',
      label: 'Fit All Bars',
      description: 'Reset full timeline view',
      icon: <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />,
      onClick: handleResetZoom,
    },
    {
      id: 'view_divider',
      type: 'divider',
      label: '',
    },
    {
      id: 'toggle_legend',
      type: 'checkbox',
      label: 'Show Visual Legend',
      description: 'Color swatches for chart zones',
      checked: showLegend,
      onClick: () => setShowLegend(!showLegend),
    },
  ];

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
      {/* Top Header: Symbol & Grouped Chart Menus */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-bold text-white tracking-tight font-mono">{ticker.symbol}</span>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">{ticker.name}</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${
                ticker.currentTriggerState === 'READY_NOW'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/20'
                  : ticker.currentTriggerState === 'COILING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {ticker.currentTriggerState === 'READY_NOW'
                ? '⚡ TRIGGER READY NOW'
                : ticker.currentTriggerState === 'COILING'
                ? '⏳ COILING / NOT TRIGGERED'
                : 'HOLD / NEUTRAL'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs font-mono">
            <span className="text-xl font-bold text-white tabular-nums">${ticker.price.toFixed(2)}</span>
            <span
              className={`font-semibold tabular-nums text-sm ${
                ticker.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {ticker.changePercent >= 0 ? '+' : ''}
              {ticker.changePercent.toFixed(2)}%
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-400">
              90-Day Hit Rate:{' '}
              <strong className="text-emerald-400 font-bold">{triggerAccuracyPct}%</strong> ({winCount}/{completedTriggers.length} Hit)
            </span>
          </div>
        </div>

        {/* Grouped Chart Menus (Collapses 15+ loose buttons into 4 clean, structured menus) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Stream Controller Button */}
          <div className="flex items-center p-0.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setIsStreamPaused(!isStreamPaused)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                !marketStatus.isRTH
                  ? 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                  : isStreamPaused
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60'
              }`}
              title={
                !marketStatus.isRTH
                  ? `${marketStatus.label}: Live stream active ONLY during Regular Trading Hours (Mon-Fri 9:30 AM - 4:00 PM ET). Polling is suspended outside RTH. Click Sync Now to manually refresh.`
                  : isStreamPaused
                  ? 'Live feed is paused. Click to resume streaming updates.'
                  : 'Live feed streaming active. Click to pause chart while analyzing.'
              }
            >
              {!marketStatus.isRTH ? (
                <>
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span className="font-semibold text-neutral-300">RTH Closed</span>
                </>
              ) : isStreamPaused ? (
                <>
                  <Pause className="h-3 w-3 text-amber-400" />
                  <span className="font-semibold">Paused</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold">Live (RTH)</span>
                </>
              )}
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={isManualSyncing}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              title={`Sync latest candle bars now (Last synced: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isManualSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Timeframe Switcher (Segmented Control) */}
          <div className="flex items-center p-0.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setViewTimeframe('90D_TIMELINE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                is90D
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              90D Timeline
            </button>
            <button
              onClick={() => setViewTimeframe('INTRADAY_5M')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                !is90D
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              5M Intraday
            </button>
          </div>

          {/* Menu 1: Indicators & Overlays */}
          <DropdownMenu
            label="Indicators"
            icon={<Layers className="h-3.5 w-3.5 text-cyan-400" />}
            items={indicatorMenuItems}
            badgeCount={activeIndicatorCount}
            headerTitle="Chart Technicals"
          />

          {/* Menu 2: Visual Boxes (Option A) */}
          <DropdownMenu
            label="Visual Boxes"
            icon={<Box className="h-3.5 w-3.5 text-emerald-400" />}
            items={strategyBoxMenuItems}
            badgeCount={activeBoxCount}
            headerTitle="Strategy Visual Zones"
          />

          {/* Menu 3: Engine Mode Layer */}
          <DropdownMenu
            label={engineMode === 'DUAL' ? 'Dual Mode' : engineMode === 'INDICATOR_ONLY' ? 'Signals' : 'Strategy'}
            icon={<Eye className="h-3.5 w-3.5 text-neutral-400" />}
            items={layerMenuItems}
            headerTitle="Analysis Layer"
          />

          {/* Menu 4: View & Zoom Actions */}
          <DropdownMenu
            label="View"
            icon={<Maximize2 className="h-3.5 w-3.5 text-neutral-400" />}
            items={viewMenuItems}
            align="right"
            headerTitle="Chart Viewport"
          />
        </div>
      </div>

      {/* Optional Institutional Visual Zones Legend Bar (Toggleable from View menu) */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-neutral-950/70 border border-neutral-800/70 rounded-lg text-[11px] font-mono select-none">
          <div className="flex flex-wrap items-center gap-4 text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-emerald-500/30 border border-emerald-400"></span>
              <span className="text-emerald-300 font-semibold">Hit Box (Profit Zone)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-rose-500/30 border border-rose-400"></span>
              <span className="text-rose-300 font-semibold">Stop Box (Risk Invalidation)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-amber-500/30 border border-amber-400 border-dashed"></span>
              <span className="text-amber-300 font-semibold">Contraction Base (Coiling Phase)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-purple-400"></span>
              <span className="text-purple-300">Whale Bed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-orange-400"></span>
              <span className="text-orange-300">Call Wall</span>
            </div>
          </div>

          <button
            onClick={() => setShowLegend(false)}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
            title="Dismiss legend (re-enable anytime via View menu)"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* Clean Institutional HUD Bar: Trigger Status, Hit Box Target, and Live Bar Data */}
      <div className="p-3 bg-neutral-950/90 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Trigger & Hit Box Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>TRIGGER: {ticker.currentTriggerState === 'READY_NOW' ? 'ACTIVE READY' : `${triggers.length} FIRED (${triggerAccuracyPct}% WIN)`}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <span className="font-bold">HIT BOX:</span>
            <span>${tradePlan.target1.toFixed(2)} (+{tradePlan.rewardPercent}%)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <span className="font-bold">STOP:</span>
            <span>${tradePlan.stopLoss.toFixed(2)} (-{tradePlan.riskPercent}%)</span>
          </div>

          <span className="text-neutral-600 hidden sm:inline">|</span>

          {/* Candlestick Crosshair Info */}
          <span className="text-neutral-400">
            BAR: <strong className="text-white">{crosshairInfo?.time || bars[bars.length - 1]?.timestamp || 'Latest'}</strong>
          </span>
          <span>
            O: <strong className="text-white">${(crosshairInfo?.open ?? bars[bars.length - 1]?.open)?.toFixed(2)}</strong>
          </span>
          <span>
            H: <strong className="text-emerald-400">${(crosshairInfo?.high ?? bars[bars.length - 1]?.high)?.toFixed(2)}</strong>
          </span>
          <span>
            L: <strong className="text-rose-400">${(crosshairInfo?.low ?? bars[bars.length - 1]?.low)?.toFixed(2)}</strong>
          </span>
          <span>
            C: <strong className="text-white font-bold">${(crosshairInfo?.close ?? bars[bars.length - 1]?.close)?.toFixed(2)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span>Drag to pan · Scroll to zoom</span>
          <span className="text-neutral-600">|</span>
          <span className="text-cyan-400">Drag Y-Axis to scale</span>
        </div>
      </div>

      {/* TradingView Lightweight Charts Container + Option A Shaded Overlay Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-800/80 bg-neutral-950 shadow-inner">
        {/* TradingView Chart Container */}
        <div ref={chartContainerRef} className="w-full" style={{ height: '480px' }} />

        {/* Option A Shaded Boxes Canvas Overlay (pointer-events-none lets all drag/zoom pass through to TradingView) */}
        <canvas
          ref={overlayCanvasRef}
          className="pointer-events-none absolute inset-0 z-10 w-full h-full"
        />
      </div>

      {/* Clean Trigger & Hit Box Intelligence Card */}
      {activeTrigger && (
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono">{activeTrigger.id}</span>
                  <span className="text-xs font-semibold text-neutral-300 font-mono">({activeTrigger.triggerHeadline})</span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Trigger Date: <strong className="text-neutral-200">{activeTrigger.date}</strong> · Signal Price: <strong className="text-white">${activeTrigger.price.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFocusTrigger(activeTrigger)}
                className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 hover:border-emerald-500/50 text-neutral-300 hover:text-emerald-300 text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3 text-emerald-400" />
                <span>Focus Visual Boxes</span>
              </button>

              <span
                className={`text-xs px-3 py-1 rounded font-bold font-mono tracking-wide ${
                  activeTrigger.status === 'CURRENT_READY'
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/20'
                    : activeTrigger.accuracySuccess
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {activeTrigger.status === 'CURRENT_READY'
                  ? '⚡ CURRENT READY TRIGGER'
                  : activeTrigger.accuracySuccess
                  ? '✓ HIT BOX TARGET HIT'
                  : '✕ STOP LOSS HIT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            {/* Box 1: Trigger Signals & Contraction */}
            <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80 space-y-1.5">
              <span className="text-[11px] text-amber-400 font-bold block uppercase tracking-wider">
                1. Contraction &amp; Volume Surge
              </span>
              <div className="flex justify-between">
                <span className="text-neutral-400">Coil Ratio (Compression):</span>
                <span className="text-amber-400 font-bold">{(activeTrigger.coilRatio * 100).toFixed(0)}% Squeeze</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Relative Volume:</span>
                <span className="text-white font-bold">{activeTrigger.rvol.toFixed(1)}x Surge</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Whale Flow Skew:</span>
                <span className="text-emerald-400 font-bold">{activeTrigger.flowSkew}% Bullish</span>
              </div>
            </div>

            {/* Box 2: Hit Box Result */}
            <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80 space-y-1.5">
              <span className="text-[11px] text-emerald-400 font-bold block uppercase tracking-wider">
                2. Hit Box Execution
              </span>
              {activeTrigger.strategy ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Hit Box Outcome:</span>
                    <span
                      className={`font-bold ${
                        activeTrigger.strategy.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeTrigger.strategy.pnlPercent >= 0 ? '+' : ''}
                      {activeTrigger.strategy.pnlPercent.toFixed(1)}% Realized
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Reward / Risk (RRR):</span>
                    <span className="text-white font-bold">{activeTrigger.strategy.rrr}:1 Ratio</span>
                  </div>
                </>
              ) : (
                <div className="text-neutral-500 italic">No historical strategy bracket executed</div>
              )}
            </div>

            {/* Box 3: Maximum Run Up & Drawdown */}
            <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800/80 space-y-1.5">
              <span className="text-[11px] text-purple-400 font-bold block uppercase tracking-wider">
                3. Max Excursion (Run Up)
              </span>
              <div className="flex justify-between">
                <span className="text-neutral-400">Peak Gain (MFE):</span>
                <span className="text-emerald-400 font-bold">+{activeTrigger.maxGainPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Max Adverse Dip (MAE):</span>
                <span className="text-rose-400 font-bold">-{activeTrigger.maxDrawdownPct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 90-Day All Triggers Clickable Timeline Strip */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>All Trigger Events In 90-Day Window (Click to inspect &amp; focus visual boxes):</span>
          <span className="text-neutral-500">Click any card to zoom chart</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {triggers.map((trig) => {
            const isSelected = activeTrigger?.id === trig.id;
            return (
              <button
                key={trig.id}
                onClick={() => handleFocusTrigger(trig)}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-800 border-emerald-500/60 text-white shadow-lg ring-1 ring-emerald-500/30'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{trig.id}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      trig.status === 'CURRENT_READY'
                        ? 'bg-emerald-500 text-neutral-950'
                        : trig.accuracySuccess
                        ? 'text-emerald-400 bg-emerald-950/50'
                        : 'text-rose-400 bg-rose-950/50'
                    }`}
                  >
                    {trig.status === 'CURRENT_READY' ? 'READY' : trig.accuracySuccess ? 'TARGET HIT' : 'STOP HIT'}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  {trig.date} · ${trig.price.toFixed(2)}
                </div>
                {trig.strategy && (
                  <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                    +{trig.strategy.pnlPercent.toFixed(1)}% return · {trig.strategy.rrr}:1 RRR
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
