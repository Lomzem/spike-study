import type { IChartApi, IPriceLine, ISeriesApi } from 'lightweight-charts'
import { CrosshairMode, LineStyle } from 'lightweight-charts'

export interface UserPriceLinesOptions {
  color?: string
  lineWidth?: 1 | 2 | 3 | 4
}

const DRAG_THRESHOLD = 3 // px movement before considered a drag
const HIT_TOLERANCE = 5 // px distance to grab an existing line

export class UserPriceLines {
  private _chart: IChartApi
  private _series: ISeriesApi<'Candlestick'>
  private _options: Required<UserPriceLinesOptions>
  private _lines: IPriceLine[] = []

  private _selected: IPriceLine | null = null
  private _dragging: IPriceLine | null = null
  private _mouseDownY: number | null = null
  private _didDrag = false

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

  private _yFromEvent(e: MouseEvent): number {
    const rect = this._chart.chartElement().getBoundingClientRect()
    return e.clientY - rect.top
  }

  private _findLineAtY(y: number): IPriceLine | null {
    for (const line of this._lines) {
      const coord = this._series.priceToCoordinate(line.options().price)
      if (coord !== null && Math.abs(coord - y) <= HIT_TOLERANCE) {
        return line
      }
    }
    return null
  }

  private _handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    const y = this._yFromEvent(e)
    this._mouseDownY = y
    this._didDrag = false

    const hit = this._findLineAtY(y)
    if (hit) {
      this._dragging = hit
      // Disable chart interaction while dragging
      this._chart.applyOptions({
        handleScroll: false,
        handleScale: false,
      })
    }
  }

  private _handleMouseMove(e: MouseEvent) {
    if (this._mouseDownY === null) return
    const y = this._yFromEvent(e)

    if (!this._didDrag && Math.abs(y - this._mouseDownY) > DRAG_THRESHOLD) {
      this._didDrag = true
    }

    if (this._dragging && this._didDrag) {
      const price = this._series.coordinateToPrice(y)
      if (price !== null) {
        this._dragging.applyOptions({ price })
      }
    }
  }

  private _handleMouseUp(e: MouseEvent) {
    if (e.button !== 0) return
    const y = this._yFromEvent(e)

    if (this._dragging) {
      // Re-enable chart interaction
      this._chart.applyOptions({
        handleScroll: true,
        handleScale: true,
      })
      if (!this._didDrag) {
        // Clicked on a line without dragging — select it
        this._selectLine(this._dragging)
      }
      this._dragging = null
    } else if (!this._didDrag && this._mouseDownY !== null) {
      const hit = this._findLineAtY(y)
      if (hit) {
        this._selectLine(hit)
      } else {
        // Clicked empty space — deselect, then create a new line
        this._selectLine(null)
        const price = this._series.coordinateToPrice(y)
        if (price !== null) {
          const line = this._series.createPriceLine({
            price,
            color: this._options.color,
            lineWidth: this._options.lineWidth,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '',
          })
          this._lines.push(line)
        }
      }
    }

    this._mouseDownY = null
    this._didDrag = false
  }

  private _selectLine(line: IPriceLine | null) {
    // Restore previous selection styling
    if (this._selected) {
      this._selected.applyOptions({
        color: this._options.color,
        lineWidth: this._options.lineWidth,
      })
    }
    this._selected = line
    // Highlight the selected line
    if (this._selected) {
      this._selected.applyOptions({
        color: '#ff4444',
        lineWidth: 2,
      })
    }
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (!this._selected) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      this._series.removePriceLine(this._selected)
      this._lines = this._lines.filter((l) => l !== this._selected)
      this._selected = null
    } else if (e.key === 'Escape') {
      this._selectLine(null)
    }
  }

  remove() {
    const el = this._chart.chartElement()
    el.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('keydown', this._onKeyDown)
  }
}
