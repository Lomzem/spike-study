import {
  CandlestickSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'

export default function useChart({
  candleData,
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  candleData: CandlestickData[]
}) {
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (chartRef.current) {
      chartRef.current.remove()
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
    })
    chartRef.current = chart

    const candlestickSeries = chart.addSeries(CandlestickSeries)
    candlestickSeries.setData(candleData)

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  })
  return { chart: chartRef, series: seriesRef }
}
