import type {
  DrawingAnchor,
  DiagonalLineDefaults,
  DrawingDefaults,
  FibLevel,
  FibRetracementDefaults,
  FibRetracementDrawing,
  HorizontalLineDefaults,
  HorizontalLineDrawing,
  DiagonalLineDrawing,
  SavedDrawing,
} from './types'

export const DEFAULT_FIB_LEVELS: Array<FibLevel> = [
  { id: 'fib-0236', value: 0.236, color: '#f97316', visible: true },
  { id: 'fib-0500', value: 0.5, color: '#22c55e', visible: true },
  { id: 'fib-0618', value: 0.618, color: '#60a5fa', visible: true },
]

export const DEFAULT_HORIZONTAL_LINE: HorizontalLineDefaults = {
  color: '#c4a46a',
  lineWidth: 2,
  lineStyle: 0,
  extendLeft: false,
  extendRight: true,
}

export const DEFAULT_DIAGONAL_LINE: DiagonalLineDefaults = {
  color: '#5a8a5c',
  lineWidth: 2,
  lineStyle: 0,
  extendLeft: false,
  extendRight: false,
}

export const DEFAULT_FIB_RETRACEMENT: FibRetracementDefaults = {
  color: '#c4783a',
  lineWidth: 1,
  lineStyle: 2,
  extendLeft: false,
  extendRight: true,
  showPrices: true,
  showPercentages: true,
  levels: cloneFibLevels(DEFAULT_FIB_LEVELS),
}

export const DEFAULT_DRAWING_DEFAULTS: DrawingDefaults = {
  horizontalLine: { ...DEFAULT_HORIZONTAL_LINE },
  diagonalLine: { ...DEFAULT_DIAGONAL_LINE },
  fibRetracement: cloneFibDefaults(DEFAULT_FIB_RETRACEMENT),
}

export function cloneFibLevels(levels: Array<FibLevel>) {
  return levels.map((level) => ({ ...level }))
}

export function cloneFibDefaults(
  defaults: FibRetracementDefaults,
): FibRetracementDefaults {
  return {
    ...defaults,
    levels: cloneFibLevels(defaults.levels),
  }
}

export function cloneDrawingDefaults(
  defaults: DrawingDefaults,
): DrawingDefaults {
  return {
    horizontalLine: { ...defaults.horizontalLine },
    diagonalLine: { ...defaults.diagonalLine },
    fibRetracement: cloneFibDefaults(defaults.fibRetracement),
  }
}

export function createDrawingFromDefaults(
  type: SavedDrawing['type'],
  id: string,
  anchors: Array<DrawingAnchor>,
  defaults: DrawingDefaults,
): SavedDrawing {
  switch (type) {
    case 'horizontal-line':
      return {
        id,
        type,
        anchors: [anchors[0]] as HorizontalLineDrawing['anchors'],
        ...defaults.horizontalLine,
      }
    case 'diagonal-line':
      return {
        id,
        type,
        anchors: [anchors[0], anchors[1]] as DiagonalLineDrawing['anchors'],
        ...defaults.diagonalLine,
      }
    case 'fib-retracement':
      return {
        id,
        type,
        anchors: [anchors[0], anchors[1]] as FibRetracementDrawing['anchors'],
        ...cloneFibDefaults(defaults.fibRetracement),
      }
  }
}

export function defaultsMatchHorizontalLine(
  left: HorizontalLineDefaults,
  right: HorizontalLineDefaults,
) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function defaultsMatchDiagonalLine(
  left: DiagonalLineDefaults,
  right: DiagonalLineDefaults,
) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function defaultsMatchFib(
  left: FibRetracementDefaults,
  right: FibRetracementDefaults,
) {
  return JSON.stringify(left) === JSON.stringify(right)
}
