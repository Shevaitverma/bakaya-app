/**
 * IST calendar helpers. The server interprets startDate/endDate query params
 * as IST (+05:30) day boundaries, so all preset ranges must be computed from
 * the current date in Asia/Kolkata, not the device-local clock.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in IST as YYYY-MM-DD. */
export function istToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    new Date(),
  );
}

/** Today's IST calendar parts (m is 1-12). */
export function istTodayParts(): { y: number; m: number; d: number } {
  const [y, m, d] = istToday().split('-').map(Number);
  return { y: y!, m: m!, d: d! };
}

/** First day (YYYY-MM-DD) of the month `monthsAgo` months before the current IST month. */
export function istMonthStart(monthsAgo = 0): string {
  const { y, m } = istTodayParts();
  const dt = new Date(Date.UTC(y, m - 1 - monthsAgo, 1));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-01`;
}

/** Last day (YYYY-MM-DD) of the month `monthsAgo` months before the current IST month. */
export function istMonthEnd(monthsAgo = 0): string {
  const { y, m } = istTodayParts();
  const dt = new Date(Date.UTC(y, m - monthsAgo, 0));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
