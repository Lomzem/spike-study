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

  const rootStyles = getComputedStyle(document.documentElement)
  const bgColor = rootStyles.getPropertyValue('--color-bg').trim()
  const gridColor = rootStyles.getPropertyValue('--color-grid').trim()
  const crosshairColor = rootStyles.getPropertyValue('--color-crosshair').trim()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (chartRef.current) {
      chartRef.current.remove()
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: bgColor },
      },
      grid: {
        vertLines: {
          color: gridColor,
        },
        horzLines: {
          color: gridColor,
        },
      },
      crosshair: {
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: 2,
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: 2,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: gridColor,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
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
