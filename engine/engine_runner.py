"""
Market Cycle Engine - Cloud & Local Pipeline Runner
"""
import json
import pandas as pd
from marketCycleEngine import MarketCycleEngine

def run_local_backtest():
    print("[*] Running local Market Cycle Engine...")
    engine = MarketCycleEngine()
    df_trades = pd.read_csv("data/backtest_trades.csv")
    print(f"[+] Total Trades in History: {len(df_trades)}")
    win_rate = (df_trades['Result'] == 'WIN').mean() * 100
    print(f"[+] Win Rate: {win_rate:.1f}%")

if __name__ == '__main__':
    run_local_backtest()
