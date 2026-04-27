import { CrosshairMode, LineStyle } from 'lightweight-charts'
import type { IChartApi, ISeriesApi } from 'lightweight-charts'
import type { SavedPriceLine } from './chart-drawing-types'
import {
  buildLineStateFromCoordinate,
  findLineNearCoordinate,
  isFiniteNumber,
  isTextInputEventTarget,
  normalizeLineWidth,
  type UserPriceLineRecord,
} from './chart-user-price-line-utils'

export interface UserPriceLinesOptions {
  color?: string
  lineWidth?: 1 | 2 | 3 | 4
  lineStyle?: LineStyle
  dragThresholdPx?: number
  hitTolerancePx?: number
  selectedColor?: string
  selectedLineWidth?: 1 | 2 | 3 | 4
  onChange?: (lines: Array<SavedPriceLine>) => void
}

const DEFAULT_DRAG_THRESHOLD_PX = 3
const DEFAULT_HIT_TOLERANCE_PX = 5

type InteractionPhase = 'idle' | 'pointerDown' | 'dragging'

interface InteractionState {
  phase: InteractionPhase
  pointerDownY: number | null
  dragLine: UserPriceLineRecord | null
  selectedLine: UserPriceLineRecord | null
}

export class UserPriceLines {
  private _chart: IChartApi
  private _series: ISeriesApi<'Candlestick'>
  private _options: Required<Omit<UserPriceLinesOptions, 'onChange'>> & {
    onChange?: (lines: Array<SavedPriceLine>) => void
  }
  private _lines: Array<UserPriceLineRecord> = []
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
      onChange: options?.onChange,
    }

    const chartOptions = this._chart.options()
    this._originalChartOptions = {
      crosshair: chartOptions.crosshair,
      handleScroll: chartOptions.handleScroll,
      handleScale: chartOptions.handleScale,
    }

    this._chart.applyOptions({
      crosshair: { mode: CrosshairMode.Normal },
    })

    const chartElement = this._chart.chartElement()

    this._onMouseDown = (event: MouseEvent) => this._handleMouseDown(event)
    this._onMouseMove = (event: MouseEvent) => this._handleMouseMove(event)
    this._onMouseUp = (event: MouseEvent) => this._handleMouseUp(event)
    this._onKeyDown = (event: KeyboardEvent) => this._handleKeyDown(event)

    chartElement.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
    window.addEventListener('keydown', this._onKeyDown)
  }

  exportState(): Array<SavedPriceLine> {
    return this._lines.map(({ state }) => ({ ...state }))
  }

  importState(lines: Array<SavedPriceLine>): void {
    this._selectLine(null)
    this._clearLines()

    for (const line of lines) {
      if (!isFiniteNumber(line.price)) {
        continue
      }

      this._createLine({
        id: line.id,
        price: line.price,
        color: line.color,
        lineWidth: line.lineWidth,
        lineStyle: line.lineStyle,
      })
    }
  }

  private _emitChange(): void {
    this._options.onChange?.(this.exportState())
  }

  private _getLocalY(event: MouseEvent): number {
    const rect = this._chart.chartElement().getBoundingClientRect()
    return event.clientY - rect.top
  }

  private _findLineNearCoordinate(y: number): UserPriceLineRecord | null {
    return findLineNearCoordinate(
      this._lines,
      this._series,
      y,
      this._options.hitTolerancePx,
    )
  }

  private _buildLineStateFromCoordinate(y: number): SavedPriceLine | null {
    return buildLineStateFromCoordinate(this._series, y, {
      color: this._options.color,
      lineWidth: this._options.lineWidth,
      lineStyle: this._options.lineStyle,
    })
  }

  private _createLine(state: SavedPriceLine): UserPriceLineRecord {
    const lineWidth = normalizeLineWidth(state.lineWidth)
    const line = this._series.createPriceLine({
      price: state.price,
      color: state.color,
      lineWidth,
      lineStyle: state.lineStyle as LineStyle,
      axisLabelVisible: true,
      title: '',
    })

    const record = {
      line,
      state: { ...state, lineWidth },
    }
    this._lines.push(record)
    return record
  }

  private _removeLine(record: UserPriceLineRecord): void {
    this._series.removePriceLine(record.line)
    this._lines = this._lines.filter((existingLine) => existingLine !== record)
    if (this._state.selectedLine === record) {
      this._state.selectedLine = null
    }
  }

  private _clearLines(): void {
    for (const { line } of this._lines) {
      this._series.removePriceLine(line)
    }
    this._lines = []
  }

  private _applyPersistedStyle(record: UserPriceLineRecord): void {
    record.line.applyOptions({
      color: record.state.color,
      lineWidth: normalizeLineWidth(record.state.lineWidth),
      lineStyle: record.state.lineStyle as LineStyle,
    })
  }

  private _applySelectedStyle(record: UserPriceLineRecord): void {
    record.line.applyOptions({
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

  private _handleMouseDown(event: MouseEvent) {
    if (event.button !== 0 || this._removed) return

    const y = this._getLocalY(event)
    this._state.pointerDownY = y
    this._state.phase = 'pointerDown'

    const hit = this._findLineNearCoordinate(y)
    this._state.dragLine = hit
    if (hit) {
      this._disableChartInteractions()
    }
  }

  private _handleMouseMove(event: MouseEvent) {
    if (this._state.pointerDownY === null || this._removed) return

    const y = this._getLocalY(event)

    if (
      this._state.phase === 'pointerDown' &&
      this._state.dragLine &&
      Math.abs(y - this._state.pointerDownY) > this._options.dragThresholdPx
    ) {
      this._state.phase = 'dragging'
    }

    if (this._state.phase === 'dragging' && this._state.dragLine) {
      const price = this._series.coordinateToPrice(y)
      if (price !== null) {
        this._state.dragLine.state.price = price
        this._state.dragLine.line.applyOptions({ price })
      }
    }
  }

  private _handleMouseUp(event: MouseEvent) {
    if (event.button !== 0 || this._removed) return

    const y = this._getLocalY(event)
    const { dragLine, phase, pointerDownY } = this._state

    if (dragLine) {
      this._restoreChartInteractions()
      if (phase === 'dragging') {
        this._emitChange()
      } else {
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
        const lineState = this._buildLineStateFromCoordinate(y)
        if (lineState) {
          this._createLine(lineState)
          this._emitChange()
        }
      }
    }

    this._resetPointerState()
  }

  private _selectLine(line: UserPriceLineRecord | null) {
    if (this._state.selectedLine && this._state.selectedLine !== line) {
      this._applyPersistedStyle(this._state.selectedLine)
    }

    this._state.selectedLine = line

    if (this._state.selectedLine) {
      this._applySelectedStyle(this._state.selectedLine)
    }
  }

  private _handleKeyDown(event: KeyboardEvent) {
    if (this._removed) return

    if (isTextInputEventTarget(event)) {
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      this._selectLine(null)
      return
    }

    if (!this._state.selectedLine) return

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      this._removeLine(this._state.selectedLine)
      this._emitChange()
    }
  }

  remove() {
    if (this._removed) {
      return
    }

    this._clearLines()
    this._state = {
      phase: 'idle',
      pointerDownY: null,
      dragLine: null,
      selectedLine: null,
    }

    this._chart.applyOptions({
      crosshair: this._originalChartOptions.crosshair,
      handleScroll: this._originalChartOptions.handleScroll,
      handleScale: this._originalChartOptions.handleScale,
    })

    const chartElement = this._chart.chartElement()
    chartElement.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('keydown', this._onKeyDown)
    this._removed = true
  }
}
