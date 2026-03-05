import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useRef } from 'react'
import { and, eq, getTableColumns } from 'drizzle-orm'
import useChart from '~/hooks/useChart'
import db from '~/market-data/db'
import { intradayStocksTable } from '~/market-data/schema'
import type { UTCTimestamp } from 'lightweight-charts'

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
  const { symbol, date } = Route.useParams()
  const { intradayData } = Route.useLoaderData()

  if (intradayData.length === 0) {
    return (
      <p>
        No data found for {symbol} on {date}
      </p>
    )
  }

  useChart({
    candleData: intradayData.map((d) => ({
      ...d,
      time: d.time as UTCTimestamp,
    })),
    containerRef: chartContainerRef,
  })

  return <div className="h-full w-dvw" ref={chartContainerRef}></div>
}
