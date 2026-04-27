import type { Time } from 'lightweight-charts'

export type DrawingLineStyle = 0 | 1 | 2 | 3 | 4
export type DrawingLineWidth = 1 | 2 | 3 | 4
export type DrawingToolType =
  | 'horizontal-line'
  | 'diagonal-line'
  | 'fib-retracement'
export type EditableDrawingType = DrawingToolType

export interface DrawingAnchor {
  time: Time
  price: number
}

export interface DrawingLineAppearance {
  color: string
  lineWidth: DrawingLineWidth
  lineStyle: DrawingLineStyle
}

export interface LineDrawingOptions {
  extendLeft: boolean
  extendRight: boolean
}

export interface FibLevel {
  id: string
  value: number
  color: string
  visible: boolean
}

export interface FibDrawingOptions {
  extendLeft: boolean
  extendRight: boolean
  showPrices: boolean
  showPercentages: boolean
  levels: Array<FibLevel>
}

export interface HorizontalLineDrawing
  extends DrawingLineAppearance, LineDrawingOptions {
  id: string
  type: 'horizontal-line'
  anchors: [DrawingAnchor]
}

export interface DiagonalLineDrawing
  extends DrawingLineAppearance, LineDrawingOptions {
  id: string
  type: 'diagonal-line'
  anchors: [DrawingAnchor, DrawingAnchor]
}

export interface FibRetracementDrawing
  extends DrawingLineAppearance, FibDrawingOptions {
  id: string
  type: 'fib-retracement'
  anchors: [DrawingAnchor, DrawingAnchor]
}

export type SavedDrawing =
  | HorizontalLineDrawing
  | DiagonalLineDrawing
  | FibRetracementDrawing

export interface HorizontalLineDefaults
  extends DrawingLineAppearance, LineDrawingOptions {}

export interface DiagonalLineDefaults
  extends DrawingLineAppearance, LineDrawingOptions {}

export interface FibRetracementDefaults
  extends DrawingLineAppearance, FibDrawingOptions {}

export interface DrawingDefaults {
  horizontalLine: HorizontalLineDefaults
  diagonalLine: DiagonalLineDefaults
  fibRetracement: FibRetracementDefaults
}

export function isLineDrawing(
  drawing: SavedDrawing,
): drawing is HorizontalLineDrawing | DiagonalLineDrawing {
  return drawing.type === 'horizontal-line' || drawing.type === 'diagonal-line'
}

export function isFibDrawing(
  drawing: SavedDrawing,
): drawing is FibRetracementDrawing {
  return drawing.type === 'fib-retracement'
}

export function getDrawingToolLabel(tool: DrawingToolType) {
  switch (tool) {
    case 'horizontal-line':
      return 'Horizontal line'
    case 'diagonal-line':
      return 'Diagonal line'
    case 'fib-retracement':
      return 'Fib retracement'
  }
}
