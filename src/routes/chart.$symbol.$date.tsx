import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, getTableColumns } from 'drizzle-orm'
import { useMemo, useRef } from 'react'
import type { UTCTimestamp } from 'lightweight-charts'
import type { IntradayCandleData } from '~/lib/indicators'
import useChart from '~/hooks/useChart'
import db from '~/market-data/db'
import { intradayStocksTable } from '~/market-data/schema'
import { useChartIndicators } from '~/routes/-chart-indicators'

const getIntradayData = createServerFn()
  .inputValidator((data: { symbol: string; date: string }) => data)
  .handler(({ data: { symbol, date: chartDate } }) => {
    const { date, ...rest } = getTableColumns(intradayStocksTable)

    return db
      .select(rest)
      .from(intradayStocksTable)
      .where(
        and(
          eq(intradayStocksTable.date, chartDate),
          eq(intradayStocksTable.symbol, symbol),
        ),
      )
      .orderBy(asc(intradayStocksTable.time))
  })

export const Route = createFileRoute('/chart/$symbol/$date')({
  component: RouteComponent,
  loader: async ({ params: { symbol, date } }) => {
    const intradayData = await getIntradayData({
      data: {
        symbol,
        date,
      },
    })
    return { intradayData }
  },
})

function RouteComponent() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const { showSma, showEma, showVwap } = useChartIndicators()
  const { symbol, date } = Route.useParams()
  const { intradayData } = Route.useLoaderData()
  const candleData = useMemo(
    () =>
      intradayData.map((d) => ({
        ...d,
        time: d.time as UTCTimestamp,
      })) as Array<IntradayCandleData>,
    [intradayData],
  )

  useChart({
    candleData,
    containerRef: chartContainerRef,
    showEma,
    showSma,
    showVwap,
    symbol,
  })

  if (intradayData.length === 0) {
    return (
      <p>
        No data found for {symbol} on {date}
      </p>
    )
  }

  return <div className="h-full w-dvw" ref={chartContainerRef}></div>
}
