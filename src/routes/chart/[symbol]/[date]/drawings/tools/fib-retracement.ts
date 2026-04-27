import {
  applyCanvasLineStyle,
  anchorToPoint,
  drawControlPoint,
  drawLabel,
  formatPercent,
  getFibLevelPrice,
  type DrawingViewport,
} from '../primitive-helpers'
import type { FibRetracementDrawing } from '../types'

export function renderFibRetracement(
  context: CanvasRenderingContext2D,
  viewport: DrawingViewport,
  drawing: FibRetracementDrawing,
  selected: boolean,
) {
  const start = anchorToPoint(viewport, drawing.anchors[0])
  const end = anchorToPoint(viewport, drawing.anchors[1])
  if (!start || !end) {
    return
  }

  const minX = drawing.extendLeft ? 0 : Math.min(start.x, end.x)
  const maxX = drawing.extendRight ? viewport.width : Math.max(start.x, end.x)

  context.save()
  context.lineWidth = selected ? drawing.lineWidth + 1 : drawing.lineWidth
  applyCanvasLineStyle(context, drawing.lineStyle)

  for (const level of drawing.levels) {
    if (!level.visible) {
      continue
    }

    const y = viewport.priceToCoordinate(getFibLevelPrice(level, drawing))
    if (y === null) {
      continue
    }

    context.strokeStyle = level.color
    context.beginPath()
    context.moveTo(minX, y)
    context.lineTo(maxX, y)
    context.stroke()

    const parts = []
    if (drawing.showPercentages) {
      parts.push(formatPercent(level.value))
    }
    if (drawing.showPrices) {
      parts.push(getFibLevelPrice(level, drawing).toFixed(2))
    }
    if (parts.length > 0) {
      drawLabel(context, { x: maxX, y }, parts.join('  '), level.color)
    }
  }

  context.strokeStyle = drawing.color
  context.beginPath()
  context.moveTo(start.x, start.y)
  context.lineTo(end.x, end.y)
  context.stroke()

  if (selected) {
    drawControlPoint(context, start, drawing.color)
    drawControlPoint(context, end, drawing.color)
  }

  context.restore()
}
