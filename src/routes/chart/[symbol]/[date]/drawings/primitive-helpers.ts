import {
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type {
  DiagonalLineDrawing,
  DrawingAnchor,
  DrawingLineStyle,
  FibLevel,
  FibRetracementDrawing,
  HorizontalLineDrawing,
  SavedDrawing,
} from './types'

export interface DrawingPoint {
  x: number
  y: number
}

export interface DrawingViewport {
  width: number
  height: number
  timeToCoordinate: (time: Time) => number | null
  coordinateToTime: (coordinate: number) => Time | null
  priceToCoordinate: (price: number) => number | null
  coordinateToPrice: (coordinate: number) => number | null
}

export interface DrawingHit {
  drawing: SavedDrawing
  anchorIndex: number | null
}

const HIT_TOLERANCE_PX = 6
const CONTROL_POINT_RADIUS = 5

export function createDrawingId() {
  return crypto.randomUUID()
}

export function createViewport(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
  width: number,
  height: number,
): DrawingViewport {
  const timeScale = chart.timeScale()

  return {
    width,
    height,
    timeToCoordinate: (time) => timeScale.timeToCoordinate(time),
    coordinateToTime: (coordinate) => timeScale.coordinateToTime(coordinate),
    priceToCoordinate: (price) => series.priceToCoordinate(price),
    coordinateToPrice: (coordinate) => series.coordinateToPrice(coordinate),
  }
}

export function anchorToPoint(
  viewport: DrawingViewport,
  anchor: DrawingAnchor,
): DrawingPoint | null {
  const x = viewport.timeToCoordinate(anchor.time)
  const y = viewport.priceToCoordinate(anchor.price)
  if (x === null || y === null) {
    return null
  }

  return { x, y }
}

export function applyCanvasLineStyle(
  context: CanvasRenderingContext2D,
  lineStyle: DrawingLineStyle,
) {
  switch (lineStyle) {
    case LineStyle.Dashed:
      context.setLineDash([8, 6])
      break
    case LineStyle.Dotted:
      context.setLineDash([2, 4])
      break
    case LineStyle.LargeDashed:
      context.setLineDash([12, 8])
      break
    case LineStyle.SparseDotted:
      context.setLineDash([2, 8])
      break
    default:
      context.setLineDash([])
  }
}

export function drawControlPoint(
  context: CanvasRenderingContext2D,
  point: DrawingPoint,
  color: string,
) {
  context.save()
  context.fillStyle = '#1a1610'
  context.strokeStyle = color
  context.lineWidth = 2
  context.beginPath()
  context.arc(point.x, point.y, CONTROL_POINT_RADIUS, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.restore()
}

export function drawLabel(
  context: CanvasRenderingContext2D,
  point: DrawingPoint,
  text: string,
  color: string,
) {
  context.save()
  context.font = '11px var(--font-sans)'
  context.textAlign = 'right'
  context.textBaseline = 'bottom'
  const metrics = context.measureText(text)
  const width = metrics.width + 10
  const height = 18
  context.fillStyle = `${color}dd`
  context.fillRect(point.x - width, point.y - height, width, height)
  context.fillStyle = '#f5efe5'
  context.fillText(text, point.x - 5, point.y - 5)
  context.restore()
}

export function extendSegment(
  start: DrawingPoint,
  end: DrawingPoint,
  viewport: DrawingViewport,
  extendLeft: boolean,
  extendRight: boolean,
) {
  if (!extendLeft && !extendRight) {
    return { start, end }
  }

  const dx = end.x - start.x
  const dy = end.y - start.y

  if (Math.abs(dx) < 0.0001) {
    return {
      start: extendLeft ? { x: start.x, y: 0 } : start,
      end: extendRight ? { x: end.x, y: viewport.height } : end,
    }
  }

  const slope = dy / dx
  const intercept = start.y - slope * start.x
  let nextStart = { ...start }
  let nextEnd = { ...end }

  if (extendLeft) {
    const yAtZero = intercept
    if (yAtZero >= 0 && yAtZero <= viewport.height) {
      nextStart = { x: 0, y: yAtZero }
    } else if (yAtZero < 0) {
      nextStart = { x: -intercept / slope, y: 0 }
    } else {
      nextStart = {
        x: (viewport.height - intercept) / slope,
        y: viewport.height,
      }
    }
  }

  if (extendRight) {
    const yAtWidth = slope * viewport.width + intercept
    if (yAtWidth >= 0 && yAtWidth <= viewport.height) {
      nextEnd = { x: viewport.width, y: yAtWidth }
    } else if (yAtWidth < 0) {
      nextEnd = { x: -intercept / slope, y: 0 }
    } else {
      nextEnd = {
        x: (viewport.height - intercept) / slope,
        y: viewport.height,
      }
    }
  }

  return {
    start: nextStart,
    end: nextEnd,
  }
}

function distanceToPoint(left: DrawingPoint, right: DrawingPoint) {
  const dx = left.x - right.x
  const dy = left.y - right.y
  return Math.sqrt(dx * dx + dy * dy)
}

function distanceToLineSegment(
  point: DrawingPoint,
  start: DrawingPoint,
  end: DrawingPoint,
) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) {
    return distanceToPoint(point, start)
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    ),
  )
  return distanceToPoint(point, {
    x: start.x + dx * t,
    y: start.y + dy * t,
  })
}

function distanceToInfiniteLine(
  point: DrawingPoint,
  start: DrawingPoint,
  end: DrawingPoint,
) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) {
    return distanceToPoint(point, start)
  }

  return (
    Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) /
    Math.sqrt(lengthSquared)
  )
}

export function getControlPoints(
  viewport: DrawingViewport,
  drawing: SavedDrawing,
) {
  return drawing.anchors
    .map((anchor, index) => {
      const point = anchorToPoint(viewport, anchor)
      return point ? { index, point } : null
    })
    .filter(
      (controlPoint): controlPoint is { index: number; point: DrawingPoint } =>
        controlPoint !== null,
    )
}

export function hitTestDrawings(
  viewport: DrawingViewport,
  point: DrawingPoint,
  drawings: Array<SavedDrawing>,
): DrawingHit | null {
  const ordered = [...drawings].reverse()

  for (const drawing of ordered) {
    const controlPoint = getControlPoints(viewport, drawing).find(
      ({ point: controlPoint }) =>
        distanceToPoint(point, controlPoint) <=
        HIT_TOLERANCE_PX + CONTROL_POINT_RADIUS,
    )
    if (controlPoint) {
      return { drawing, anchorIndex: controlPoint.index }
    }

    if (
      drawing.type === 'horizontal-line' &&
      hitHorizontalLine(viewport, point, drawing)
    ) {
      return { drawing, anchorIndex: null }
    }

    if (
      drawing.type === 'diagonal-line' &&
      hitDiagonalLine(viewport, point, drawing)
    ) {
      return { drawing, anchorIndex: null }
    }

    if (
      drawing.type === 'fib-retracement' &&
      hitFib(viewport, point, drawing)
    ) {
      return { drawing, anchorIndex: null }
    }
  }

  return null
}

export function hitHorizontalLine(
  viewport: DrawingViewport,
  point: DrawingPoint,
  drawing: HorizontalLineDrawing,
) {
  const anchor = drawing.anchors[0]
  const y = viewport.priceToCoordinate(anchor.price)
  if (y === null) {
    return false
  }

  return Math.abs(point.y - y) <= HIT_TOLERANCE_PX
}

export function hitDiagonalLine(
  viewport: DrawingViewport,
  point: DrawingPoint,
  drawing: DiagonalLineDrawing,
) {
  const start = anchorToPoint(viewport, drawing.anchors[0])
  const end = anchorToPoint(viewport, drawing.anchors[1])
  if (!start || !end) {
    return false
  }

  const distance =
    drawing.extendLeft || drawing.extendRight
      ? distanceToInfiniteLine(point, start, end)
      : distanceToLineSegment(point, start, end)

  return distance <= HIT_TOLERANCE_PX
}

export function getFibLevelPrice(
  level: FibLevel,
  drawing: FibRetracementDrawing,
) {
  const [start, end] = drawing.anchors
  return start.price + (end.price - start.price) * level.value
}

export function hitFib(
  viewport: DrawingViewport,
  point: DrawingPoint,
  drawing: FibRetracementDrawing,
) {
  const left = anchorToPoint(viewport, drawing.anchors[0])
  const right = anchorToPoint(viewport, drawing.anchors[1])
  if (!left || !right) {
    return false
  }

  const minX = drawing.extendLeft ? 0 : Math.min(left.x, right.x)
  const maxX = drawing.extendRight ? viewport.width : Math.max(left.x, right.x)

  if (point.x < minX - HIT_TOLERANCE_PX || point.x > maxX + HIT_TOLERANCE_PX) {
    return false
  }

  return drawing.levels.some((level) => {
    if (!level.visible) {
      return false
    }

    const y = viewport.priceToCoordinate(getFibLevelPrice(level, drawing))
    return y !== null && Math.abs(point.y - y) <= HIT_TOLERANCE_PX
  })
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(2).replace(/\.00$/, '')}%`
}
