import {
  cloneDrawingDefaults,
  cloneFibLevels,
  DEFAULT_DRAWING_DEFAULTS,
} from './defaults'
import type {
  DrawingDefaults,
  DrawingLineStyle,
  DrawingLineWidth,
  FibLevel,
  SavedDrawing,
} from './types'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeLineWidth(value: unknown): DrawingLineWidth {
  return value === 2 || value === 3 || value === 4 ? value : 1
}

function normalizeLineStyle(value: unknown): DrawingLineStyle {
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : 0
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function normalizeFibLevels(levels: unknown): Array<FibLevel> {
  if (!Array.isArray(levels)) {
    return cloneFibLevels(DEFAULT_DRAWING_DEFAULTS.fibRetracement.levels)
  }

  return levels
    .filter(
      (level): level is FibLevel =>
        typeof level === 'object' &&
        level !== null &&
        typeof level.id === 'string' &&
        isFiniteNumber(level.value) &&
        typeof level.color === 'string' &&
        typeof level.visible === 'boolean',
    )
    .map((level) => ({
      id: level.id,
      value: level.value,
      color: level.color,
      visible: level.visible,
    }))
    .sort((left, right) => left.value - right.value)
}

function normalizeAnchor(anchor: unknown) {
  if (
    typeof anchor !== 'object' ||
    anchor === null ||
    !('time' in anchor) ||
    !('price' in anchor) ||
    !isFiniteNumber(anchor.price)
  ) {
    return null
  }

  return {
    time: anchor.time,
    price: anchor.price,
  }
}

export function normalizeSavedDrawings(
  drawings: unknown,
): Array<SavedDrawing> | null {
  if (!Array.isArray(drawings)) {
    return null
  }

  return drawings
    .map((drawing) => {
      if (
        typeof drawing !== 'object' ||
        drawing === null ||
        typeof drawing.id !== 'string' ||
        typeof drawing.type !== 'string' ||
        !Array.isArray(drawing.anchors)
      ) {
        return null
      }

      const anchors = drawing.anchors
        .map((anchor: unknown) => normalizeAnchor(anchor))
        .filter(
          (
            anchor: ReturnType<typeof normalizeAnchor>,
          ): anchor is NonNullable<ReturnType<typeof normalizeAnchor>> =>
            anchor !== null,
        )

      if (drawing.type === 'horizontal-line' && anchors.length === 1) {
        return {
          id: drawing.id,
          type: drawing.type,
          anchors: [anchors[0]],
          color: normalizeColor(
            'color' in drawing ? drawing.color : null,
            DEFAULT_DRAWING_DEFAULTS.horizontalLine.color,
          ),
          lineWidth: normalizeLineWidth(
            'lineWidth' in drawing ? drawing.lineWidth : null,
          ),
          lineStyle: normalizeLineStyle(
            'lineStyle' in drawing ? drawing.lineStyle : null,
          ),
          extendLeft:
            'extendLeft' in drawing ? Boolean(drawing.extendLeft) : false,
          extendRight:
            'extendRight' in drawing ? Boolean(drawing.extendRight) : true,
        } satisfies SavedDrawing
      }

      if (drawing.type === 'diagonal-line' && anchors.length === 2) {
        return {
          id: drawing.id,
          type: drawing.type,
          anchors: [anchors[0], anchors[1]],
          color: normalizeColor(
            'color' in drawing ? drawing.color : null,
            DEFAULT_DRAWING_DEFAULTS.diagonalLine.color,
          ),
          lineWidth: normalizeLineWidth(
            'lineWidth' in drawing ? drawing.lineWidth : null,
          ),
          lineStyle: normalizeLineStyle(
            'lineStyle' in drawing ? drawing.lineStyle : null,
          ),
          extendLeft:
            'extendLeft' in drawing ? Boolean(drawing.extendLeft) : false,
          extendRight:
            'extendRight' in drawing ? Boolean(drawing.extendRight) : false,
        } satisfies SavedDrawing
      }

      if (drawing.type === 'fib-retracement' && anchors.length === 2) {
        return {
          id: drawing.id,
          type: drawing.type,
          anchors: [anchors[0], anchors[1]],
          color: normalizeColor(
            'color' in drawing ? drawing.color : null,
            DEFAULT_DRAWING_DEFAULTS.fibRetracement.color,
          ),
          lineWidth: normalizeLineWidth(
            'lineWidth' in drawing ? drawing.lineWidth : null,
          ),
          lineStyle: normalizeLineStyle(
            'lineStyle' in drawing ? drawing.lineStyle : null,
          ),
          extendLeft:
            'extendLeft' in drawing ? Boolean(drawing.extendLeft) : false,
          extendRight:
            'extendRight' in drawing ? Boolean(drawing.extendRight) : true,
          showPrices:
            'showPrices' in drawing ? Boolean(drawing.showPrices) : true,
          showPercentages:
            'showPercentages' in drawing
              ? Boolean(drawing.showPercentages)
              : true,
          levels: normalizeFibLevels(
            'levels' in drawing ? drawing.levels : null,
          ),
        } satisfies SavedDrawing
      }

      return null
    })
    .filter((drawing): drawing is SavedDrawing => drawing !== null)
}

export function normalizeDrawingDefaults(defaults: unknown): DrawingDefaults {
  if (typeof defaults !== 'object' || defaults === null) {
    return cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS)
  }

  return {
    horizontalLine: {
      color: normalizeColor(
        'horizontalLine' in defaults &&
          typeof defaults.horizontalLine === 'object' &&
          defaults.horizontalLine !== null &&
          'color' in defaults.horizontalLine
          ? defaults.horizontalLine.color
          : null,
        DEFAULT_DRAWING_DEFAULTS.horizontalLine.color,
      ),
      lineWidth: normalizeLineWidth(
        'horizontalLine' in defaults &&
          typeof defaults.horizontalLine === 'object' &&
          defaults.horizontalLine !== null &&
          'lineWidth' in defaults.horizontalLine
          ? defaults.horizontalLine.lineWidth
          : null,
      ),
      lineStyle: normalizeLineStyle(
        'horizontalLine' in defaults &&
          typeof defaults.horizontalLine === 'object' &&
          defaults.horizontalLine !== null &&
          'lineStyle' in defaults.horizontalLine
          ? defaults.horizontalLine.lineStyle
          : null,
      ),
      extendLeft:
        'horizontalLine' in defaults &&
        typeof defaults.horizontalLine === 'object' &&
        defaults.horizontalLine !== null &&
        'extendLeft' in defaults.horizontalLine
          ? Boolean(defaults.horizontalLine.extendLeft)
          : DEFAULT_DRAWING_DEFAULTS.horizontalLine.extendLeft,
      extendRight:
        'horizontalLine' in defaults &&
        typeof defaults.horizontalLine === 'object' &&
        defaults.horizontalLine !== null &&
        'extendRight' in defaults.horizontalLine
          ? Boolean(defaults.horizontalLine.extendRight)
          : DEFAULT_DRAWING_DEFAULTS.horizontalLine.extendRight,
    },
    diagonalLine: {
      color: normalizeColor(
        'diagonalLine' in defaults &&
          typeof defaults.diagonalLine === 'object' &&
          defaults.diagonalLine !== null &&
          'color' in defaults.diagonalLine
          ? defaults.diagonalLine.color
          : null,
        DEFAULT_DRAWING_DEFAULTS.diagonalLine.color,
      ),
      lineWidth: normalizeLineWidth(
        'diagonalLine' in defaults &&
          typeof defaults.diagonalLine === 'object' &&
          defaults.diagonalLine !== null &&
          'lineWidth' in defaults.diagonalLine
          ? defaults.diagonalLine.lineWidth
          : null,
      ),
      lineStyle: normalizeLineStyle(
        'diagonalLine' in defaults &&
          typeof defaults.diagonalLine === 'object' &&
          defaults.diagonalLine !== null &&
          'lineStyle' in defaults.diagonalLine
          ? defaults.diagonalLine.lineStyle
          : null,
      ),
      extendLeft:
        'diagonalLine' in defaults &&
        typeof defaults.diagonalLine === 'object' &&
        defaults.diagonalLine !== null &&
        'extendLeft' in defaults.diagonalLine
          ? Boolean(defaults.diagonalLine.extendLeft)
          : DEFAULT_DRAWING_DEFAULTS.diagonalLine.extendLeft,
      extendRight:
        'diagonalLine' in defaults &&
        typeof defaults.diagonalLine === 'object' &&
        defaults.diagonalLine !== null &&
        'extendRight' in defaults.diagonalLine
          ? Boolean(defaults.diagonalLine.extendRight)
          : DEFAULT_DRAWING_DEFAULTS.diagonalLine.extendRight,
    },
    fibRetracement: {
      color: normalizeColor(
        'fibRetracement' in defaults &&
          typeof defaults.fibRetracement === 'object' &&
          defaults.fibRetracement !== null &&
          'color' in defaults.fibRetracement
          ? defaults.fibRetracement.color
          : null,
        DEFAULT_DRAWING_DEFAULTS.fibRetracement.color,
      ),
      lineWidth: normalizeLineWidth(
        'fibRetracement' in defaults &&
          typeof defaults.fibRetracement === 'object' &&
          defaults.fibRetracement !== null &&
          'lineWidth' in defaults.fibRetracement
          ? defaults.fibRetracement.lineWidth
          : null,
      ),
      lineStyle: normalizeLineStyle(
        'fibRetracement' in defaults &&
          typeof defaults.fibRetracement === 'object' &&
          defaults.fibRetracement !== null &&
          'lineStyle' in defaults.fibRetracement
          ? defaults.fibRetracement.lineStyle
          : null,
      ),
      extendLeft:
        'fibRetracement' in defaults &&
        typeof defaults.fibRetracement === 'object' &&
        defaults.fibRetracement !== null &&
        'extendLeft' in defaults.fibRetracement
          ? Boolean(defaults.fibRetracement.extendLeft)
          : DEFAULT_DRAWING_DEFAULTS.fibRetracement.extendLeft,
      extendRight:
        'fibRetracement' in defaults &&
        typeof defaults.fibRetracement === 'object' &&
        defaults.fibRetracement !== null &&
        'extendRight' in defaults.fibRetracement
          ? Boolean(defaults.fibRetracement.extendRight)
          : DEFAULT_DRAWING_DEFAULTS.fibRetracement.extendRight,
      showPrices:
        'fibRetracement' in defaults &&
        typeof defaults.fibRetracement === 'object' &&
        defaults.fibRetracement !== null &&
        'showPrices' in defaults.fibRetracement
          ? Boolean(defaults.fibRetracement.showPrices)
          : DEFAULT_DRAWING_DEFAULTS.fibRetracement.showPrices,
      showPercentages:
        'fibRetracement' in defaults &&
        typeof defaults.fibRetracement === 'object' &&
        defaults.fibRetracement !== null &&
        'showPercentages' in defaults.fibRetracement
          ? Boolean(defaults.fibRetracement.showPercentages)
          : DEFAULT_DRAWING_DEFAULTS.fibRetracement.showPercentages,
      levels: normalizeFibLevels(
        'fibRetracement' in defaults &&
          typeof defaults.fibRetracement === 'object' &&
          defaults.fibRetracement !== null &&
          'levels' in defaults.fibRetracement
          ? defaults.fibRetracement.levels
          : null,
      ),
    },
  }
}
