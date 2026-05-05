import { describe, expect, it } from 'vitest'
import { getCurrentDrawingDefaults } from './current-defaults'
import { cloneDrawingDefaults, DEFAULT_DRAWING_DEFAULTS } from './defaults'

describe('getCurrentDrawingDefaults', () => {
  it('prefers a local override until persisted defaults catch up', () => {
    const persistedDefaults = cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS)
    const localOverride = cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS)

    localOverride.horizontalLine.color = '#ff0000'

    const effectiveBeforeSync = getCurrentDrawingDefaults(
      persistedDefaults,
      localOverride,
    )

    expect(effectiveBeforeSync.horizontalLine.color).toBe('#ff0000')
    expect(effectiveBeforeSync.diagonalLine.color).toBe(
      DEFAULT_DRAWING_DEFAULTS.diagonalLine.color,
    )

    const persistedDefaultsAfterSync = cloneDrawingDefaults(
      DEFAULT_DRAWING_DEFAULTS,
    )
    persistedDefaultsAfterSync.horizontalLine.color = '#ff0000'

    const effectiveAfterSync = getCurrentDrawingDefaults(
      persistedDefaultsAfterSync,
      localOverride,
    )

    expect(effectiveAfterSync.horizontalLine.color).toBe('#ff0000')
    expect(effectiveAfterSync).not.toBe(localOverride)
    expect(effectiveAfterSync).not.toBe(persistedDefaultsAfterSync)
  })
})
