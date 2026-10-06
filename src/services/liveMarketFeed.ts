import { BarData, RetailTicker } from '../types.ts';

export interface ApiStatus {
  status: string;
  unusualWhalesConnected: boolean;
  massiveConnected: boolean;
  capabilities: {
    darkPoolLevels: boolean;
    optionsSweeps: boolean;
    optionsGreeksChain: boolean;
    polygonAggs: boolean;
    groupedDaily: boolean;
  };
  timestamp: string;
}

export async function checkApiStatus(): Promise<ApiStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) {
      throw new Error(`Status HTTP ${res.status}`);
    }
    return await res.json();
  } catch {
    return {
      status: 'LOCAL_FALLBACK',
      unusualWhalesConnected: false,
      massiveConnected: false,
      capabilities: {
        darkPoolLevels: false,
        optionsSweeps: false,
        optionsGreeksChain: false,
        polygonAggs: false,
        groupedDaily: false,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchLiveDarkPool(ticker?: string, limit = 50) {
  const url = ticker ? `/api/unusualwhales/darkpool/${ticker}?limit=${limit}` : `/api/unusualwhales/darkpool?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchLiveOptionsFlow(ticker: string) {
  const res = await fetch(`/api/unusualwhales/flow/${ticker}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchLiveGreekExposure(ticker: string) {
  const res = await fetch(`/api/unusualwhales/greeks/${ticker}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Fetch 5-minute intraday bars
export async function fetchLiveCandles(ticker: string, multiplier = '5', timespan = 'minute') {
  const res = await fetch(`/api/massive/aggs/${ticker}?multiplier=${multiplier}&timespan=${timespan}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Fetch historical daily bars up to today
export async function fetchLiveDailyAggs(ticker: string, from = '2026-05-01', to = '2026-10-01') {
  const res = await fetch(`/api/massive/aggs/${ticker}?multiplier=1&timespan=day&from=${from}&to=${to}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchLiveOptionsChainSnapshot(ticker: string) {
  const res = await fetch(`/api/massive/options-chain/${ticker}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Fetch multi-ticker universe snapshot
export async function fetchLiveUniverseSnapshot() {
  const res = await fetch('/api/massive/snapshot');
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export function parseTickerSnapshots(data: any): Record<string, { price: number; changePercent: number; volumeRatio: number }> {
  const result: Record<string, { price: number; changePercent: number; volumeRatio: number }> = {};
  if (!data || !Array.isArray(data.tickers)) return result;

  for (const item of data.tickers) {
    const symbol = item.ticker;
    const price = item.lastTrade?.p || item.day?.c || item.prevDay?.c;
    const changePct = item.todaysChangePerc;
    const dayVol = item.day?.v || item.prevDay?.v;
    const avgVol = item.prevDay?.v || dayVol || 1000000;
    const volRatio = avgVol > 0 && dayVol ? Number((dayVol / avgVol).toFixed(2)) : 1.0;

    if (symbol && price) {
      result[symbol] = {
        price: Number(price.toFixed(2)),
        changePercent: changePct !== undefined ? Number(changePct.toFixed(2)) : 0,
        volumeRatio: Math.max(0.5, volRatio),
      };
    }
  }
  return result;
}

// Transform Massive / Polygon v2/aggs intraday results into clean BarData array
export function parseMassiveAggs(data: any): BarData[] {
  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    return [];
  }

  return data.results.map((bar: any) => {
    const d = new Date(bar.t);
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return {
      timestamp: timeStr,
      open: Number(bar.o.toFixed(2)),
      high: Number(bar.h.toFixed(2)),
      low: Number(bar.l.toFixed(2)),
      close: Number(bar.c.toFixed(2)),
      volume: Math.round(bar.v),
    };
  });
}

// Transform Massive / Polygon daily aggregate bars (YYYY-MM-DD timestamps)
export function parseMassiveDailyAggs(data: any): BarData[] {
  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    return [];
  }

  return data.results.map((bar: any) => {
    const d = new Date(bar.t);
    const dateStr = d.toISOString().split('T')[0];

    return {
      timestamp: dateStr,
      open: Number(bar.o.toFixed(2)),
      high: Number(bar.h.toFixed(2)),
      low: Number(bar.l.toFixed(2)),
      close: Number(bar.c.toFixed(2)),
      volume: Math.round(bar.v),
    };
  });
}

// Ingest real-time flow, dark pool levels, and daily/intraday bars
export function mergeLiveMarketData(
  baseTicker: RetailTicker,
  liveBars: BarData[],
  liveDailyBars: BarData[],
  liveFlow: any,
  liveDarkPool: any
): RetailTicker {
  const updated = { ...baseTicker };

  // 1. Update Intraday Bars & Real-Time Price
  if (liveBars && liveBars.length > 0) {
    updated.bars = liveBars;
    const latestBar = liveBars[liveBars.length - 1];
    updated.price = latestBar.close;
    
    // Compute change percent from session open if available
    const firstBar = liveBars[0];
    if (firstBar.open > 0) {
      updated.changePercent = Number(
        (((latestBar.close - firstBar.open) / firstBar.open) * 100).toFixed(2)
      );
    }
  }

  // 2. Update 90-Day Daily Bars from Live Polygon Aggregates
  if (liveDailyBars && liveDailyBars.length > 0) {
    updated.ninetyDayBars = liveDailyBars;
    // Align current trigger state barIndex to last bar
    if (updated.ninetyDayTriggers && updated.ninetyDayTriggers.length > 0) {
      const lastTrigger = updated.ninetyDayTriggers[updated.ninetyDayTriggers.length - 1];
      if (lastTrigger.status === 'CURRENT_READY') {
        lastTrigger.barIndex = liveDailyBars.length - 1;
        lastTrigger.date = liveDailyBars[liveDailyBars.length - 1].timestamp;
      }
    }
  }

  // 3. Ingest Unusual Whales Flow Skew
  if (liveFlow && Array.isArray(liveFlow.data)) {
    const orders = liveFlow.data;
    let callPremium = 0;
    let putPremium = 0;

    for (const ord of orders) {
      const prem = Number(ord.premium || ord.total_premium || 0);
      const type = (ord.type || ord.put_call || '').toUpperCase();
      if (type.includes('CALL')) callPremium += prem;
      else if (type.includes('PUT')) putPremium += prem;
    }

    const total = callPremium + putPremium;
    if (total > 0) {
      updated.whaleFlowBullishPct = Math.round((callPremium / total) * 100);
    }
  }

  // 4. Ingest Unusual Whales Dark Pool Support Bed
  if (liveDarkPool && Array.isArray(liveDarkPool.data)) {
    const prints = liveDarkPool.data;
    let maxVol = 0;
    let bedLevel = updated.darkPoolBed;

    for (const p of prints) {
      const vol = Number(p.size || p.volume || 0);
      if (vol > maxVol && p.price) {
        maxVol = vol;
        bedLevel = Number(Number(p.price).toFixed(2));
      }
    }
    if (bedLevel) {
      updated.darkPoolBed = bedLevel;
    }
  }

  return updated;
}
