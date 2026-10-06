# Market Cycle Engine & Indicator Suite

## 1. Wyckoff State Machine & Strategy Architecture
1. **Phase 1: Inception & Ignition (STRONG BUY)**
   - Volatility Contraction: 12-bar Base ATR <= 85% of 20-period Moving Average ATR.
   - Break of Structure (BOS): Bar close exceeds 12-bar base high.
   - Volume Surge: Relative Volume (RVOL) >= 1.75x.
   - Dark Pool Support Bed: Price touches institutional liquidity cluster within 1.5%.
   - Call Sweep Skew: Bullish institutional call sweep skew >= 1.8x.

2. **Phase 2: Active Mark-Up & Trend Extension**
   - Higher highs and higher lows maintained.
   - Fibonacci Expansion: Primary profit target set to 1.618 of Base Range.
   - Dynamic trailing stop anchored at 9-EMA and Base High.

3. **Phase 3: Climax & Exhaustion (EXIT)**
   - Call Wall Resistance: Price reaches top institutional gamma wall.
   - Candle Wick Rejection: Upper shadow >= 45% of total bar range.
   - Whale Flow Divergence: Smart money call/put skew falls below 0.80.

4. **Phase 4: Reset & Mean Reversion**
   - Pullback to Dark Pool Bed / 50-EMA support.
