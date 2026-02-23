# UserPriceLines Plugin

## How it connects to useChart

### The only integration point: `useChart.ts`

The original `useChart` hook creates a chart and a candlestick series. The plugin hooks in with just 3 lines:

**After creating the series** (`useChart.ts:85-87`):

```ts
const userPriceLines = new UserPriceLines(chart, candlestickSeries, {
  color: '#4C9AFF',
})
```

**In the cleanup return** (`useChart.ts:90`):

```ts
userPriceLines.remove()
```

That's it. The plugin receives the chart and series objects that `useChart` already creates, and manages its own lifecycle from there.

## How the plugin works internally

`UserPriceLines` is a plain TypeScript class with no React dependency. It does everything through DOM events on the chart element:

1. **Constructor** — Takes the `chart` and `series` refs, attaches `mousedown` on the chart element, and `mousemove`/`mouseup`/`keydown` on `window`. Sets crosshair to `Normal` mode (required for `coordinateToPrice` to return accurate values).

2. **Click to create** — On `mousedown`, it records the Y position. On `mouseup`, if the mouse didn't move more than 3px (not a drag) and didn't hit an existing line, it calls `series.coordinateToPrice(y)` to convert the pixel Y to a price, then `series.createPriceLine()` — a built-in lightweight-charts API that draws a horizontal line at a given price. The returned `IPriceLine` object is stored in `this._lines`.

3. **Click to select** — On `mousedown`, it checks if Y is within 5px of any existing line's coordinate (via `series.priceToCoordinate(line.options().price)`). If so, it sets `this._dragging`. On `mouseup` without movement, it calls `_selectLine()` which changes the line's color to red via `line.applyOptions()`.

4. **Drag to relocate** — If mousedown hit a line and the mouse moves more than 3px, `_didDrag` flips to true. During `mousemove`, it continuously updates the line's price with `line.applyOptions({ price })`. Chart scrolling/scaling is temporarily disabled so the drag doesn't fight with panning.

5. **Delete/Backspace to remove** — The `keydown` listener checks if a line is selected, then calls `series.removePriceLine(line)` (another built-in API) and removes it from the internal array.

6. **Escape to deselect** — Calls `_selectLine(null)` which restores the previous line's original color.

7. **`remove()`** — Removes all DOM event listeners. Called by `useChart`'s cleanup function when the component unmounts or the effect re-runs.

## Key lightweight-charts APIs used

- `series.coordinateToPrice(y)` — pixel Y to price number
- `series.priceToCoordinate(price)` — price number to pixel Y
- `series.createPriceLine(options)` — creates a built-in horizontal line, returns `IPriceLine`
- `series.removePriceLine(line)` — removes it
- `line.applyOptions({ price, color, ... })` — updates a line's properties
- `chart.chartElement()` — the DOM element to attach mouse listeners to

## Reimplementing from scratch

1. Create a class that takes `IChartApi` and `ISeriesApi` in its constructor
2. Attach `mousedown`/`mousemove`/`mouseup` listeners on `chart.chartElement()`
3. Use `coordinateToPrice` / `priceToCoordinate` to convert between pixels and prices
4. Use `createPriceLine` / `removePriceLine` / `applyOptions` for line CRUD
5. Track state: an array of lines, which one is being dragged, which is selected
6. Distinguish click vs drag with a small pixel threshold
7. Expose a `remove()` method that tears down listeners, and call it from `useChart`'s cleanup
