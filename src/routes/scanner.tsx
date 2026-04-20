import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  lte,
} from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import db from '~/market-data/db'
import { dailyStocksTable } from '~/market-data/schema'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { DatePicker } from '~/components/ui/date-picker'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

const SORTABLE_COLUMNS = [
  'symbol',
  'date',
  'open',
  'close',
  'volume',
  'gap',
  'change',
] as const
type SortableColumn = (typeof SORTABLE_COLUMNS)[number]
type SortDir = 'asc' | 'desc'

const ALL_COLUMNS = getTableColumns(dailyStocksTable)
const COLUMN_MAP = {
  symbol: ALL_COLUMNS.symbol,
  date: ALL_COLUMNS.date,
  open: ALL_COLUMNS.open,
  close: ALL_COLUMNS.close,
  volume: ALL_COLUMNS.volume,
  gap: ALL_COLUMNS.gap,
  change: ALL_COLUMNS.change,
} satisfies Record<SortableColumn, unknown>

interface ScannerSearch {
  startDate?: string
  endDate?: string
  minVolume?: number
  minOpen?: number
  maxOpen?: number
  minGap?: number
  page?: number
  pageSize?: number
  sortBy?: SortableColumn
  sortDir?: SortDir
}

interface ScannerInput extends ScannerSearch {
  page: number
  pageSize: number
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value === '' || value == null) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function toPositiveInteger(value: unknown): number | undefined {
  const n = toFiniteNumber(value)
  return n != null && Number.isInteger(n) && n >= 1 ? n : undefined
}

function buildConditions(data: ScannerSearch): Array<SQL> {
  const conditions: Array<SQL> = [eq(dailyStocksTable.hasIntraday, true)]
  if (data.startDate)
    conditions.push(gte(dailyStocksTable.date, data.startDate))
  if (data.endDate) conditions.push(lte(dailyStocksTable.date, data.endDate))
  if (data.minVolume != null)
    conditions.push(gte(dailyStocksTable.volume, data.minVolume))
  if (data.minOpen != null)
    conditions.push(gte(dailyStocksTable.open, data.minOpen))
  if (data.maxOpen != null)
    conditions.push(lte(dailyStocksTable.open, data.maxOpen))
  if (data.minGap != null)
    conditions.push(gte(dailyStocksTable.gap, data.minGap / 100))
  return conditions
}

const scanStocks = createServerFn()
  .inputValidator((data: ScannerInput) => data)
  .handler(async ({ data }) => {
    const page = Number.isInteger(data.page) && data.page >= 1 ? data.page : 1
    const pageSize = PAGE_SIZE_OPTIONS.includes(
      data.pageSize as (typeof PAGE_SIZE_OPTIONS)[number],
    )
      ? data.pageSize
      : 25
    const conditions = buildConditions(data)
    const where = and(...conditions)

    let query = db
      .select()
      .from(dailyStocksTable)
      .where(where)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .$dynamic()

    if (data.sortBy) {
      const col = COLUMN_MAP[data.sortBy]
      query = query.orderBy(data.sortDir === 'desc' ? desc(col) : asc(col))
    }

    const [rows, [{ total }]] = await Promise.all([
      query,
      db.select({ total: count() }).from(dailyStocksTable).where(where),
    ])

    return { rows, totalCount: total }
  })

export const Route = createFileRoute('/scanner')({
  validateSearch: (search: Record<string, unknown>): ScannerSearch => ({
    startDate:
      typeof search.startDate === 'string' ? search.startDate : undefined,
    endDate: typeof search.endDate === 'string' ? search.endDate : undefined,
    minVolume: toFiniteNumber(search.minVolume),
    minOpen: toFiniteNumber(search.minOpen),
    maxOpen: toFiniteNumber(search.maxOpen),
    minGap: toFiniteNumber(search.minGap),
    page: toPositiveInteger(search.page),
    pageSize: PAGE_SIZE_OPTIONS.includes(
      toPositiveInteger(search.pageSize) as (typeof PAGE_SIZE_OPTIONS)[number],
    )
      ? toPositiveInteger(search.pageSize)
      : undefined,
    sortBy: SORTABLE_COLUMNS.includes(search.sortBy as SortableColumn)
      ? (search.sortBy as SortableColumn)
      : undefined,
    sortDir:
      search.sortDir === 'asc' || search.sortDir === 'desc'
        ? search.sortDir
        : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const page = deps.page ?? 1
    const pageSize = deps.pageSize ?? 25
    return scanStocks({ data: { ...deps, page, pageSize } })
  },
  component: ScannerPage,
})

function formatVolume(v: number): string {
  return v.toLocaleString()
}

function formatPrice(p: number): string {
  return p.toFixed(2)
}

function formatPercent(p: number | null): string {
  if (p == null) return '-'
  return `${(p * 100).toFixed(2)}%`
}

function SortableHeader({
  col,
  label,
  align,
  sortBy,
  sortDir,
  onSort,
}: {
  col: SortableColumn
  label: string
  align: 'left' | 'right'
  sortBy?: SortableColumn
  sortDir?: SortDir
  onSort: (col: SortableColumn) => void
}) {
  const isActive = sortBy === col
  const arrow = isActive ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''
  const ariaSort = isActive
    ? sortDir === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  return (
    <th
      aria-sort={ariaSort}
      className={cn(
        'px-3 py-2',
        align === 'left' ? 'text-left' : 'text-right',
        isActive && 'text-primary',
      )}
    >
      <button
        type="button"
        className={cn(
          'cursor-pointer select-none hover:text-primary w-full',
          align === 'left' ? 'text-left' : 'text-right',
        )}
        onClick={() => onSort(col)}
      >
        {label}
        {arrow}
      </button>
    </th>
  )
}

function ScannerPage() {
  const navigate = useNavigate({ from: '/scanner' })
  const search = Route.useSearch()
  const { rows, totalCount } = Route.useLoaderData()

  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 25
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const [filters, setFilters] = useState({
    startDate: search.startDate ?? '',
    endDate: search.endDate ?? '',
    minVolume: search.minVolume?.toString() ?? '',
    minOpen: search.minOpen?.toString() ?? '',
    maxOpen: search.maxOpen?.toString() ?? '',
    minGap: search.minGap?.toString() ?? '',
  })

  useEffect(() => {
    setFilters({
      startDate: search.startDate ?? '',
      endDate: search.endDate ?? '',
      minVolume: search.minVolume?.toString() ?? '',
      minOpen: search.minOpen?.toString() ?? '',
      maxOpen: search.maxOpen?.toString() ?? '',
      minGap: search.minGap?.toString() ?? '',
    })
  }, [
    search.endDate,
    search.maxOpen,
    search.minGap,
    search.minOpen,
    search.minVolume,
    search.startDate,
  ])

  const handleScan = () => {
    navigate({
      search: {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        minVolume: toFiniteNumber(filters.minVolume),
        minOpen: toFiniteNumber(filters.minOpen),
        maxOpen: toFiniteNumber(filters.maxOpen),
        minGap: toFiniteNumber(filters.minGap),
        sortBy: search.sortBy,
        sortDir: search.sortDir,
        page: 1,
        pageSize,
      },
    })
  }

  const goToPage = (newPage: number) => {
    navigate({
      search: {
        ...search,
        page: newPage,
      },
    })
  }

  const handleSort = (col: SortableColumn) => {
    const nextDir =
      search.sortBy === col && search.sortDir === 'asc' ? 'desc' : 'asc'
    navigate({
      search: {
        ...search,
        sortBy: col,
        sortDir: nextDir,
        page: 1,
      },
    })
  }

  const changePageSize = (newSize: number) => {
    navigate({
      search: {
        ...search,
        pageSize: newSize,
        page: 1,
      },
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <section className="flex flex-wrap gap-4 items-end py-2 px-4 border-b shrink-0 bg-bg border-border">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="scanner-start-date"
            className="font-mono text-xs tracking-wider uppercase"
          >
            Start Date
          </label>
          <DatePicker
            id="scanner-start-date"
            date={filters.startDate}
            onSelect={(d) => setFilters((f) => ({ ...f, startDate: d }))}
            onClear={() => setFilters((f) => ({ ...f, startDate: '' }))}
            className="py-0.5 px-2 w-36 rounded-md border-border bg-surface cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="scanner-end-date"
            className="font-mono text-xs tracking-wider uppercase"
          >
            End Date
          </label>
          <DatePicker
            id="scanner-end-date"
            date={filters.endDate}
            onSelect={(d) => setFilters((f) => ({ ...f, endDate: d }))}
            onClear={() => setFilters((f) => ({ ...f, endDate: '' }))}
            className="py-0.5 px-2 w-36 rounded-md border-border bg-surface cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="scanner-min-volume"
            className="font-mono text-xs tracking-wider uppercase"
          >
            Min Volume
          </label>
          <div className="flex items-center gap-1">
            <Input
              id="scanner-min-volume"
              type="number"
              value={filters.minVolume}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minVolume: e.target.value }))
              }
              className="py-0.5 px-2 w-28 font-mono text-sm rounded-md border-border bg-surface"
              placeholder="Any"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setFilters((f) => ({ ...f, minVolume: '' }))}
              className={cn(
                'text-fg-muted hover:text-fg shrink-0',
                !filters.minVolume && 'invisible',
              )}
              aria-label="Clear min volume"
            >
              &times;
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="scanner-min-open"
            className="font-mono text-xs tracking-wider uppercase"
          >
            Min Open
          </label>
          <div className="flex items-center gap-1">
            <Input
              id="scanner-min-open"
              type="number"
              step="0.01"
              value={filters.minOpen}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minOpen: e.target.value }))
              }
              className="py-0.5 px-2 w-24 font-mono text-sm rounded-md border-border bg-surface"
              placeholder="Any"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setFilters((f) => ({ ...f, minOpen: '' }))}
              className={cn(
                'text-fg-muted hover:text-fg shrink-0',
                !filters.minOpen && 'invisible',
              )}
              aria-label="Clear min open"
            >
              &times;
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="scanner-max-open"
            className="font-mono text-xs tracking-wider uppercase"
          >
            Max Open
          </label>
          <div className="flex items-center gap-1">
            <Input
              id="scanner-max-open"
              type="number"
              step="0.01"
              value={filters.maxOpen}
              onChange={(e) =>
                setFilters((f) => ({ ...f, maxOpen: e.target.value }))
              }
              className="py-0.5 px-2 w-24 font-mono text-sm rounded-md border-border bg-surface"
              placeholder="Any"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setFilters((f) => ({ ...f, maxOpen: '' }))}
              className={cn(
                'text-fg-muted hover:text-fg shrink-0',
                !filters.maxOpen && 'invisible',
              )}
              aria-label="Clear max open"
            >
              &times;
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="scanner-min-gap"
            className="font-mono text-xs tracking-wider uppercase"
          >
            Min Gap %
          </label>
          <div className="flex items-center gap-1">
            <Input
              id="scanner-min-gap"
              type="number"
              step="0.01"
              value={filters.minGap}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minGap: e.target.value }))
              }
              className="py-0.5 px-2 w-24 font-mono text-sm rounded-md border-border bg-surface"
              placeholder="Any"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setFilters((f) => ({ ...f, minGap: '' }))}
              className={cn(
                'text-fg-muted hover:text-fg shrink-0',
                !filters.minGap && 'invisible',
              )}
              aria-label="Clear min gap"
            >
              &times;
            </Button>
          </div>
        </div>

        <Button onClick={handleScan} className="shrink-0 cursor-pointer">
          Scan
        </Button>
      </section>

      {/* Results */}
      <div className="flex-1 min-h-0 overflow-auto">
        {rows.length === 0 ? (
          <div className="flex justify-center items-center h-full font-mono text-sm text-fg-muted">
            {totalCount === 0
              ? 'No results found'
              : page > totalPages
                ? 'No results on this page'
                : 'Enter filters and click Scan'}
          </div>
        ) : (
          <table className="w-full font-mono text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface text-xs tracking-wider uppercase">
                <SortableHeader
                  col="symbol"
                  label="Symbol"
                  align="left"
                  sortBy={search.sortBy}
                  sortDir={search.sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  col="date"
                  label="Date"
                  align="left"
                  sortBy={search.sortBy}
                  sortDir={search.sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  col="open"
                  label="Open"
                  align="right"
                  sortBy={search.sortBy}
                  sortDir={search.sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  col="close"
                  label="Close"
                  align="right"
                  sortBy={search.sortBy}
                  sortDir={search.sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  col="volume"
                  label="Volume"
                  align="right"
                  sortBy={search.sortBy}
                  sortDir={search.sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  col="gap"
                  label="Gap"
                  align="right"
                  sortBy={search.sortBy}
                  sortDir={search.sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  col="change"
                  label="Change"
                  align="right"
                  sortBy={search.sortBy}
                  sortDir={search.sortDir}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.date}-${row.symbol}`}
                  className="border-b border-border hover:bg-surface/50"
                >
                  <td className="px-3 py-2">
                    <Link
                      to="/chart/$symbol/$date"
                      params={{ symbol: row.symbol, date: row.date }}
                      className="text-primary hover:underline"
                    >
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2 text-right">
                    {formatPrice(row.open)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatPrice(row.close)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatVolume(row.volume)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatPercent(row.gap)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatPercent(row.change)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <section className="flex gap-4 items-center justify-between py-2 px-4 border-t shrink-0 bg-bg border-border font-mono text-sm">
          <div className="flex gap-2 items-center">
            <span className="text-xs tracking-wider uppercase">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="py-0.5 px-1 rounded-md border border-border bg-surface font-mono text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Prev
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>

          <span className="text-fg-muted text-xs">
            {totalCount} total result{totalCount !== 1 ? 's' : ''}
          </span>
        </section>
      )}
    </div>
  )
}
