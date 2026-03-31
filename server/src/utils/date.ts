/**
 * IST (India Standard Time) date utilities.
 *
 * The frontend sends date strings as YYYY-MM-DD representing the user's local
 * (IST) date.  All date boundaries on the server must therefore be interpreted
 * as IST midnight / end-of-day, and all date displays must reflect IST.
 */

const IST_MS = 5.5 * 60 * 60 * 1000;

/** Return the IST date string (YYYY-MM-DD) for a given JS Date. */
export function toISTDateStr(d: Date): string {
  const ist = new Date(d.getTime() + IST_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Parse a YYYY-MM-DD string as IST midnight (start of day) or IST end-of-day.
 * Returns a UTC Date that corresponds to the IST boundary.
 */
export function parseISTDate(dateStr: string, endOfDay = false): Date {
  return new Date(
    dateStr + (endOfDay ? "T23:59:59.999+05:30" : "T00:00:00.000+05:30")
  );
}
