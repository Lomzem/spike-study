import {
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type UTCTimestamp,
} from 'lightweight-charts'
import { ChartIndicatorSeries } from './chart-indicator-series'
import { ChartDrawingsController } from './drawings/controller'
import { DEFAULT_DRAWING_DEFAULTS } from './drawings/defaults'
import { DrawingSaveQueue } from './drawings/save-queue'
import { buildDrawingStateKey } from './drawings/state-key'
import type {
  DrawingDefaults,
  DrawingToolType,
  SavedDrawing,
} from './drawings/types'
import type {
  ChartCandle,
  ChartDrawingState,
  ChartIndicatorState,
} from './chart-types'
import {
  createChartView,
  fitChartViewContent,
  setChartViewData,
} from './chart-view'

interface ChartControllerOptions {
  element: HTMLElement
  candles: Array<ChartCandle>
  onActiveCandleChange?: (candle: ChartCandle | null) => void
  indicators?: ChartIndicatorState
  drawings?: ChartDrawingState
  drawingDefaults?: DrawingDefaults
  onDrawingsChange?: (drawings: Array<SavedDrawing>) => void
  onToolMenuRequest?: (request: { x: number; y: number }) => void
  onDrawingMenuRequest?: (
    request: { x: number; y: number },
    drawing: SavedDrawing,
  ) => void
  onSelectedDrawingChange?: (drawing: SavedDrawing | null) => void
}

export class ChartController {
  private chart: IChartApi
  private candlestickSeries: ISeriesApi<'Candlestick'>
  private volumeSeries: ISeriesApi<'Histogram'>
  private indicatorSeries: ChartIndicatorSeries
  private drawingsController: ChartDrawingsController | null = null
  private resizeObserver: ResizeObserver
  private candleData: Array<ChartCandle>
  private indicatorState: ChartIndicatorState
  private drawingState: ChartDrawingState | null
  private drawingDefaults: DrawingDefaults
  private onDrawingsChange?: (drawings: Array<SavedDrawing>) => void
  private drawingSaveQueue: DrawingSaveQueue
  private hydratedDrawingKey: string | null = null
  private onActiveCandleChange?: (candle: ChartCandle | null) => void
  private candleLookup: Map<UTCTimestamp, ChartCandle>
  private disposed = false
  private onToolMenuRequest?: (request: { x: number; y: number }) => void
  private onDrawingMenuRequest?: (
    request: { x: number; y: number },
    drawing: SavedDrawing,
  ) => void
  private onSelectedDrawingChange?: (drawing: SavedDrawing | null) => void

  constructor({
    element,
    candles,
    onActiveCandleChange,
    indicators,
    drawings,
    drawingDefaults,
    onDrawingsChange,
    onToolMenuRequest,
    onDrawingMenuRequest,
    onSelectedDrawingChange,
  }: ChartControllerOptions) {
    this.candleData = candles
    this.indicatorState = indicators ?? {
      showSma: false,
      showEma: false,
      showVwap: false,
    }
    this.drawingState = drawings ?? null
    this.drawingDefaults =
      drawingDefaults ?? structuredClone(DEFAULT_DRAWING_DEFAULTS)
    this.onDrawingsChange = onDrawingsChange
    this.onActiveCandleChange = onActiveCandleChange
    this.onToolMenuRequest = onToolMenuRequest
    this.onDrawingMenuRequest = onDrawingMenuRequest
    this.onSelectedDrawingChange = onSelectedDrawingChange
    this.drawingSaveQueue = new DrawingSaveQueue((drawingsToSave) => {
      this.onDrawingsChange?.(drawingsToSave)
    })
    this.candleLookup = new Map(candles.map((candle) => [candle.time, candle]))

    const chartView = createChartView(element)
    this.chart = chartView.chart
    this.candlestickSeries = chartView.candlestickSeries
    this.volumeSeries = chartView.volumeSeries
    this.indicatorSeries = new ChartIndicatorSeries(this.chart)
    setChartViewData(chartView, candles)
    fitChartViewContent(chartView)
    this.onActiveCandleChange?.(candles.at(-1) ?? null)
    this.syncIndicators()
    this.syncDrawings(element)

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

  get selectedDrawing() {
    return this.drawingsController?.selectedDrawing ?? null
  }

  destroy() {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.indicatorSeries?.removeAll()
    this.drawingsController?.destroy()
    this.drawingsController = null
    this.drawingSaveQueue?.cancel()
    this.resizeObserver?.disconnect()
    this.chart?.unsubscribeCrosshairMove(this.handleCrosshairMove)
    this.chart?.remove()
  }

  set candles(candles: Array<ChartCandle>) {
    if (candles === this.candleData) {
      return
    }

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
  }

  set indicators(indicators: ChartIndicatorState) {
    this.indicatorState = indicators
    this.syncIndicators()
  }

  set drawings(drawings: ChartDrawingState | null) {
    this.drawingState = drawings
    this.syncDrawingState()
  }

  set defaults(defaults: DrawingDefaults) {
    this.drawingDefaults = defaults
    this.drawingsController?.setDefaults(defaults)
  }

  setActiveDrawingTool(tool: DrawingToolType | null) {
    this.drawingsController?.setActiveTool(tool)
  }

  handleMouseDown(event: MouseEvent) {
    this.drawingsController?.handleMouseDown(event)
  }

  handleMouseMove(event: MouseEvent) {
    this.drawingsController?.handleMouseMove(event)
  }

  handleMouseUp() {
    this.drawingsController?.handleMouseUp()
  }

  handleClick(event: MouseEvent) {
    this.drawingsController?.handleClick(event)
  }

  handleContextMenu(event: MouseEvent) {
    this.drawingsController?.handleContextMenu(event)
  }

  handleKeyDown(event: KeyboardEvent) {
    this.drawingsController?.handleKeyDown(event)
  }

  updateSelectedDrawing(drawing: SavedDrawing) {
    this.drawingsController?.updateSelectedDrawing(drawing)
  }

  removeSelectedDrawing() {
    this.drawingsController?.removeSelectedDrawing()
  }

  clearSelectedDrawing() {
    this.drawingsController?.clearSelection()
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

  private syncDrawings(element: HTMLElement) {
    this.drawingsController = new ChartDrawingsController(
      this.chart,
      this.candlestickSeries,
      element,
      {
        drawings: this.drawingState?.drawings ?? [],
        defaults: this.drawingDefaults,
        onChange: (drawings) => this.scheduleDrawingSave(drawings),
        onToolMenuRequest: this.onToolMenuRequest,
        onDrawingMenuRequest: this.onDrawingMenuRequest,
        onSelectionChange: this.onSelectedDrawingChange,
      },
    )
    this.syncDrawingState()
  }

  private syncDrawingState() {
    if (!this.drawingsController) {
      return
    }

    if (!this.drawingState) {
      this.drawingsController.setDrawings([])
      this.hydratedDrawingKey = null
      return
    }

    const drawingKey = buildDrawingStateKey(
      this.drawingState.symbol,
      this.drawingState.drawings,
    )
    if (this.hydratedDrawingKey === drawingKey) {
      return
    }

    this.drawingsController.setDrawings(this.drawingState.drawings)
    this.hydratedDrawingKey = drawingKey
  }

  private scheduleDrawingSave(drawings: Array<SavedDrawing>) {
    if (this.disposed || !this.drawingState) {
      return
    }

    this.hydratedDrawingKey = buildDrawingStateKey(
      this.drawingState.symbol,
      drawings,
    )
    this.drawingSaveQueue.schedule(drawings)
  }
}
