/**
 * Internal type used by toolkit/ts-sdk.
 */
type ISODate = `${number}-${number}-${number}`;

function coerceDate(value: unknown): Date | null {
  if (value instanceof Date) return isNaN(+value) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(+d) ? null : d;
  }
  return null;
}

function startOfDay(date: Date, tz: 'utc' | 'local'): Date {
  return tz === 'utc'
    ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    : new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function dayKeyFromDate(date: Date, tz: 'utc' | 'local'): ISODate {
  if (tz === 'utc') {
    return date.toISOString().slice(0, 10) as ISODate;
  }

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}` as ISODate;
}

/**
 * Collection of entities that share the same calendar-day key.
 *
 * `key` is always formatted as `YYYY-MM-DD`; `date` is the representative day
 * value after optional start-of-day normalization has been applied.
 */
export interface DayBucket<T> {
  key: ISODate;
  date: Date;
  items: T[];
}

/**
 * Controls how `groupByDateKey` coerces, normalizes, and sorts bucket keys.
 */
export interface GroupByDateOptions {
  /** Normalize each item to start-of-day; default true */
  normalize?: boolean;
  /** Which clock to use for normalization; default 'local' */
  tz?: 'utc' | 'local';
  /** Sort order of returned buckets; default 'desc' */
  sort?: 'asc' | 'desc';
}

/**
 * Group entities by a date field.
 * - Safely coerces T[K] (Date|string|number) -> Date
 * - Optional start-of-day normalization (local or UTC)
 * - Returns iterable buckets sorted by day
 */
export function groupByDateKey<T>(items: T[], dateKey: keyof T, opts: GroupByDateOptions = {}): DayBucket<T>[] {
  const { normalize = true, tz = 'local', sort = 'desc' } = opts;

  const map: Record<ISODate, DayBucket<T>> = {};
  for (const item of items ?? []) {
    const raw = (item as Record<string, unknown>)[dateKey as string];
    const date = coerceDate(raw);
    if (!date) continue;

    const day = normalize ? startOfDay(date, tz) : date;
    const key = dayKeyFromDate(day, tz);

    (map[key] ??= { key, date: day, items: [] }).items.push(item);
  }

  const buckets = Object.values(map);
  buckets.sort((a, b) => (sort === 'asc' ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime()));
  return buckets;
}
