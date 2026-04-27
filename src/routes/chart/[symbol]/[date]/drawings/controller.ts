import type {
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
} from 'lightweight-charts'
import type {
  CanvasRenderingTarget2D,
  MediaCoordinatesRenderingScope,
} from 'fancy-canvas'
import { createDrawingFromDefaults } from './defaults'
import {
  anchorToPoint,
  createDrawingId,
  createViewport,
  drawControlPoint,
  hitTestDrawings,
  type DrawingPoint,
  type DrawingViewport,
} from './primitive-helpers'
import { renderDiagonalLine } from './tools/diagonal-line'
import { renderFibRetracement } from './tools/fib-retracement'
import {
  getHorizontalLineLabelPoint,
  renderHorizontalLine,
} from './tools/horizontal-line'
import type {
  DiagonalLineDrawing,
  DrawingDefaults,
  FibRetracementDrawing,
  DrawingToolType,
  SavedDrawing,
} from './types'

interface ContextMenuRequest {
  x: number
  y: number
}

interface ChartDrawingsControllerOptions {
  drawings: Array<SavedDrawing>
  defaults: DrawingDefaults
  onChange?: (drawings: Array<SavedDrawing>) => void
  onChartContextMenuRequest?: (request: ContextMenuRequest) => void
  onDrawingMenuRequest?: (
    request: ContextMenuRequest,
    drawing: SavedDrawing,
  ) => void
  onSelectionChange?: (drawing: SavedDrawing | null) => void
}

class DrawingsPaneView implements IPrimitivePaneView {
  constructor(private rendererInstance: DrawingsPaneRenderer) {}

  renderer(): IPrimitivePaneRenderer {
    return this.rendererInstance
  }

  zOrder() {
    return 'normal' as const
  }
}

class DrawingsPaneRenderer implements IPrimitivePaneRenderer {
  constructor(private source: ChartDrawingsController) {}

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace((scope) => this.drawImpl(scope))
  }

  private drawImpl(scope: MediaCoordinatesRenderingScope) {
    const viewport = this.source.getViewport(scope)
    if (!viewport) {
      return
    }

    const { context } = scope
    const selectedId = this.source.selectedDrawingId

    for (const drawing of this.source.drawings) {
      const selected = drawing.id === selectedId
      switch (drawing.type) {
        case 'horizontal-line': {
          renderHorizontalLine(context, viewport, drawing, selected)
          const point = anchorToPoint(viewport, drawing.anchors[0])
          if (point) {
            const labelPoint = getHorizontalLineLabelPoint(viewport, point)
            context.save()
            context.font = '11px var(--font-sans)'
            context.textAlign = 'right'
            context.textBaseline = 'bottom'
            context.fillStyle = drawing.color
            context.fillText(
              drawing.anchors[0].price.toFixed(2),
              labelPoint.x,
              labelPoint.y,
            )
            context.restore()
          }
          break
        }
        case 'diagonal-line':
          renderDiagonalLine(context, viewport, drawing, selected)
          break
        case 'fib-retracement':
          renderFibRetracement(context, viewport, drawing, selected)
          break
      }
    }

    this.source.renderDraft(context, viewport)
  }
}

class DrawingsPrimitive {
  private requestUpdate: (() => void) | null = null
  private paneView: DrawingsPaneView

  constructor(private source: ChartDrawingsController) {
    this.paneView = new DrawingsPaneView(new DrawingsPaneRenderer(source))
  }

  attached({ requestUpdate }: { requestUpdate: () => void }) {
    this.requestUpdate = requestUpdate
  }

  detached() {
    this.requestUpdate = null
  }

  paneViews() {
    return [this.paneView]
  }

  hitTest(x: number, y: number) {
    const viewport = this.source.getViewport()
    if (!viewport) {
      return null
    }

    const hit = hitTestDrawings(viewport, { x, y }, this.source.drawings)
    if (!hit) {
      return null
    }

    return {
      cursorStyle: hit.anchorIndex === null ? 'pointer' : 'grab',
      externalId: hit.drawing.id,
      zOrder: 'normal' as const,
    }
  }

  requestRender() {
    this.requestUpdate?.()
  }
}

export class ChartDrawingsController {
  readonly primitive: DrawingsPrimitive
  private _drawings: Array<SavedDrawing>
  private defaults: DrawingDefaults
  private selectedId: string | null = null
  private activeTool: DrawingToolType | null = null
  private pendingAnchors: Array<SavedDrawing['anchors'][number]> = []
  private draftCursorAnchor: SavedDrawing['anchors'][number] | null = null
  private draggingAnchorIndex: number | null = null
  private draggingDrawingId: string | null = null
  private didDrag = false
  private disposed = false
  private onChange?: (drawings: Array<SavedDrawing>) => void
  private onChartContextMenuRequest?: (request: ContextMenuRequest) => void
  private onDrawingMenuRequest?: (
    request: ContextMenuRequest,
    drawing: SavedDrawing,
  ) => void
  private onSelectionChange?: (drawing: SavedDrawing | null) => void
  constructor(
    private chart: IChartApi,
    private series: ISeriesApi<'Candlestick'>,
    private container: HTMLElement,
    options: ChartDrawingsControllerOptions,
  ) {
    this._drawings = options.drawings
    this.defaults = options.defaults
    this.onChange = options.onChange
    this.onChartContextMenuRequest = options.onChartContextMenuRequest
    this.onDrawingMenuRequest = options.onDrawingMenuRequest
    this.onSelectionChange = options.onSelectionChange
    this.primitive = new DrawingsPrimitive(this)

    this.series.attachPrimitive(this.primitive as never)
  }

  get selectedDrawingId() {
    return this.selectedId
  }

  get drawings() {
    return this._drawings
  }

  get selectedDrawing() {
    return this.selectedId
      ? (this._drawings.find((drawing) => drawing.id === this.selectedId) ??
          null)
      : null
  }

  setDrawings(drawings: Array<SavedDrawing>) {
    this._drawings = drawings.map((drawing) => structuredClone(drawing))
    if (
      this.selectedId &&
      !this._drawings.some((drawing) => drawing.id === this.selectedId)
    ) {
      this.selectedId = null
      this.onSelectionChange?.(null)
    }
    this.pendingAnchors = []
    this.draftCursorAnchor = null
    this.primitive.requestRender()
  }

  setDefaults(defaults: DrawingDefaults) {
    this.defaults = structuredClone(defaults)
  }

  setActiveTool(tool: DrawingToolType | null) {
    this.activeTool = tool
    this.pendingAnchors = []
    this.draftCursorAnchor = null
    this.primitive.requestRender()
  }

  updateSelectedDrawing(drawing: SavedDrawing) {
    const nextDrawings = this._drawings.map((existing) =>
      existing.id === drawing.id ? structuredClone(drawing) : existing,
    )
    this._drawings = nextDrawings
    this.primitive.requestRender()
    this.onSelectionChange?.(drawing)
    this.onChange?.(nextDrawings)
  }

  removeSelectedDrawing() {
    if (!this.selectedId) {
      return
    }

    this._drawings = this._drawings.filter(
      (drawing) => drawing.id !== this.selectedId,
    )
    this.selectedId = null
    this.primitive.requestRender()
    this.onSelectionChange?.(null)
    this.onChange?.(this._drawings)
  }

  removeAllDrawings() {
    this._drawings = []
    this.selectedId = null
    this.pendingAnchors = []
    this.draftCursorAnchor = null
    this.draggingDrawingId = null
    this.draggingAnchorIndex = null
    this.didDrag = false
    this.container.style.cursor = ''
    this.primitive.requestRender()
    this.onSelectionChange?.(null)
    this.onChange?.(this._drawings)
  }

  clearSelection() {
    this.selectedId = null
    this.primitive.requestRender()
    this.onSelectionChange?.(null)
  }

  getViewport(scope?: MediaCoordinatesRenderingScope): DrawingViewport | null {
    if (this.disposed) {
      return null
    }

    const width = scope?.mediaSize.width ?? this.container.clientWidth
    const height = scope?.mediaSize.height ?? this.container.clientHeight
    if (width <= 0 || height <= 0) {
      return null
    }

    return createViewport(this.chart, this.series, width, height)
  }

  destroy() {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.series.detachPrimitive(this.primitive as never)
  }

  handleMouseDown(event: MouseEvent) {
    if (event.button !== 0) {
      return
    }

    const point = this.getPoint(event)
    if (!point) {
      return
    }

    const viewport = this.getViewport()
    if (!viewport) {
      return
    }

    const hit = hitTestDrawings(viewport, point, this._drawings)
    if (!hit || hit.anchorIndex === null) {
      return
    }

    this.draggingDrawingId = hit.drawing.id
    this.draggingAnchorIndex = hit.anchorIndex
    this.didDrag = false
    this.setSelectedDrawing(hit.drawing)
    this.container.style.cursor = 'grabbing'
  }

  handleMouseMove(event: MouseEvent) {
    if (this.draggingDrawingId === null || this.draggingAnchorIndex === null) {
      if (this.activeTool && this.pendingAnchors.length > 0) {
        const anchor = this.eventToAnchor(event)
        if (!anchor) {
          return
        }

        this.draftCursorAnchor = anchor
        this.primitive.requestRender()
      }
      return
    }

    const anchor = this.eventToAnchor(event)
    if (!anchor) {
      return
    }

    const drawing = this._drawings.find(
      (entry) => entry.id === this.draggingDrawingId,
    )
    if (!drawing) {
      return
    }

    const nextDrawing = structuredClone(drawing)
    nextDrawing.anchors[this.draggingAnchorIndex] = anchor as never
    this._drawings = this._drawings.map((entry) =>
      entry.id === nextDrawing.id ? nextDrawing : entry,
    )
    this.didDrag = true
    this.primitive.requestRender()
    this.onSelectionChange?.(nextDrawing)
  }

  handleMouseUp() {
    if (this.draggingDrawingId === null || this.draggingAnchorIndex === null) {
      return
    }

    this.container.style.cursor = ''
    this.draggingDrawingId = null
    this.draggingAnchorIndex = null

    if (this.didDrag) {
      this.onChange?.(this._drawings)
    }

    this.didDrag = false
  }

  handleClick(event: MouseEvent) {
    if (event.button !== 0 || this.didDrag) {
      return
    }

    const point = this.getPoint(event)
    if (!point) {
      return
    }

    if (this.activeTool) {
      const anchor = this.eventToAnchor(event)
      if (!anchor) {
        return
      }

      this.pendingAnchors = [...this.pendingAnchors, anchor]
      const requiredAnchors = this.activeTool === 'horizontal-line' ? 1 : 2
      this.draftCursorAnchor = anchor
      if (this.pendingAnchors.length >= requiredAnchors) {
        const nextDrawing = createDrawingFromDefaults(
          this.activeTool,
          createDrawingId(),
          this.pendingAnchors as SavedDrawing['anchors'],
          this.defaults,
        )
        this._drawings = [...this._drawings, nextDrawing]
        this.pendingAnchors = []
        this.draftCursorAnchor = null
        this.setSelectedDrawing(nextDrawing)
        this.primitive.requestRender()
        this.onChange?.(this._drawings)
      } else {
        this.primitive.requestRender()
      }
      return
    }

    const viewport = this.getViewport()
    if (!viewport) {
      return
    }

    const hit = hitTestDrawings(viewport, point, this._drawings)
    this.setSelectedDrawing(hit?.drawing ?? null)
  }

  handleContextMenu(event: MouseEvent) {
    const point = this.getPoint(event)
    if (!point) {
      return
    }

    const viewport = this.getViewport()
    if (!viewport) {
      return
    }

    const hit = hitTestDrawings(viewport, point, this._drawings)
    if (!hit) {
      this.clearSelection()
      this.onChartContextMenuRequest?.({ x: event.clientX, y: event.clientY })
      return
    }

    event.preventDefault()
    this.setSelectedDrawing(hit.drawing)
    this.onDrawingMenuRequest?.(
      { x: event.clientX, y: event.clientY },
      hit.drawing,
    )
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.pendingAnchors.length > 0) {
        this.pendingAnchors = []
        this.draftCursorAnchor = null
        this.primitive.requestRender()
      } else {
        this.clearSelection()
      }
      return
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedId) {
        event.preventDefault()
        this.removeSelectedDrawing()
      }
    }
  }

  private eventToAnchor(event: MouseEvent) {
    const point = this.getPoint(event)
    if (!point) {
      return null
    }

    const viewport = this.getViewport()
    if (!viewport) {
      return null
    }

    const time = viewport.coordinateToTime(point.x)
    const price = viewport.coordinateToPrice(point.y)
    if (time === null || price === null) {
      return null
    }

    return { time, price }
  }

  private getPoint(event: MouseEvent): DrawingPoint | null {
    const rect = this.container.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  private setSelectedDrawing(drawing: SavedDrawing | null) {
    this.selectedId = drawing?.id ?? null
    this.primitive.requestRender()
    this.onSelectionChange?.(drawing)
  }

  renderDraft(context: CanvasRenderingContext2D, viewport: DrawingViewport) {
    if (!this.activeTool || this.pendingAnchors.length === 0) {
      return
    }

    const firstAnchor = this.pendingAnchors[0]
    const firstPoint = anchorToPoint(viewport, firstAnchor)
    if (!firstPoint) {
      return
    }

    const draftAnchor = this.draftCursorAnchor ?? firstAnchor

    switch (this.activeTool) {
      case 'diagonal-line': {
        const previewDrawing = createDrawingFromDefaults(
          'diagonal-line',
          '__draft__',
          [firstAnchor, draftAnchor],
          this.defaults,
        ) as DiagonalLineDrawing
        renderDiagonalLine(context, viewport, previewDrawing, false)
        drawControlPoint(context, firstPoint, previewDrawing.color)
        break
      }
      case 'fib-retracement': {
        const previewDrawing = createDrawingFromDefaults(
          'fib-retracement',
          '__draft__',
          [firstAnchor, draftAnchor],
          this.defaults,
        ) as FibRetracementDrawing
        renderFibRetracement(context, viewport, previewDrawing, false)
        drawControlPoint(context, firstPoint, previewDrawing.color)
        break
      }
      default:
        break
    }
  }
}
