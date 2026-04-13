import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { and, count, eq, gte, lte } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import db from '~/market-data/db'
import { dailyStocksTable } from '~/market-data/schema'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { DatePicker } from '~/components/ui/date-picker'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

interface ScannerSearch {
  startDate?: string
  endDate?: string
  minVolume?: number
  minOpen?: number
  maxOpen?: number
  minGap?: number
  page?: number
  pageSize?: number
}

interface ScannerInput extends ScannerSearch {
  page: number
  pageSize: number
}

function buildConditions(data: ScannerSearch): SQL[] {
  const conditions: SQL[] = [eq(dailyStocksTable.hasIntraday, true)]
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
    const conditions = buildConditions(data)
    const where = and(...conditions)

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(dailyStocksTable)
        .where(where)
        .limit(data.pageSize)
        .offset((data.page - 1) * data.pageSize),
      db
        .select({ total: count() })
        .from(dailyStocksTable)
        .where(where),
    ])

    return { rows, totalCount: total }
  })

export const Route = createFileRoute('/scanner')({
  validateSearch: (search: Record<string, unknown>): ScannerSearch => ({
    startDate:
      typeof search.startDate === 'string' ? search.startDate : undefined,
    endDate: typeof search.endDate === 'string' ? search.endDate : undefined,
    minVolume: Number(search.minVolume) || undefined,
    minOpen: Number(search.minOpen) || undefined,
    maxOpen: Number(search.maxOpen) || undefined,
    minGap: Number(search.minGap) || undefined,
    page: Number(search.page) || undefined,
    pageSize: PAGE_SIZE_OPTIONS.includes(Number(search.pageSize) as any)
      ? Number(search.pageSize)
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

  const handleScan = () => {
    navigate({
      search: {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        minVolume: Number(filters.minVolume) || undefined,
        minOpen: Number(filters.minOpen) || undefined,
        maxOpen: Number(filters.maxOpen) || undefined,
        minGap: Number(filters.minGap) || undefined,
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
          <label className="font-mono text-xs tracking-wider uppercase">
            Start Date
          </label>
          <DatePicker
            date={filters.startDate}
            onSelect={(d) => setFilters((f) => ({ ...f, startDate: d }))}
            onClear={() => setFilters((f) => ({ ...f, startDate: '' }))}
            className="py-0.5 px-2 w-36 rounded-md border-border bg-surface cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs tracking-wider uppercase">
            End Date
          </label>
          <DatePicker
            date={filters.endDate}
            onSelect={(d) => setFilters((f) => ({ ...f, endDate: d }))}
            onClear={() => setFilters((f) => ({ ...f, endDate: '' }))}
            className="py-0.5 px-2 w-36 rounded-md border-border bg-surface cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs tracking-wider uppercase">
            Min Volume
          </label>
          <div className="flex items-center gap-1">
            <Input
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
          <label className="font-mono text-xs tracking-wider uppercase">
            Min Open
          </label>
          <div className="flex items-center gap-1">
            <Input
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
          <label className="font-mono text-xs tracking-wider uppercase">
            Max Open
          </label>
          <div className="flex items-center gap-1">
            <Input
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
          <label className="font-mono text-xs tracking-wider uppercase">
            Min Gap %
          </label>
          <div className="flex items-center gap-1">
            <Input
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
            {totalCount === 0 ? 'No results found' : 'Enter filters and click Scan'}
          </div>
        ) : (
          <table className="w-full font-mono text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface text-xs tracking-wider uppercase">
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Open</th>
                <th className="px-3 py-2 text-right">Close</th>
                <th className="px-3 py-2 text-right">Volume</th>
                <th className="px-3 py-2 text-right">Gap</th>
                <th className="px-3 py-2 text-right">Change</th>
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
