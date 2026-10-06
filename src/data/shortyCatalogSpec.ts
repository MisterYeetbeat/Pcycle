export interface ShortyCatalogMeta {
  lastUpdated: string;
  sourcePath: string;
  refreshedFiles: {
    groupedDailyBars: string;
    groupedDailyDates: string;
    siRefreshedSeries: string;
    siRefreshedDates: string;
    siBulkLatest: string;
    floatAllLatest: string;
  };
  totalTickersMonitored: number;
}

export const SHORTY_CATALOG_SPEC: ShortyCatalogMeta = {
  lastUpdated: '2026-09-29 Morning Session',
  sourcePath: 'Codex-Backtest/project_memory/data/shorty/',
  refreshedFiles: {
    groupedDailyBars: 'grouped_daily_2026-08-24_2026-09-29_am.json',
    groupedDailyDates: '2026-08-24 -> 2026-09-29 (26 sessions through today\'s morning bell)',
    siRefreshedSeries: 'si_series_2021-06-15_2026-09-15.json',
    siRefreshedDates: 'Adds 2026-08-31 and 2026-09-15 settlement prints (56,531 rows, 523 tickers)',
    siBulkLatest: 'si_2026-09-15.json (22,593 tickers)',
    floatAllLatest: 'float_all_2026-09-28.json (6,891 tickers)',
  },
  totalTickersMonitored: 523,
};

// Latest prints from si_series_2021-06-15_2026-09-15.json & Polygon bulk (2026-09-15)
export interface RefreshedSIPerTicker {
  symbol: string;
  settlementDate: string;
  shortInterest: number;
  totalFloat: number;
  siFloatPct: number;
  daysToCover: number;
  feeRatePct: number;
  sharesAvailable: number;
  prevPrintSiFloatPct: number; // 2026-08-31 print
  siDirection: 'EXPANDING' | 'COVERING' | 'STABLE';
}

export const LATEST_SHORTY_PRINTS_2026_09: Record<string, RefreshedSIPerTicker> = {
  AAOI: {
    symbol: 'AAOI',
    settlementDate: '2026-09-15',
    shortInterest: 9420000,
    totalFloat: 38250000,
    siFloatPct: 24.63,
    daysToCover: 5.4,
    feeRatePct: 18.4,
    sharesAvailable: 150000,
    prevPrintSiFloatPct: 22.8,
    siDirection: 'EXPANDING', // Bears trapped into the surge!
  },
  PLTR: {
    symbol: 'PLTR',
    settlementDate: '2026-09-15',
    shortInterest: 98500000,
    totalFloat: 2050000000,
    siFloatPct: 4.81,
    daysToCover: 2.1,
    feeRatePct: 0.8,
    sharesAvailable: 8500000,
    prevPrintSiFloatPct: 4.65,
    siDirection: 'EXPANDING',
  },
  NVDA: {
    symbol: 'NVDA',
    settlementDate: '2026-09-15',
    shortInterest: 395000000,
    totalFloat: 24500000000,
    siFloatPct: 1.61,
    daysToCover: 1.1,
    feeRatePct: 0.4,
    sharesAvailable: 25000000,
    prevPrintSiFloatPct: 1.58,
    siDirection: 'STABLE',
  },
  GME: {
    symbol: 'GME',
    settlementDate: '2026-09-15',
    shortInterest: 104200000,
    totalFloat: 350000000,
    siFloatPct: 29.77,
    daysToCover: 5.8,
    feeRatePct: 8.6,
    sharesAvailable: 350000,
    prevPrintSiFloatPct: 28.9,
    siDirection: 'EXPANDING',
  },
  TSLA: {
    symbol: 'TSLA',
    settlementDate: '2026-09-15',
    shortInterest: 97800000,
    totalFloat: 3180000000,
    siFloatPct: 3.08,
    daysToCover: 1.8,
    feeRatePct: 0.6,
    sharesAvailable: 12000000,
    prevPrintSiFloatPct: 3.12,
    siDirection: 'COVERING',
  },
  AMD: {
    symbol: 'AMD',
    settlementDate: '2026-09-15',
    shortInterest: 38900000,
    totalFloat: 1620000000,
    siFloatPct: 2.4,
    daysToCover: 1.3,
    feeRatePct: 0.5,
    sharesAvailable: 9500000,
    prevPrintSiFloatPct: 2.45,
    siDirection: 'STABLE',
  },
};
