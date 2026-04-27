import {
  applyCanvasLineStyle,
  anchorToPoint,
  drawControlPoint,
  extendSegment,
  type DrawingViewport,
} from '../primitive-helpers'
import type { DiagonalLineDrawing } from '../types'

export function renderDiagonalLine(
  context: CanvasRenderingContext2D,
  viewport: DrawingViewport,
  drawing: DiagonalLineDrawing,
  selected: boolean,
) {
  const start = anchorToPoint(viewport, drawing.anchors[0])
  const end = anchorToPoint(viewport, drawing.anchors[1])
  if (!start || !end) {
    return
  }

  const segment = extendSegment(
    start,
    end,
    viewport,
    drawing.extendLeft,
    drawing.extendRight,
  )

  context.save()
  context.strokeStyle = drawing.color
  context.lineWidth = selected ? drawing.lineWidth + 1 : drawing.lineWidth
  applyCanvasLineStyle(context, drawing.lineStyle)
  context.beginPath()
  context.moveTo(segment.start.x, segment.start.y)
  context.lineTo(segment.end.x, segment.end.y)
  context.stroke()
  if (selected) {
    drawControlPoint(context, start, drawing.color)
    drawControlPoint(context, end, drawing.color)
  }
  context.restore()
}
