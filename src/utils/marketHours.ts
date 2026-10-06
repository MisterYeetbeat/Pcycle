// Utility to check US Stock Market Regular Trading Hours (RTH)
// RTH: Monday - Friday, 9:30 AM - 4:00 PM US Eastern Time (ET)

export type MarketSession = 'RTH_OPEN' | 'PRE_MARKET' | 'AFTER_HOURS' | 'WEEKEND_CLOSED' | 'CLOSED';

export interface MarketStatusInfo {
  isRTH: boolean;
  session: MarketSession;
  label: string;
  subLabel: string;
  nyTimeStr: string;
}

/**
 * Returns current date/time converted to America/New_York
 */
export function getNewYorkDateTime(date = new Date()): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  hour: number;
  minute: number;
  second: number;
  formattedTime: string;
} {
  const nyString = date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  // Extract components using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'narrow',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  let year = 2026;
  let month = 10;
  let day = 1;
  let hour = 10;
  let minute = 0;
  let second = 0;

  for (const p of parts) {
    if (p.type === 'year') year = parseInt(p.value, 10);
    if (p.type === 'month') month = parseInt(p.value, 10);
    if (p.type === 'day') day = parseInt(p.value, 10);
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
    if (p.type === 'second') second = parseInt(p.value, 10);
  }

  // Calculate day of week in NY
  const nyDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dayOfWeek = nyDate.getDay();

  const formattedTime = `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')} ET`;

  return { year, month, day, dayOfWeek, hour, minute, second, formattedTime };
}

/**
 * Checks if the US equity market is currently in Regular Trading Hours (RTH: 9:30 AM - 4:00 PM ET Mon-Fri)
 */
export function isMarketRTH(date = new Date()): boolean {
  const { dayOfWeek, hour, minute } = getNewYorkDateTime(date);

  // Weekends: Saturday (6) or Sunday (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const minutesFromMidnight = hour * 60 + minute;
  const rthOpenMinutes = 9 * 60 + 30; // 9:30 AM ET = 570 min
  const rthCloseMinutes = 16 * 60; // 4:00 PM ET = 960 min

  return minutesFromMidnight >= rthOpenMinutes && minutesFromMidnight < rthCloseMinutes;
}

/**
 * Returns comprehensive status information about the current market session
 */
export function getMarketStatus(date = new Date()): MarketStatusInfo {
  const { dayOfWeek, hour, minute, formattedTime } = getNewYorkDateTime(date);
  const minutesFromMidnight = hour * 60 + minute;

  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isRTH: false,
      session: 'WEEKEND_CLOSED',
      label: 'Market Closed (Weekend)',
      subLabel: 'RTH opens Monday 9:30 AM ET · Live polling paused',
      nyTimeStr: formattedTime,
    };
  }

  const rthOpenMinutes = 9 * 60 + 30; // 9:30 AM
  const rthCloseMinutes = 16 * 60; // 4:00 PM
  const preMarketOpen = 4 * 60; // 4:00 AM
  const afterHoursClose = 20 * 60; // 8:00 PM

  if (minutesFromMidnight >= rthOpenMinutes && minutesFromMidnight < rthCloseMinutes) {
    return {
      isRTH: true,
      session: 'RTH_OPEN',
      label: 'Market Open (RTH)',
      subLabel: 'Regular Trading Hours (9:30 AM - 4:00 PM ET) · Live feeds active',
      nyTimeStr: formattedTime,
    };
  }

  if (minutesFromMidnight >= preMarketOpen && minutesFromMidnight < rthOpenMinutes) {
    return {
      isRTH: false,
      session: 'PRE_MARKET',
      label: 'Pre-Market (Closed)',
      subLabel: 'RTH opens at 9:30 AM ET · Updates active only during RTH',
      nyTimeStr: formattedTime,
    };
  }

  if (minutesFromMidnight >= rthCloseMinutes && minutesFromMidnight < afterHoursClose) {
    return {
      isRTH: false,
      session: 'AFTER_HOURS',
      label: 'After-Hours (Closed)',
      subLabel: 'RTH ended at 4:00 PM ET · Live updates paused until next RTH',
      nyTimeStr: formattedTime,
    };
  }

  return {
    isRTH: false,
    session: 'CLOSED',
    label: 'Market Closed',
    subLabel: 'Regular Hours: Mon-Fri 9:30 AM - 4:00 PM ET · Polling suspended',
    nyTimeStr: formattedTime,
  };
}
