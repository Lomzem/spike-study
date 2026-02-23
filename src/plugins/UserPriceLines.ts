import type {
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  SeriesAttachedParameter,
  Time,
  MouseEventParams,
  PrimitivePaneViewZOrder,
} from 'lightweight-charts'
import { CrosshairMode, LineStyle } from 'lightweight-charts'
import type { CanvasRenderingTarget2D } from 'fancy-canvas'

// --- Renderer: draws the "+" button near the price axis ---

interface ButtonState {
  visible: boolean
  x: number
  y: number
  size: number
}

class UserPriceLinesRenderer implements IPrimitivePaneRenderer {
  private _state: ButtonState

  constructor(state: ButtonState) {
    this._state = state
  }

  draw(target: CanvasRenderingTarget2D): void {
    if (!this._state.visible) return

    const state = this._state
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      const { x, y, size } = state
      const half = size / 2

      // Button background
      ctx.fillStyle = 'rgba(41, 98, 255, 0.85)'
      ctx.beginPath()
      ctx.roundRect(x - half, y - half, size, size, 4)
      ctx.fill()

      // "+" sign
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      const margin = size * 0.28
      ctx.moveTo(x - half + margin, y)
      ctx.lineTo(x + half - margin, y)
      ctx.moveTo(x, y - half + margin)
      ctx.lineTo(x, y + half - margin)
      ctx.stroke()
    })
  }
}

// --- Pane View: produces the renderer ---

class UserPriceLinesView implements IPrimitivePaneView {
  _state: ButtonState = { visible: false, x: 0, y: 0, size: 28 }

  renderer(): IPrimitivePaneRenderer | null {
    return new UserPriceLinesRenderer(this._state)
  }

  zOrder(): PrimitivePaneViewZOrder {
    return 'top'
  }
}

// --- Main plugin class ---

export interface UserPriceLinesOptions {
  color?: string
  lineWidth?: 1 | 2 | 3 | 4
}

export class UserPriceLines implements ISeriesPrimitive<Time> {
  private _chart: IChartApi
  private _series: ISeriesApi<'Candlestick'>
  private _options: Required<UserPriceLinesOptions>
  private _view = new UserPriceLinesView()
  private _requestUpdate: (() => void) | null = null

  private _crosshairHandler: ((param: MouseEventParams<Time>) => void) | null =
    null
  private _clickHandler: ((param: MouseEventParams<Time>) => void) | null = null

  // Track the price axis width for hit detection
  private _buttonPrice: number | null = null

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

    // Set crosshair to Normal mode for accurate coordinates
    this._chart.applyOptions({
      crosshair: { mode: CrosshairMode.Normal },
    })

    this._series.attachPrimitive(this)
  }

  attached(param: SeriesAttachedParameter<Time>) {
    this._requestUpdate = param.requestUpdate

    this._crosshairHandler = (param: MouseEventParams<Time>) => {
      this._onCrosshairMove(param)
    }
    this._clickHandler = (param: MouseEventParams<Time>) => {
      this._onClick(param)
    }

    this._chart.subscribeCrosshairMove(this._crosshairHandler)
    this._chart.subscribeClick(this._clickHandler)
  }

  detached() {
    if (this._crosshairHandler) {
      this._chart.unsubscribeCrosshairMove(this._crosshairHandler)
      this._crosshairHandler = null
    }
    if (this._clickHandler) {
      this._chart.unsubscribeClick(this._clickHandler)
      this._clickHandler = null
    }
    this._requestUpdate = null
  }

  paneViews() {
    return [this._view]
  }

  private _onCrosshairMove(param: MouseEventParams<Time>) {
    const point = param.point
    if (!point) {
      this._view._state.visible = false
      this._buttonPrice = null
      this._requestUpdate?.()
      return
    }

    const chartElement = this._chart.chartElement()
    const chartWidth = chartElement.clientWidth
    const priceScaleWidth = this._chart.priceScale('right').width()
    const paneRight = chartWidth - priceScaleWidth
    const buttonSize = this._view._state.size

    // Show button when mouse is near the right edge of the pane area
    const triggerZone = 60
    const inZone =
      point.x >= paneRight - triggerZone && point.x <= paneRight + triggerZone

    if (inZone) {
      const price = this._series.coordinateToPrice(point.y)
      if (price !== null) {
        this._buttonPrice = price
        this._view._state.visible = true
        this._view._state.x = paneRight - buttonSize / 2 - 4
        this._view._state.y = point.y
        this._requestUpdate?.()
        return
      }
    }

    this._view._state.visible = false
    this._buttonPrice = null
    this._requestUpdate?.()
  }

  private _onClick(param: MouseEventParams<Time>) {
    if (!this._view._state.visible || this._buttonPrice === null) return

    const point = param.point
    if (!point) return

    const { x, y, size } = this._view._state
    const half = size / 2

    // Check if click is within the button bounds
    if (
      point.x >= x - half &&
      point.x <= x + half &&
      point.y >= y - half &&
      point.y <= y + half
    ) {
      this._series.createPriceLine({
        price: this._buttonPrice,
        color: this._options.color,
        lineWidth: this._options.lineWidth,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '',
      })
    }
  }

  remove() {
    this._series.detachPrimitive(this)
  }
}
