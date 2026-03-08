import type { IChartApi, IPriceLine, ISeriesApi } from 'lightweight-charts'
import { CrosshairMode, LineStyle } from 'lightweight-charts'

export interface UserPriceLinesOptions {
  color?: string
  lineWidth?: 1 | 2 | 3 | 4
  lineStyle?: LineStyle
  dragThresholdPx?: number
  hitTolerancePx?: number
  selectedColor?: string
  selectedLineWidth?: 1 | 2 | 3 | 4
}

const DEFAULT_DRAG_THRESHOLD_PX = 3
const DEFAULT_HIT_TOLERANCE_PX = 5

type InteractionPhase = 'idle' | 'pointerDown' | 'dragging'

interface InteractionState {
  phase: InteractionPhase
  pointerDownY: number | null
  dragLine: IPriceLine | null
  selectedLine: IPriceLine | null
}

export class UserPriceLines {
  private _chart: IChartApi
  private _series: ISeriesApi<'Candlestick'>
  private _options: Required<UserPriceLinesOptions>
  private _lines: IPriceLine[] = []
  private _removed = false
  private _originalChartOptions!: {
    crosshair: ReturnType<IChartApi['options']>['crosshair']
    handleScroll: ReturnType<IChartApi['options']>['handleScroll']
    handleScale: ReturnType<IChartApi['options']>['handleScale']
  }

  private _state: InteractionState = {
    phase: 'idle',
    pointerDownY: null,
    dragLine: null,
    selectedLine: null,
  }

  private _onMouseDown: (e: MouseEvent) => void
  private _onMouseMove: (e: MouseEvent) => void
  private _onMouseUp: (e: MouseEvent) => void
  private _onKeyDown: (e: KeyboardEvent) => void

  constructor(
    chart: IChartApi,
    series: ISeriesApi<'Candlestick'>,
    options?: UserPriceLinesOptions,
  ) {
    this._chart = chart
    this._series = series
    this._options = {
      color: options?.color ?? '#4C9AFF',
      lineWidth: options?.lineWidth ?? 1,
      lineStyle: options?.lineStyle ?? LineStyle.Dashed,
      dragThresholdPx: options?.dragThresholdPx ?? DEFAULT_DRAG_THRESHOLD_PX,
      hitTolerancePx: options?.hitTolerancePx ?? DEFAULT_HIT_TOLERANCE_PX,
      selectedColor: options?.selectedColor ?? '#ff4444',
      selectedLineWidth: options?.selectedLineWidth ?? 2,
    }

    const chartOpts = this._chart.options()
    this._originalChartOptions = {
      crosshair: chartOpts.crosshair,
      handleScroll: chartOpts.handleScroll,
      handleScale: chartOpts.handleScale,
    }

    this._chart.applyOptions({
      crosshair: { mode: CrosshairMode.Normal },
    })

    const el = this._chart.chartElement()

    this._onMouseDown = (e: MouseEvent) => this._handleMouseDown(e)
    this._onMouseMove = (e: MouseEvent) => this._handleMouseMove(e)
    this._onMouseUp = (e: MouseEvent) => this._handleMouseUp(e)
    this._onKeyDown = (e: KeyboardEvent) => this._handleKeyDown(e)

    el.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
    window.addEventListener('keydown', this._onKeyDown)
  }

  private _getLocalY(e: MouseEvent): number {
    const rect = this._chart.chartElement().getBoundingClientRect()
    return e.clientY - rect.top
  }

  private _findLineNearCoordinate(y: number): IPriceLine | null {
    for (const line of this._lines) {
      const coord = this._series.priceToCoordinate(line.options().price)
      if (
        coord !== null &&
        Math.abs(coord - y) <= this._options.hitTolerancePx
      ) {
        return line
      }
    }
    return null
  }

  private _createLineAtCoordinate(y: number): IPriceLine | null {
    const price = this._series.coordinateToPrice(y)
    if (price === null) {
      return null
    }

    const line = this._series.createPriceLine({
      price,
      color: this._options.color,
      lineWidth: this._options.lineWidth,
      lineStyle: this._options.lineStyle,
      axisLabelVisible: true,
      title: '',
    })
    this._lines.push(line)
    return line
  }

  private _removeLine(line: IPriceLine): void {
    this._series.removePriceLine(line)
    this._lines = this._lines.filter((existingLine) => existingLine !== line)
    if (this._state.selectedLine === line) {
      this._state.selectedLine = null
    }
  }

  private _applyDefaultStyle(line: IPriceLine): void {
    line.applyOptions({
      color: this._options.color,
      lineWidth: this._options.lineWidth,
    })
  }

  private _applySelectedStyle(line: IPriceLine): void {
    line.applyOptions({
      color: this._options.selectedColor,
      lineWidth: this._options.selectedLineWidth,
    })
  }

  private _disableChartInteractions(): void {
    this._chart.applyOptions({
      handleScroll: false,
      handleScale: false,
    })
  }

  private _restoreChartInteractions(): void {
    this._chart.applyOptions({
      handleScroll: this._originalChartOptions.handleScroll,
      handleScale: this._originalChartOptions.handleScale,
    })
  }

  private _resetPointerState(): void {
    this._state.phase = 'idle'
    this._state.pointerDownY = null
    this._state.dragLine = null
  }

  private _handleMouseDown(e: MouseEvent) {
    if (e.button !== 0 || this._removed) return
    const y = this._getLocalY(e)
    this._state.pointerDownY = y
    this._state.phase = 'pointerDown'

    const hit = this._findLineNearCoordinate(y)
    this._state.dragLine = hit
    if (hit) {
      this._disableChartInteractions()
    }
  }

  private _handleMouseMove(e: MouseEvent) {
    if (this._state.pointerDownY === null || this._removed) return
    const y = this._getLocalY(e)

    if (
      this._state.phase === 'pointerDown' &&
      Math.abs(y - this._state.pointerDownY) > this._options.dragThresholdPx
    ) {
      this._state.phase = 'dragging'
    }

    if (this._state.phase === 'dragging' && this._state.dragLine) {
      const price = this._series.coordinateToPrice(y)
      if (price !== null) {
        this._state.dragLine.applyOptions({ price })
      }
    }
  }

  private _handleMouseUp(e: MouseEvent) {
    if (e.button !== 0 || this._removed) return
    const y = this._getLocalY(e)
    const { dragLine, phase, pointerDownY } = this._state

    if (dragLine) {
      this._restoreChartInteractions()
      if (phase !== 'dragging') {
        this._selectLine(dragLine)
      }
      this._resetPointerState()
      return
    }

    if (phase === 'pointerDown' && pointerDownY !== null) {
      const hit = this._findLineNearCoordinate(y)
      if (hit) {
        this._selectLine(hit)
      } else {
        this._selectLine(null)
        this._createLineAtCoordinate(y)
      }
    }

    this._resetPointerState()
  }

  private _selectLine(line: IPriceLine | null) {
    if (this._state.selectedLine && this._state.selectedLine !== line) {
      this._applyDefaultStyle(this._state.selectedLine)
    }
    this._state.selectedLine = line
    if (this._state.selectedLine) {
      this._applySelectedStyle(this._state.selectedLine)
    }
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (this._removed) return
    if (e.key === 'Escape') {
      this._selectLine(null)
      return
    }

    if (!this._state.selectedLine) return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      this._removeLine(this._state.selectedLine)
    }
  }

  remove() {
    if (this._removed) {
      return
    }

    this._chart.applyOptions({
      crosshair: this._originalChartOptions.crosshair,
      handleScroll: this._originalChartOptions.handleScroll,
      handleScale: this._originalChartOptions.handleScale,
    })

    const el = this._chart.chartElement()
    el.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('keydown', this._onKeyDown)
    this._removed = true
  }
}
