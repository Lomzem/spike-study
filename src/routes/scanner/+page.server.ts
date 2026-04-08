import { db } from '$lib/server/db';
import { dailyStocksTable } from '$lib/server/db/schema';
import { and, asc, count, desc, gte, lte, type SQL } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const SORT_COLUMNS = {
  date: dailyStocksTable.date,
  symbol: dailyStocksTable.symbol,
  open: dailyStocksTable.open,
  gap: dailyStocksTable.gap,
  range: dailyStocksTable.range,
  change: dailyStocksTable.change,
  volume: dailyStocksTable.volume,
  trades: dailyStocksTable.trades,
} as const;

const SORT_DIRECTIONS = ['asc', 'desc'] as const;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250] as const;
const DEFAULT_SORT_BY: SortBy = 'gap';
const DEFAULT_SORT_DIR: SortDirection = 'desc';
const DEFAULT_PAGE_SIZE = 50;

type SortBy = keyof typeof SORT_COLUMNS;
type SortDirection = (typeof SORT_DIRECTIONS)[number];

function parseOptionalNumber(value: string | null) {
  if (!value) return { raw: '', value: undefined };

  const raw = value.trim();
  if (!raw) return { raw: '', value: undefined };

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return { raw: '', value: undefined };

  return { raw, value: parsed };
}

function parseOptionalInteger(value: string | null) {
  const parsed = parseOptionalNumber(value);
  if (parsed.value == null) return parsed;

  return {
    raw: parsed.raw,
    value: Math.max(0, Math.floor(parsed.value)),
  };
}

function parseOptionalPercent(value: string | null) {
  const parsed = parseOptionalNumber(value);
  if (parsed.value == null) return parsed;

  return {
    raw: parsed.raw,
    value: parsed.value / 100,
  };
}

function parseSortBy(value: string | null): SortBy {
  if (value && value in SORT_COLUMNS) return value as SortBy;
  return DEFAULT_SORT_BY;
}

function parseSortDirection(value: string | null): SortDirection {
  if (value === 'asc' || value === 'desc') return value;
  return DEFAULT_SORT_DIR;
}

function parsePage(value: string | null) {
  const parsed = parseOptionalInteger(value);
  if (parsed.value == null || parsed.value < 1) return 1;
  return parsed.value;
}

function parsePageSize(value: string | null) {
  const parsed = parseOptionalInteger(value);
  if (parsed.value == null) return DEFAULT_PAGE_SIZE;
  if (PAGE_SIZE_OPTIONS.includes(parsed.value as (typeof PAGE_SIZE_OPTIONS)[number])) {
    return parsed.value;
  }

  return DEFAULT_PAGE_SIZE;
}

export const load: PageServerLoad = async ({ url }) => {
  const minDate = url.searchParams.get('minDate')?.trim() || '';
  const maxDate = url.searchParams.get('maxDate')?.trim() || '';
  const minVolume = parseOptionalInteger(url.searchParams.get('minVolume'));
  const minTrades = parseOptionalInteger(url.searchParams.get('minTrades'));
  const minPrice = parseOptionalNumber(url.searchParams.get('minPrice'));
  const maxPrice = parseOptionalNumber(url.searchParams.get('maxPrice'));
  const minGap = parseOptionalPercent(url.searchParams.get('minGap'));
  const maxGap = parseOptionalPercent(url.searchParams.get('maxGap'));
  const minRange = parseOptionalPercent(url.searchParams.get('minRange'));
  const minChange = parseOptionalPercent(url.searchParams.get('minChange'));
  const sortBy = parseSortBy(url.searchParams.get('sortBy'));
  const sortDir = parseSortDirection(url.searchParams.get('sortDir'));
  const requestedPage = parsePage(url.searchParams.get('page'));
  const pageSize = parsePageSize(url.searchParams.get('pageSize'));

  const conditions: Array<SQL> = [];

  if (minDate) conditions.push(gte(dailyStocksTable.date, minDate));
  if (maxDate) conditions.push(lte(dailyStocksTable.date, maxDate));
  if (minVolume.value != null) conditions.push(gte(dailyStocksTable.volume, minVolume.value));
  if (minTrades.value != null) conditions.push(gte(dailyStocksTable.trades, minTrades.value));
  if (minPrice.value != null) conditions.push(gte(dailyStocksTable.open, minPrice.value));
  if (maxPrice.value != null) conditions.push(lte(dailyStocksTable.open, maxPrice.value));
  if (minGap.value != null) conditions.push(gte(dailyStocksTable.gap, minGap.value));
  if (maxGap.value != null) conditions.push(lte(dailyStocksTable.gap, maxGap.value));
  if (minRange.value != null) conditions.push(gte(dailyStocksTable.range, minRange.value));
  if (minChange.value != null) conditions.push(gte(dailyStocksTable.change, minChange.value));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(dailyStocksTable)
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const sortColumn = SORT_COLUMNS[sortBy];
  const primaryOrder = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);
  const orderByClauses = [primaryOrder];

  if (sortBy !== 'date') orderByClauses.push(desc(dailyStocksTable.date));
  if (sortBy !== 'symbol') orderByClauses.push(asc(dailyStocksTable.symbol));

  const results = await db
    .select()
    .from(dailyStocksTable)
    .where(whereClause)
    .orderBy(...orderByClauses)
    .limit(pageSize)
    .offset(offset);

  return {
    results,
    totalCount,
    page,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    totalPages,
    sort: {
      by: sortBy,
      dir: sortDir,
      options: Object.keys(SORT_COLUMNS),
      directions: SORT_DIRECTIONS,
    },
    filters: {
      minDate,
      maxDate,
      minVolume: minVolume.raw,
      minTrades: minTrades.raw,
      minPrice: minPrice.raw,
      maxPrice: maxPrice.raw,
      minGap: minGap.raw,
      maxGap: maxGap.raw,
      minRange: minRange.raw,
      minChange: minChange.raw,
    },
  };
};
