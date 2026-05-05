import { buildDrawingDefaultsKey } from './default-persistence'
import { cloneDrawingDefaults } from './defaults'
import type { DrawingDefaults } from './types'

export function getCurrentDrawingDefaults(
  drawingDefaults: DrawingDefaults,
  localDefaultsOverride: DrawingDefaults | null,
) {
  if (
    localDefaultsOverride !== null &&
    buildDrawingDefaultsKey(localDefaultsOverride) !==
      buildDrawingDefaultsKey(drawingDefaults)
  ) {
    return cloneDrawingDefaults(localDefaultsOverride)
  }

  return cloneDrawingDefaults(drawingDefaults)
}
