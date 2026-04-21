import {
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type UTCTimestamp,
} from 'lightweight-charts'
import { ChartIndicatorSeries } from './chart-indicator-series'
import {
  DrawingSaveQueue,
  buildDrawingStateKey,
  createUserPriceLines,
} from './chart-drawing-sync'
import type {
  ChartCandle,
  ChartDrawingState,
  ChartIndicatorState,
} from './chart-types'
import type { SavedPriceLine } from './chart-drawing-types'
import { UserPriceLines } from './chart-user-price-lines'
import { createChartView, setChartViewData } from './chart-view'

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
  private indicatorSeries: ChartIndicatorSeries
  private userPriceLines: UserPriceLines | null = null
  private resizeObserver: ResizeObserver
  private candleData: Array<ChartCandle>
  private indicatorState: ChartIndicatorState
  private drawingState: ChartDrawingState | null
  private onDrawingsChange?: (priceLines: Array<SavedPriceLine>) => void
  private drawingSaveQueue: DrawingSaveQueue
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
    this.drawingSaveQueue = new DrawingSaveQueue((priceLines) => {
      this.onDrawingsChange?.(priceLines)
    })
    this.candleLookup = new Map(candles.map((candle) => [candle.time, candle]))

    const chartView = createChartView(element)
    this.chart = chartView.chart
    this.candlestickSeries = chartView.candlestickSeries
    this.volumeSeries = chartView.volumeSeries
    this.indicatorSeries = new ChartIndicatorSeries(this.chart)
    setChartViewData(chartView, candles)
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
    this.indicatorSeries.removeAll()
    this.userPriceLines?.remove()
    this.userPriceLines = null
    this.drawingSaveQueue.flush()
    this.resizeObserver.disconnect()
    this.chart.unsubscribeCrosshairMove(this.handleCrosshairMove)
    this.chart.remove()
  }

  set candles(candles: Array<ChartCandle>) {
    this.candleData = candles
    this.candleLookup = new Map(candles.map((candle) => [candle.time, candle]))
    setChartViewData(
      {
        chart: this.chart,
        candlestickSeries: this.candlestickSeries,
        volumeSeries: this.volumeSeries,
      },
      candles,
    )
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

  private syncIndicators() {
    this.indicatorSeries.sync(this.indicatorState, this.candleData)
  }

  private syncDrawings() {
    if (!this.drawingState) {
      this.userPriceLines?.importState([])
      this.hydratedDrawingKey = null
      return
    }

    if (!this.userPriceLines) {
      this.userPriceLines = createUserPriceLines(
        this.chart,
        this.candlestickSeries,
        (priceLines) => this.scheduleDrawingSave(priceLines),
      )
    }

    const drawingKey = buildDrawingStateKey(this.drawingState)
    if (this.hydratedDrawingKey === drawingKey) {
      return
    }

    this.userPriceLines.importState(this.drawingState.priceLines)
    this.hydratedDrawingKey = drawingKey
  }

  private scheduleDrawingSave(priceLines: Array<SavedPriceLine>) {
    this.hydratedDrawingKey = this.drawingState
      ? buildDrawingStateKey({
          symbol: this.drawingState.symbol,
          priceLines,
        })
      : JSON.stringify(priceLines)
    this.drawingSaveQueue.schedule(priceLines)
  }
}
