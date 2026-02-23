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

  // const rootStyles = getComputedStyle(document.documentElement)
  // const bgColor = rootStyles.getPropertyValue('--color-bg').trim()
  // const gridColor = rootStyles.getPropertyValue('--color-grid').trim()
  // const crosshairColor = rootStyles.getPropertyValue('--color-crosshair').trim()

  const bgColor = '#0f1117'
  const gridColor = 'rgba(255, 255, 255, 0.03)'
  const crosshairColor = 'rgba(255, 255, 255, 0.03)'

  useEffect(() => {
    if (!containerRef.current) return

    if (chartRef.current) {
      chartRef.current.remove()
    }

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    const observer = new ResizeObserver(handleResize)
    observer.observe(containerRef.current)

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
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
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  })
  return { chart: chartRef, series: seriesRef }
}
