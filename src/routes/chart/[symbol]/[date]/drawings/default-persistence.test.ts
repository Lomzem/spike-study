import { describe, expect, it } from 'vitest'
import {
  buildDrawingDefaultsKey,
  getLiveDrawingDefaults,
} from './default-persistence'
import { cloneDrawingDefaults, DEFAULT_DRAWING_DEFAULTS } from './defaults'

describe('getLiveDrawingDefaults', () => {
  it('keeps updated defaults live until remote data catches up', () => {
    const remoteDefaults = cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS)
    const optimisticDefaults = cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS)
    const pendingDefaults = cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS)

    optimisticDefaults.horizontalLine.color = '#ff0000'
    pendingDefaults.horizontalLine.color = '#ff0000'

    const remoteKey = buildDrawingDefaultsKey(remoteDefaults)
    const optimisticKey = buildDrawingDefaultsKey(optimisticDefaults)

    expect(
      getLiveDrawingDefaults({
        normalizedDefaults: remoteDefaults,
        normalizedDefaultsKey: remoteKey,
        optimisticDefaults,
        pendingDefaults,
        awaitingRemoteDefaultsKey: optimisticKey,
      }).horizontalLine.color,
    ).toBe('#ff0000')

    expect(
      getLiveDrawingDefaults({
        normalizedDefaults: remoteDefaults,
        normalizedDefaultsKey: remoteKey,
        optimisticDefaults,
        pendingDefaults: null,
        awaitingRemoteDefaultsKey: optimisticKey,
      }).horizontalLine.color,
    ).toBe('#ff0000')

    expect(
      getLiveDrawingDefaults({
        normalizedDefaults: remoteDefaults,
        normalizedDefaultsKey: remoteKey,
        optimisticDefaults,
        pendingDefaults: null,
        awaitingRemoteDefaultsKey: null,
      }).horizontalLine.color,
    ).toBe(DEFAULT_DRAWING_DEFAULTS.horizontalLine.color)
  })
})
