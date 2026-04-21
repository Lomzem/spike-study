import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type UTCTimestamp,
} from 'lightweight-charts'
import {
  calculateEma,
  calculateSessionVwap,
  calculateSma,
} from './chart-indicators'
import type {
  ChartCandle,
  ChartDrawingState,
  ChartIndicatorState,
} from './chart-types'
import { UserPriceLines, type SavedPriceLine } from './chart-user-price-lines'

interface ChartControllerOptions {
  element: HTMLElement
  candles: Array<ChartCandle>
  onActiveCandleChange?: (candle: ChartCandle | null) => void
  indicators?: ChartIndicatorState
  drawings?: ChartDrawingState
  onDrawingsChange?: (priceLines: Array<SavedPriceLine>) => void
}

export class ChartController {
  private chart: IChartApi
  private candlestickSeries: ISeriesApi<'Candlestick'>
  private volumeSeries: ISeriesApi<'Histogram'>
  private smaSeries: ISeriesApi<'Line'> | null = null
  private emaSeries: ISeriesApi<'Line'> | null = null
  private vwapSeries: ISeriesApi<'Line'> | null = null
  private userPriceLines: UserPriceLines | null = null
  private resizeObserver: ResizeObserver
  private candleData: Array<ChartCandle>
  private indicatorState: ChartIndicatorState
  private drawingState: ChartDrawingState | null
  private onDrawingsChange?: (priceLines: Array<SavedPriceLine>) => void
  private saveTimeout: number | null = null
  private pendingPriceLines: Array<SavedPriceLine> | null = null
  private hydratedDrawingKey: string | null = null
  private onActiveCandleChange?: (candle: ChartCandle | null) => void
  private candleLookup: Map<UTCTimestamp, ChartCandle>

  constructor({
    element,
    candles,
    onActiveCandleChange,
    indicators,
    drawings,
    onDrawingsChange,
  }: ChartControllerOptions) {
    this.candleData = candles
    this.indicatorState = indicators ?? {
      showSma: false,
      showEma: false,
      showVwap: false,
    }
    this.drawingState = drawings ?? null
    this.onDrawingsChange = onDrawingsChange
    this.onActiveCandleChange = onActiveCandleChange
    this.candleLookup = new Map(candles.map((candle) => [candle.time, candle]))

    this.chart = createChart(element, {
      width: element.clientWidth,
      height: element.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b95a7',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(139, 149, 167, 0.08)' },
        horzLines: { color: 'rgba(139, 149, 167, 0.08)' },
      },
      crosshair: {
        vertLine: {
          color: 'rgba(245, 158, 11, 0.35)',
          labelBackgroundColor: '#111827',
        },
        horzLine: {
          color: 'rgba(245, 158, 11, 0.35)',
          labelBackgroundColor: '#111827',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(139, 149, 167, 0.12)',
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(139, 149, 167, 0.12)',
      },
    })

    this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: '#5a8a5c',
      downColor: '#c4783a',
      borderVisible: false,
      wickUpColor: '#5a8a5c',
      wickDownColor: '#c4783a',
      priceLineVisible: false,
      lastValueVisible: false,
    })

    this.volumeSeries = this.chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        lastValueVisible: false,
        priceLineVisible: false,
      },
      1,
    )

    this.candlestickSeries.setData(this.toCandlestickData(candles))
    this.volumeSeries.setData(this.toVolumeData(candles))

    const panes = this.chart.panes()
    if (panes.length > 1) {
      panes[0].setHeight((element.clientHeight * 3) / 4)
    }

    this.chart.timeScale().fitContent()
    this.onActiveCandleChange?.(candles.at(-1) ?? null)
    this.syncIndicators()
    this.syncDrawings()

    this.chart.subscribeCrosshairMove(this.handleCrosshairMove)

    this.resizeObserver = new ResizeObserver(() => {
      const width = element.clientWidth
      const height = element.clientHeight

      if (width > 0 && height > 0) {
        this.chart.resize(width, height)
      }
    })

    this.resizeObserver.observe(element)
  }

  destroy() {
    if (this.userPriceLines) {
      this.userPriceLines.remove()
      this.userPriceLines = null
    }

    this.flushPendingDrawings()
    this.resizeObserver.disconnect()
    this.chart.unsubscribeCrosshairMove(this.handleCrosshairMove)
    this.chart.remove()
  }

  set candles(candles: Array<ChartCandle>) {
    this.candleData = candles
    this.candleLookup = new Map(candles.map((candle) => [candle.time, candle]))
    this.candlestickSeries.setData(this.toCandlestickData(candles))
    this.volumeSeries.setData(this.toVolumeData(candles))
    this.chart.timeScale().fitContent()
    this.onActiveCandleChange?.(candles.at(-1) ?? null)
    this.syncIndicators()
    this.syncDrawings()
  }

  set indicators(indicators: ChartIndicatorState) {
    this.indicatorState = indicators
    this.syncIndicators()
  }

  set drawings(drawings: ChartDrawingState | null) {
    this.drawingState = drawings
    this.syncDrawings()
  }

  private handleCrosshairMove = (param: MouseEventParams) => {
    if (!param.point || !param.time) {
      this.onActiveCandleChange?.(this.candleData.at(-1) ?? null)
      return
    }

    this.onActiveCandleChange?.(
      this.candleLookup.get(param.time as UTCTimestamp) ?? null,
    )
  }

  private toCandlestickData(
    candles: Array<ChartCandle>,
  ): Array<CandlestickData<UTCTimestamp>> {
    return candles.map((candle) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))
  }

  private toVolumeData(
    candles: Array<ChartCandle>,
  ): Array<HistogramData<UTCTimestamp>> {
    return candles.map((candle) => ({
      time: candle.time,
      value: candle.volume,
      color:
        candle.close >= candle.open
          ? 'rgba(90, 138, 92, 0.45)'
          : 'rgba(196, 120, 58, 0.45)',
    }))
  }

  private syncIndicators() {
    this.syncLineSeries(
      'smaSeries',
      this.indicatorState.showSma,
      '#f59e0b',
      2,
      undefined,
      calculateSma(this.candleData, 9),
    )
    this.syncLineSeries(
      'emaSeries',
      this.indicatorState.showEma,
      '#60a5fa',
      2,
      undefined,
      calculateEma(this.candleData, 9),
    )
    this.syncLineSeries(
      'vwapSeries',
      this.indicatorState.showVwap,
      '#c084fc',
      2,
      2,
      calculateSessionVwap(this.candleData),
    )
  }

  private syncLineSeries(
    key: 'smaSeries' | 'emaSeries' | 'vwapSeries',
    enabled: boolean,
    color: string,
    lineWidth: 1 | 2 | 3 | 4,
    lineStyle: 0 | 1 | 2 | 3 | 4 | undefined,
    data: Array<LineData<UTCTimestamp> | { time: UTCTimestamp }>,
  ) {
    if (!enabled) {
      if (this[key]) {
        this.chart.removeSeries(this[key])
        this[key] = null
      }
      return
    }

    if (!this[key]) {
      this[key] = this.chart.addSeries(LineSeries, {
        color,
        lineWidth,
        lineStyle,
        lastValueVisible: false,
        priceLineVisible: false,
      })
    }

    this[key].setData(data)
  }

  private syncDrawings() {
    if (!this.drawingState) {
      this.userPriceLines?.importState([])
      this.hydratedDrawingKey = null
      return
    }

    if (!this.userPriceLines) {
      this.userPriceLines = new UserPriceLines(
        this.chart,
        this.candlestickSeries,
        {
          color: '#4c9aff',
          onChange: (priceLines) => this.scheduleDrawingSave(priceLines),
        },
      )
    }

    const drawingKey = `${this.drawingState.symbol}:${JSON.stringify(this.drawingState.priceLines)}`
    if (this.hydratedDrawingKey === drawingKey) {
      return
    }

    this.userPriceLines.importState(this.drawingState.priceLines)
    this.hydratedDrawingKey = drawingKey
  }

  private scheduleDrawingSave(priceLines: Array<SavedPriceLine>) {
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout)
    }

    this.pendingPriceLines = priceLines
    this.hydratedDrawingKey = this.drawingState
      ? `${this.drawingState.symbol}:${JSON.stringify(priceLines)}`
      : JSON.stringify(priceLines)

    this.saveTimeout = window.setTimeout(() => {
      if (this.pendingPriceLines) {
        this.onDrawingsChange?.(this.pendingPriceLines)
      }
      this.pendingPriceLines = null
      this.saveTimeout = null
    }, 500)
  }

  private flushPendingDrawings() {
    if (this.saveTimeout === null || this.pendingPriceLines === null) {
      return
    }

    const priceLines = this.pendingPriceLines
    window.clearTimeout(this.saveTimeout)
    this.saveTimeout = null
    this.pendingPriceLines = null
    this.onDrawingsChange?.(priceLines)
  }
}
