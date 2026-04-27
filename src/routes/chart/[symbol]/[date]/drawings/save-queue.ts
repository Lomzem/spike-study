import type { SavedDrawing } from './types'

export class DrawingSaveQueue {
  private onFlush?: (drawings: Array<SavedDrawing>) => void
  private saveTimeout: number | null = null
  private pendingDrawings: Array<SavedDrawing> | null = null

  constructor(onFlush?: (drawings: Array<SavedDrawing>) => void) {
    this.onFlush = onFlush
  }

  schedule(drawings: Array<SavedDrawing>) {
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout)
    }

    this.pendingDrawings = drawings
    this.saveTimeout = window.setTimeout(() => {
      if (this.pendingDrawings) {
        this.onFlush?.(this.pendingDrawings)
      }

      this.pendingDrawings = null
      this.saveTimeout = null
    }, 500)
  }

  cancel() {
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = null
    this.pendingDrawings = null
  }
}
