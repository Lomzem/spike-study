import type { DrawingViewport } from '../primitive-helpers'
import {
  applyCanvasLineStyle,
  anchorToPoint,
  drawControlPoint,
} from '../primitive-helpers'
import type { HorizontalLineDrawing } from '../types'

export function getHorizontalLineY(
  viewport: DrawingViewport,
  drawing: HorizontalLineDrawing,
) {
  return viewport.priceToCoordinate(drawing.anchors[0].price)
}

export function renderHorizontalLine(
  context: CanvasRenderingContext2D,
  viewport: DrawingViewport,
  drawing: HorizontalLineDrawing,
  selected: boolean,
) {
  const y = getHorizontalLineY(viewport, drawing)
  if (y === null) {
    return
  }

  const point = anchorToPoint(viewport, drawing.anchors[0])

  context.save()
  context.strokeStyle = drawing.color
  context.lineWidth = selected ? drawing.lineWidth + 1 : drawing.lineWidth
  applyCanvasLineStyle(context, drawing.lineStyle)
  const anchorX = point?.x ?? viewport.width / 2
  const startX = drawing.extendLeft ? 0 : anchorX
  const endX = drawing.extendRight ? viewport.width : anchorX
  context.beginPath()
  context.moveTo(startX, y)
  context.lineTo(endX, y)
  context.stroke()
  if (selected && point) {
    drawControlPoint(context, point, drawing.color)
  }
  context.restore()
}

export function getHorizontalLineLabelPoint(
  viewport: DrawingViewport,
  y: number,
) {
  return { x: viewport.width - 8, y: y - 4 }
}
