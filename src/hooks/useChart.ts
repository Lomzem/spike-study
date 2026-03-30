import {
  CandlestickSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useRef } from 'react'
import { api } from '../../convex/_generated/api'
import { type SavedPriceLine, UserPriceLines } from '~/plugins/UserPriceLines'

export default function useChart({
  candleData,
  containerRef,
  symbol,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  candleData: CandlestickData[]
  symbol: string
}) {
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const userPriceLinesRef = useRef<UserPriceLines | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const hydratedDrawingKeyRef = useRef<string | null>(null)
  const normalizedSymbol = symbol.trim().toUpperCase()
  const savedPriceLines = useQuery(api.userDrawings.getForSymbol, {
    symbol: normalizedSymbol,
  })
  const saveForSymbol = useMutation(api.userDrawings.saveForSymbol)

  // FIXME: Un-hardcode colors
  const bgColor = '#0f1117'
  const gridColor = 'rgba(255, 255, 255, 0.03)'
  const crosshairColor = 'rgba(255, 255, 255, 0.03)'

  const scheduleSave = useCallback(
    (priceLines: SavedPriceLine[]) => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      hydratedDrawingKeyRef.current = `${normalizedSymbol}:${JSON.stringify(priceLines)}`

      saveTimeoutRef.current = window.setTimeout(() => {
        void saveForSymbol({
          symbol: normalizedSymbol,
          priceLines,
        }).catch((error: unknown) => {
          console.error('Failed to save user price lines', error)
          hydratedDrawingKeyRef.current = null
        })
      }, 500)
    },
    [normalizedSymbol, saveForSymbol],
  )

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
    seriesRef.current = candlestickSeries

    return () => {
      if (userPriceLinesRef.current) {
        userPriceLinesRef.current.remove()
        userPriceLinesRef.current = null
      }
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      hydratedDrawingKeyRef.current = null
    }
  }, [candleData, containerRef, scheduleSave])

  useEffect(() => {
    if (
      !chartRef.current ||
      !seriesRef.current ||
      savedPriceLines === undefined
    ) {
      return
    }

    const drawingKey = `${normalizedSymbol}:${JSON.stringify(savedPriceLines)}`
    if (hydratedDrawingKeyRef.current === drawingKey) {
      return
    }

    if (!userPriceLinesRef.current) {
      userPriceLinesRef.current = new UserPriceLines(
        chartRef.current,
        seriesRef.current,
        {
          color: '#4C9AFF',
          onChange: scheduleSave,
        },
      )
    }

    userPriceLinesRef.current.importState(savedPriceLines)
    hydratedDrawingKeyRef.current = drawingKey
  }, [normalizedSymbol, savedPriceLines, scheduleSave])

  return { chart: chartRef, series: seriesRef }
}
