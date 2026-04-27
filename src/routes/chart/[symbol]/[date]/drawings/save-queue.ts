import type { SavedDrawing } from './types'

export class DrawingSaveQueue {
  private onFlush?: (drawings: Array<SavedDrawing>) => Promise<void> | void
  private pendingDrawings: Array<SavedDrawing> | null = null
  private flushPromise: Promise<void> | null = null

  constructor(
    onFlush?: (drawings: Array<SavedDrawing>) => Promise<void> | void,
  ) {
    this.onFlush = onFlush
  }

  schedule(drawings: Array<SavedDrawing>) {
    this.pendingDrawings = drawings

    if (!this.flushPromise) {
      this.flushPromise = this.runFlushLoop()
    }
  }

  flush() {
    if (!this.flushPromise && this.pendingDrawings) {
      this.flushPromise = this.runFlushLoop()
    }
  }

  cancel() {
    this.pendingDrawings = null
  }

  private async runFlushLoop() {
    try {
      while (this.pendingDrawings) {
        const drawings = this.pendingDrawings
        this.pendingDrawings = null
        await this.onFlush?.(drawings)
      }
    } finally {
      this.flushPromise = null

      if (this.pendingDrawings) {
        this.flushPromise = this.runFlushLoop()
      }
    }
  }
}
