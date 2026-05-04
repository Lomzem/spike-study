import type {
  DiagonalLineDrawing,
  FibLevel,
  FibRetracementDrawing,
  HorizontalLineDrawing,
  SavedDrawing,
} from './types'

function cloneDrawingTime(time: SavedDrawing['anchors'][number]['time']) {
  return typeof time === 'object' && time !== null ? { ...time } : time
}

function cloneDrawingAnchor(anchor: SavedDrawing['anchors'][number]) {
  return {
    time: cloneDrawingTime(anchor.time),
    price: anchor.price,
  }
}

function cloneFibLevel(level: FibLevel): FibLevel {
  return {
    id: level.id,
    value: level.value,
    color: level.color,
    visible: level.visible,
  }
}

export function cloneSavedDrawing<T extends SavedDrawing>(drawing: T): T {
  switch (drawing.type) {
    case 'horizontal-line': {
      const anchors: HorizontalLineDrawing['anchors'] = [
        cloneDrawingAnchor(drawing.anchors[0]),
      ]

      return {
        id: drawing.id,
        type: drawing.type,
        anchors,
        color: drawing.color,
        lineWidth: drawing.lineWidth,
        lineStyle: drawing.lineStyle,
        extendLeft: drawing.extendLeft,
        extendRight: drawing.extendRight,
      } as T
    }
    case 'diagonal-line': {
      const anchors: DiagonalLineDrawing['anchors'] = [
        cloneDrawingAnchor(drawing.anchors[0]),
        cloneDrawingAnchor(drawing.anchors[1]),
      ]

      return {
        id: drawing.id,
        type: drawing.type,
        anchors,
        color: drawing.color,
        lineWidth: drawing.lineWidth,
        lineStyle: drawing.lineStyle,
        extendLeft: drawing.extendLeft,
        extendRight: drawing.extendRight,
      } as T
    }
    case 'fib-retracement': {
      const anchors: FibRetracementDrawing['anchors'] = [
        cloneDrawingAnchor(drawing.anchors[0]),
        cloneDrawingAnchor(drawing.anchors[1]),
      ]

      return {
        id: drawing.id,
        type: drawing.type,
        anchors,
        color: drawing.color,
        lineWidth: drawing.lineWidth,
        lineStyle: drawing.lineStyle,
        extendLeft: drawing.extendLeft,
        extendRight: drawing.extendRight,
        showPrices: drawing.showPrices,
        showPercentages: drawing.showPercentages,
        levels: drawing.levels.map(cloneFibLevel),
      } as T
    }
  }
}

export function cloneSavedDrawings<T extends SavedDrawing>(drawings: Array<T>) {
  return drawings.map((drawing) => cloneSavedDrawing(drawing))
}
