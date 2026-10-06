"""
MarketCycleEngine Python Quantitative Implementation
Wyckoff Phase Detection, Volatility Contraction, Dark Pool & Gamma Wall Engine
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any

class MarketCycleEngine:
    """
    AlphaPulse Market Cycle State Machine & Quantitative Indicator Engine.
    Detects 4 Core Phases:
      1. INCEPTION (Wyckoff Spring / Volatility Compression Breakout)
      2. MARK_UP (Trend Continuation & Fibonacci 1.618 Acceleration)
      3. DISTRIBUTION / EXHAUSTION (Call Wall Resistance / Upper Wick Rejections)
      4. RESET / MARK_DOWN (Mean Reversion to Dark Pool Bed)
    """
    def __init__(self, atr_period: int = 14, compression_threshold: float = 0.85):
        self.atr_period = atr_period
        self.compression_threshold = compression_threshold

    @staticmethod
    def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculates Average True Range over period."""
        high = df['high']
        low = df['low']
        close = df['close'].shift(1)
        tr = pd.concat([high - low, (high - close).abs(), (low - close).abs()], axis=1).max(axis=1)
        return tr.rolling(window=period, min_periods=1).mean()

    @staticmethod
    def calculate_rvol(df: pd.DataFrame, window: int = 20) -> pd.Series:
        """Calculates Relative Volume (RVOL) compared to 20-period moving average."""
        return df['volume'] / (df['volume'].rolling(window=window, min_periods=1).mean() + 1e-6)

    def evaluate_cycle_state(self, df: pd.DataFrame, dark_pool_bed: Optional[float] = None, call_wall: Optional[float] = None, flow_skew: float = 1.0) -> Dict[str, Any]:
        """
        Evaluates current cycle state, breakout confirmation, Fibonacci targets, and exhaustion risk.
        """
        if len(df) < 15:
            return {'state': 'INSUFFICIENT_DATA', 'signal': 'NEUTRAL'}

        atr_series = self.calculate_atr(df, self.atr_period)
        rvol_series = self.calculate_rvol(df)
        
        current_close = df['close'].iloc[-1]
        current_high = df['high'].iloc[-1]
        current_low = df['low'].iloc[-1]
        current_open = df['open'].iloc[-1]
        current_rvol = rvol_series.iloc[-1]
        current_atr = atr_series.iloc[-1]
        avg_atr = atr_series.iloc[-20:].mean() if len(atr_series) >= 20 else current_atr

        base_df = df.iloc[-12:-1] if len(df) >= 13 else df.iloc[:-1]
        base_high = base_df['high'].max()
        base_low = base_df['low'].min()
        base_atr = atr_series.iloc[-12:-1].mean() if len(df) >= 13 else current_atr

        is_contracted = (base_atr / avg_atr) <= self.compression_threshold if avg_atr > 0 else False
        is_breakout = (current_close > base_high) and (current_rvol >= 1.75)
        has_dp_bed = False
        if dark_pool_bed is not None:
            has_dp_bed = abs(base_low - dark_pool_bed) / dark_pool_bed <= 0.015

        base_range = max(base_high - base_low, current_atr)
        fib_1618 = base_high + (base_range * 1.618)
        target = min(fib_1618, call_wall) if call_wall and call_wall > current_close else fib_1618

        candle_range = max(current_high - current_low, 0.01)
        upper_wick = max(current_high - max(current_open, current_close), 0)
        wick_ratio = upper_wick / candle_range

        exhaustion_signals = []
        if wick_ratio >= 0.45:
            exhaustion_signals.append('UPPER_WICK_REJECTION')
        if call_wall and (current_high >= call_wall * 0.995):
            exhaustion_signals.append('CALL_WALL_TOUCH')
        if flow_skew < 0.8:
            exhaustion_signals.append('BEARISH_FLOW_DIVERGENCE')

        if is_breakout and (is_contracted or has_dp_bed or flow_skew >= 1.8):
            state = 'IGNITION_BUY'
            phase = 'Mark-Up Ignition'
        elif current_close > base_high and not exhaustion_signals:
            state = 'RIDING_TREND'
            phase = 'Active Mark-Up'
        elif len(exhaustion_signals) >= 2:
            state = 'CLIMAX_EXIT'
            phase = 'Distribution / Climax'
        else:
            state = 'CONSOLIDATION'
            phase = 'Accumulation / Base'

        return {
            'state': state,
            'phase': phase,
            'current_close': round(current_close, 2),
            'base_high': round(base_high, 2),
            'base_low': round(base_low, 2),
            'rvol': round(current_rvol, 2),
            'target_1618': round(target, 2),
            'call_wall': call_wall,
            'dark_pool_bed': dark_pool_bed,
            'exhaustion_signals': exhaustion_signals
        }
