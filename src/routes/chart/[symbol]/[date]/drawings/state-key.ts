import type { SavedDrawing } from './types'

export function buildDrawingStateKey(
  symbol: string,
  drawings: Array<SavedDrawing>,
) {
  const stableDrawings = drawings.map((drawing) => [
    drawing.id,
    drawing.type,
    drawing.anchors.map((anchor) => [anchor.time, anchor.price]),
    drawing.color,
    drawing.lineWidth,
    drawing.lineStyle,
    'extendLeft' in drawing ? drawing.extendLeft : false,
    'extendRight' in drawing ? drawing.extendRight : false,
    drawing.type === 'fib-retracement'
      ? [
          drawing.showPrices,
          drawing.showPercentages,
          drawing.levels.map((level) => [
            level.id,
            level.value,
            level.color,
            level.visible,
          ]),
        ]
      : null,
  ])

  return `${symbol}:${JSON.stringify(stableDrawings)}`
}
