import type { DrawingViewport, DrawingPoint } from '../primitive-helpers'
import {
  applyCanvasLineStyle,
  anchorToPoint,
  drawControlPoint,
} from '../primitive-helpers'
import type { HorizontalLineDrawing } from '../types'

export function renderHorizontalLine(
  context: CanvasRenderingContext2D,
  viewport: DrawingViewport,
  drawing: HorizontalLineDrawing,
  selected: boolean,
) {
  const point = anchorToPoint(viewport, drawing.anchors[0])
  if (!point) {
    return
  }

  context.save()
  context.strokeStyle = drawing.color
  context.lineWidth = selected ? drawing.lineWidth + 1 : drawing.lineWidth
  applyCanvasLineStyle(context, drawing.lineStyle)
  const startX = drawing.extendLeft ? 0 : point.x
  const endX = drawing.extendRight ? viewport.width : point.x
  context.beginPath()
  context.moveTo(startX, point.y)
  context.lineTo(endX, point.y)
  context.stroke()
  if (selected) {
    drawControlPoint(context, point, drawing.color)
  }
  context.restore()
}

export function getHorizontalLineLabelPoint(
  viewport: DrawingViewport,
  point: DrawingPoint,
) {
  return { x: viewport.width - 8, y: point.y - 4 }
}
