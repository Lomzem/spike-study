import {
  type LogicalRange,
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
  appendChartViewData,
  createChartView,
  fitChartViewContent,
  setChartViewData,
} from './chart-view'

interface ChartControllerOptions {
  element: HTMLElement
  drawingSymbol: string
  candles: Array<ChartCandle>
  initialVisibleLogicalRange?: LogicalRange | null
  onActiveCandleChange?: (candle: ChartCandle | null) => void
  onVisibleLogicalRangeChange?: (range: LogicalRange | null) => void
  indicators?: ChartIndicatorState
  drawings?: ChartDrawingState
  drawingDefaults?: DrawingDefaults
  onDrawingsChange?: (drawings: Array<SavedDrawing>) => void
  onLiveDrawingsChange?: (drawings: Array<SavedDrawing>) => void
  onChartContextMenuRequest?: (request: { x: number; y: number }) => void
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
  private drawingSymbol: string
  private drawingState: ChartDrawingState | null
  private drawingDefaults: DrawingDefaults
  private onDrawingsChange?: (drawings: Array<SavedDrawing>) => void
  private onLiveDrawingsChange?: (drawings: Array<SavedDrawing>) => void
  private drawingSaveQueue: DrawingSaveQueue
  private hydratedDrawingKey: string | null = null
  private onActiveCandleChange?: (candle: ChartCandle | null) => void
  private candleLookup: Map<UTCTimestamp, ChartCandle>
  private disposed = false
  private onChartContextMenuRequest?: (request: {
    x: number
    y: number
  }) => void
  private onDrawingMenuRequest?: (
    request: { x: number; y: number },
    drawing: SavedDrawing,
  ) => void
  private onSelectedDrawingChange?: (drawing: SavedDrawing | null) => void
  private onVisibleLogicalRangeChange?: (range: LogicalRange | null) => void

  constructor({
    element,
    drawingSymbol,
    candles,
    initialVisibleLogicalRange,
    onActiveCandleChange,
    onVisibleLogicalRangeChange,
    indicators,
    drawings,
    drawingDefaults,
    onDrawingsChange,
    onLiveDrawingsChange,
    onChartContextMenuRequest,
    onDrawingMenuRequest,
    onSelectedDrawingChange,
  }: ChartControllerOptions) {
    this.candleData = candles
    this.indicatorState = indicators ?? {
      showSma: false,
      showEma: false,
      showVwap: false,
    }
    this.drawingSymbol = drawingSymbol
    this.drawingState = drawings ?? null
    this.drawingDefaults =
      drawingDefaults ?? structuredClone(DEFAULT_DRAWING_DEFAULTS)
    this.onDrawingsChange = onDrawingsChange
    this.onLiveDrawingsChange = onLiveDrawingsChange
    this.onActiveCandleChange = onActiveCandleChange
    this.onChartContextMenuRequest = onChartContextMenuRequest
    this.onDrawingMenuRequest = onDrawingMenuRequest
    this.onSelectedDrawingChange = onSelectedDrawingChange
    this.onVisibleLogicalRangeChange = onVisibleLogicalRangeChange
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
    if (initialVisibleLogicalRange) {
      this.chart.timeScale().setVisibleLogicalRange(initialVisibleLogicalRange)
    }
    this.onActiveCandleChange?.(candles.at(-1) ?? null)
    this.syncIndicators()
    this.syncDrawings(element)

    this.chart.subscribeCrosshairMove(this.handleCrosshairMove)
    this.chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(this.handleVisibleLogicalRangeChange)

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
    this.drawingSaveQueue?.flush()
    this.resizeObserver?.disconnect()
    this.chart?.unsubscribeCrosshairMove(this.handleCrosshairMove)
    this.chart
      ?.timeScale()
      .unsubscribeVisibleLogicalRangeChange(
        this.handleVisibleLogicalRangeChange,
      )
    this.chart?.remove()
  }

  set candles(candles: Array<ChartCandle>) {
    if (candles === this.candleData) {
      return
    }

    const previousCandles = this.candleData
    this.candleData = candles
    const chartView = {
      chart: this.chart,
      candlestickSeries: this.candlestickSeries,
      volumeSeries: this.volumeSeries,
    }
    if (isAppendedCandleRange(previousCandles, candles)) {
      const appendedCandles = candles.slice(previousCandles.length)

      for (const candle of appendedCandles) {
        this.candleLookup.set(candle.time, candle)
      }

      appendChartViewData(chartView, appendedCandles)
    } else {
      this.candleLookup = new Map(
        candles.map((candle) => [candle.time, candle]),
      )
      setChartViewData(chartView, candles)
    }
    this.onActiveCandleChange?.(candles.at(-1) ?? null)
    this.syncIndicators()
  }

  set indicators(indicators: ChartIndicatorState) {
    this.indicatorState = indicators
    this.syncIndicators()
  }

  set drawings(drawings: ChartDrawingState | null) {
    this.drawingState = drawings
    if (drawings) {
      this.drawingSymbol = drawings.symbol
    }
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

  removeAllDrawings() {
    this.drawingsController?.removeAllDrawings()
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

  private handleVisibleLogicalRangeChange = (range: LogicalRange | null) => {
    this.onVisibleLogicalRangeChange?.(range)
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
        onLiveChange: this.onLiveDrawingsChange,
        onChartContextMenuRequest: this.onChartContextMenuRequest,
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
    if (this.disposed || !this.drawingSymbol) {
      return
    }

    this.hydratedDrawingKey = buildDrawingStateKey(this.drawingSymbol, drawings)
    this.drawingSaveQueue.schedule(drawings)
  }
}

function isAppendedCandleRange(
  previousCandles: Array<ChartCandle>,
  nextCandles: Array<ChartCandle>,
) {
  if (
    previousCandles.length === 0 ||
    nextCandles.length <= previousCandles.length
  ) {
    return false
  }

  for (let index = 0; index < previousCandles.length; index += 1) {
    if (previousCandles[index].time !== nextCandles[index].time) {
      return false
    }
  }

  return true
}
