export type SignalType = 'STRONG_BUY' | 'TAKE_PROFIT' | 'ACCUMULATING' | 'NEUTRAL' | 'AVOID';
export type TradingStyle = 'SQUEEZE_HUNTER' | 'SWING_TRADER' | 'DAY_SCALPER';

export enum CyclePhase {
  ACCUMULATION = 'ACCUMULATION',
  UPTICK_START = 'UPTICK_START',
  MARKUP = 'MARKUP',
  CYCLE_HIGH_END = 'CYCLE_HIGH_END',
  NEUTRAL = 'NEUTRAL',
}

export interface CycleState {
  ticker: string;
  phase: CyclePhase;
  entry_price: number | null;
  invalidation_level: number | null;
  cycle_target: number | null;
  real_rrr: number;
  evidence: string[];
}

export interface BarData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FlowAndGex {
  call_wall: number | null;
  dp_levels: number[];
  call_ask_premium: number;
  net_delta_skew: number;
}

export interface ShortyEvent {
  date: string;
  t: string;
  close: number;
  relvol: number;
  options_status?: string;
  fwd?: number[];
  base_type?: boolean;
  coil_on?: boolean;
  coil_ratio?: number;
}

export interface ShortInterestRecord {
  symbol: string;
  market_date: string;
  short_interest: number;
  short_shares_available: number;
  total_float: number;
  si_float: number;
  days_to_cover: number;
  fee_rate: string;
}

export interface StrategyBracket {
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  exitPrice: number;
  exitBarIndex: number;
  exitDate: string;
  pnlPercent: number;
  rrr: number;
  status: 'TARGET_HIT' | 'STOP_HIT' | 'RUNNING';
}

export interface TriggerEvent {
  id: string;
  barIndex: number;
  date: string;
  price: number;
  rvol: number;
  flowSkew: number;
  coilRatio: number;
  status: 'CURRENT_READY' | 'HISTORICAL_FIRED' | 'COIL_PREPARING';
  triggerType: 'BOS_BREAKOUT' | 'SQUEEZE_IGNITION' | 'WHALE_BED_RETEST';
  triggerHeadline: string;
  accuracySuccess: boolean; // Reached target before stop
  maxGainPct: number; // MFE (Maximum Favorable Excursion)
  maxDrawdownPct: number; // MAE (Maximum Adverse Excursion)
  strategy?: StrategyBracket;
}

export interface TradePlan {
  signal: SignalType;
  signalTitle: string;
  badgeText: string;
  actionSummary: string;
  direction: 'LONG' | 'SHORT' | 'EXIT' | 'FLAT';
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  rrr: number;
  riskPercent: number;
  rewardPercent: number;
  confidenceScore: number;
  whaleSupportLevel: number | null;
  resistanceCeiling: number | null;
  reasons: string[];
}

export interface RetailTicker {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volumeRatio: number;
  signal: SignalType;
  setupGrade: 'A+' | 'A' | 'B' | 'WATCH';
  rrr: number;
  shortInterestPct?: number;
  daysToCover?: number;
  whaleFlowBullishPct: number;
  bars: BarData[];
  callWall: number | null;
  darkPoolBed: number | null;
  // 90-day indicator and strategy fields:
  ninetyDayBars: BarData[];
  ninetyDayTriggers: TriggerEvent[];
  triggerAccuracyRate: number; // e.g. 85.7%
  currentTriggerState: 'READY_NOW' | 'COILING' | 'NEUTRAL';
}

export interface BacktestTrade {
  id: string;
  date: string;
  ticker: string;
  setupType: 'Uptick Inception' | 'Short Squeeze' | 'Whale Bed Breakout' | 'Volume Coil Surge';
  rvol: number;
  flowSkew: number;
  hasDarkPoolBed: boolean;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  targetPrice: number;
  holdDays: number;
  returnPct: number;
  pnlDollar: number;
  result: 'WIN' | 'LOSS';
  exitReason: 'Target 1 Hit' | 'Target 2 Runner Hit' | 'Stop Loss Hit' | 'Climax Exhaustion Exit';
}

export interface BacktestSummary {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnlDollar: number;
  totalPnlPct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  avgWinPct: number;
  avgLossPct: number;
  realizedRrr: number;
  sharpeRatio: number;
}
