import { CandlestickSeries, LineSeries, createChart } from 'lightweight-charts'
import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { api } from '../../convex/_generated/api'
import type {
  IChartApi,
  ISeriesApi,
  SeriesOptionsMap,
} from 'lightweight-charts'
import type { MutableRefObject, RefObject } from 'react'
import type { IntradayCandleData } from '~/lib/indicators'
import type { SavedLineStyle, SavedPriceLine } from '~/plugins/UserPriceLines'
import { UserPriceLines } from '~/plugins/UserPriceLines'
import {
  calculateEma,
  calculateSessionVwap,
  calculateSma,
} from '~/lib/indicators'

function isSavedLineStyle(value: number): value is SavedLineStyle {
  return value >= 0 && value <= 4 && Number.isInteger(value)
}

function normalizeSavedPriceLines(
  priceLines: Array<{
    id: string
    price: number
    color: string
    lineWidth: number
    lineStyle: number
  }>,
): Array<SavedPriceLine> {
  return priceLines.filter(
    (priceLine): priceLine is SavedPriceLine =>
      Number.isFinite(priceLine.price) &&
      Number.isFinite(priceLine.lineWidth) &&
      isSavedLineStyle(priceLine.lineStyle),
  )
}

function removeSeries<T extends keyof SeriesOptionsMap>(
  chart: IChartApi,
  seriesRef: MutableRefObject<ISeriesApi<T> | null>,
) {
  if (!seriesRef.current) {
    return
  }

  chart.removeSeries(seriesRef.current)
  seriesRef.current = null
}

export default function useChart({
  candleData,
  containerRef,
  showEma,
  showSma,
  showVwap,
  symbol,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  candleData: Array<IntradayCandleData>
  showEma: boolean
  showSma: boolean
  showVwap: boolean
  symbol: string
}) {
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const userPriceLinesRef = useRef<UserPriceLines | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const pendingPriceLinesRef = useRef<Array<SavedPriceLine> | null>(null)
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
  const smaData = useMemo(() => calculateSma(candleData, 9), [candleData])
  const emaData = useMemo(() => calculateEma(candleData, 9), [candleData])
  const vwapData = useMemo(() => calculateSessionVwap(candleData), [candleData])

  const scheduleSave = useCallback(
    (priceLines: Array<SavedPriceLine>) => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      pendingPriceLinesRef.current = priceLines
      hydratedDrawingKeyRef.current = `${normalizedSymbol}:${JSON.stringify(priceLines)}`

      saveTimeoutRef.current = window.setTimeout(() => {
        void saveForSymbol({
          symbol: normalizedSymbol,
          priceLines,
        }).catch((error: unknown) => {
          console.error('Failed to save user price lines', error)
          hydratedDrawingKeyRef.current = null
        })
        saveTimeoutRef.current = null
        pendingPriceLinesRef.current = null
      }, 500)
    },
    [normalizedSymbol, saveForSymbol],
  )

  const flushPendingSave = useCallback(() => {
    if (
      saveTimeoutRef.current === null ||
      pendingPriceLinesRef.current === null
    ) {
      return
    }

    const priceLines = pendingPriceLinesRef.current
    window.clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = null
    pendingPriceLinesRef.current = null

    void saveForSymbol({
      symbol: normalizedSymbol,
      priceLines,
    }).catch((error: unknown) => {
      console.error('Failed to save user price lines', error)
      hydratedDrawingKeyRef.current = null
    })
  }, [normalizedSymbol, saveForSymbol])

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

    candlestickSeriesRef.current = chart.addSeries(CandlestickSeries)

    return () => {
      if (userPriceLinesRef.current) {
        userPriceLinesRef.current.remove()
        userPriceLinesRef.current = null
      }
      flushPendingSave()
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      candlestickSeriesRef.current = null
      smaSeriesRef.current = null
      emaSeriesRef.current = null
      vwapSeriesRef.current = null
      pendingPriceLinesRef.current = null
      hydratedDrawingKeyRef.current = null
    }
  }, [containerRef, flushPendingSave])

  useEffect(() => {
    if (!candlestickSeriesRef.current) {
      return
    }

    candlestickSeriesRef.current.setData(candleData)
  }, [candleData])

  useEffect(() => {
    if (!chartRef.current) {
      return
    }

    const chart = chartRef.current

    if (showSma) {
      if (!smaSeriesRef.current) {
        smaSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        })
        smaSeriesRef.current.setSeriesOrder(1)
      }

      smaSeriesRef.current.setData(smaData)
    } else {
      removeSeries(chart, smaSeriesRef)
    }

    if (showEma) {
      if (!emaSeriesRef.current) {
        emaSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#60a5fa',
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        })
        emaSeriesRef.current.setSeriesOrder(2)
      }

      emaSeriesRef.current.setData(emaData)
    } else {
      removeSeries(chart, emaSeriesRef)
    }

    if (showVwap) {
      if (!vwapSeriesRef.current) {
        vwapSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#c084fc',
          lineWidth: 2,
          lineStyle: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        })
        vwapSeriesRef.current.setSeriesOrder(3)
      }

      vwapSeriesRef.current.setData(vwapData)
    } else {
      removeSeries(chart, vwapSeriesRef)
    }
  }, [emaData, showEma, showSma, showVwap, smaData, vwapData])

  useEffect(() => {
    if (
      !chartRef.current ||
      !candlestickSeriesRef.current ||
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
        candlestickSeriesRef.current,
        {
          color: '#4C9AFF',
          onChange: scheduleSave,
        },
      )
    }

    userPriceLinesRef.current.importState(
      normalizeSavedPriceLines(savedPriceLines),
    )
    hydratedDrawingKeyRef.current = drawingKey
  }, [normalizedSymbol, savedPriceLines, scheduleSave])

  return { chart: chartRef, series: candlestickSeriesRef }
}
