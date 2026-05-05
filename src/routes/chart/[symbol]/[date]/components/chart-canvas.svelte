<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js'
  import type { LogicalRange } from 'lightweight-charts'
  import { ChartController } from '../chart-controller'
  import { cloneSavedDrawing } from '../drawings/clone'
  import { getCurrentDrawingDefaults } from '../drawings/current-defaults'
  import {
    cloneDrawingDefaults,
  } from '../drawings/defaults'
  import { buildDrawingStateKey } from '../drawings/state-key'
  import EditFibDialog from '../drawings/components/edit-fib-dialog.svelte'
  import EditLineDialog from '../drawings/components/edit-line-dialog.svelte'
  import type {
    ChartCandle,
    ChartDrawingState,
    ChartIndicatorState,
  } from '../chart-types'
  import type {
    DiagonalLineDefaults,
    DiagonalLineDrawing,
    DrawingDefaults,
    DrawingToolType,
    FibRetracementDefaults,
    FibRetracementDrawing,
    HorizontalLineDefaults,
    HorizontalLineDrawing,
    SavedDrawing,
  } from '../drawings/types'

  let {
    symbol,
    candles,
    indicators,
    drawings,
    drawingDefaults,
    initialVisibleLogicalRange,
    onDefaultsChange,
    onDrawingsChange,
    onActiveCandleChange,
    onVisibleLogicalRangeChange,
  }: {
    symbol: string
    candles: Array<ChartCandle>
    indicators: ChartIndicatorState
    drawings: ChartDrawingState | null
    drawingDefaults: DrawingDefaults
    initialVisibleLogicalRange?: LogicalRange | null
    onDefaultsChange?: (defaults: DrawingDefaults) => void | Promise<void>
    onDrawingsChange?: (drawings: Array<SavedDrawing>) => void
    onActiveCandleChange?: (candle: ChartCandle | null) => void
    onVisibleLogicalRangeChange?: (range: LogicalRange | null) => void
  } = $props()

  let containerElement: HTMLDivElement | null = null
  let controller: ChartController | null = null

  let selectedDrawing = $state<SavedDrawing | null>(null)
  let localDefaultsOverride = $state.raw<DrawingDefaults | null>(null)
  let drawingMenuCoords = $state({ x: 0, y: 0 })
  let chartContextMenuCoords = $state({ x: 0, y: 0 })
  let drawingMenuOpen = $state(false)
  let chartContextMenuOpen = $state(false)
  let lineDialogOpen = $state(false)
  let fibDialogOpen = $state(false)
  let removeAllDialogOpen = $state(false)
  let drawingCount = $derived(drawings?.drawings.length ?? 0)
  let lineDialogSession = $state(0)
  let fibDialogSession = $state(0)
  let lineDialogTitle = $state('Edit line')
  let editingLine = $state<HorizontalLineDrawing | DiagonalLineDrawing | null>(null)
  let editingFib = $state<FibRetracementDrawing | null>(null)

  const currentDefaults = $derived(
    getCurrentDrawingDefaults(drawingDefaults, localDefaultsOverride),
  )
  const selectedHorizontalDefaults = $derived(
    editingLine?.type === 'horizontal-line' ? currentDefaults.horizontalLine : currentDefaults.diagonalLine,
  )
  const showDrawingMenu = $derived(drawingMenuOpen && selectedDrawing !== null)
  const canRemoveAllDrawings = $derived(drawingCount > 0)
  const drawingsSyncKey = $derived(
    drawings ? buildDrawingStateKey(drawings.symbol, drawings.drawings) : null,
  )
  const syncedDrawings = $derived(
    drawingsSyncKey === null ? drawings : drawings,
  )

  $effect(() => {
    if (controller) {
      controller.candles = candles
    }
  })

  $effect(() => {
    if (controller) {
      controller.indicators = indicators
    }
  })

  $effect(() => {
    if (controller) {
      controller.drawings = syncedDrawings
    }
  })

  $effect(() => {
    if (controller) {
      controller.defaults = currentDefaults
    }
  })

  function openEditDialog() {
    if (!selectedDrawing) {
      return
    }

    drawingMenuOpen = false

    if (selectedDrawing.type === 'fib-retracement') {
      editingFib = cloneSavedDrawing(selectedDrawing)
      fibDialogSession += 1
      fibDialogOpen = true
      return
    }

    editingLine = cloneSavedDrawing(selectedDrawing)
    lineDialogSession += 1
    lineDialogTitle =
      selectedDrawing.type === 'horizontal-line'
        ? 'Edit horizontal line'
        : 'Edit diagonal line'
    lineDialogOpen = true
  }

  function handleEditMenuClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    openEditDialog()
  }

  function handleRemoveMenuClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    drawingMenuOpen = false
    controller?.removeSelectedDrawing()
  }

  function handleRemoveAllMenuClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!canRemoveAllDrawings) {
      return
    }

    chartContextMenuOpen = false
    removeAllDialogOpen = true
  }

  function handleRemoveAllConfirm() {
    controller?.removeAllDrawings()
    removeAllDialogOpen = false
  }

  function handleDrawingsChange(nextDrawings: Array<SavedDrawing>) {
    drawingCount = nextDrawings.length
  }

  function handleLineConfirm(drawing: HorizontalLineDrawing | DiagonalLineDrawing) {
    controller?.updateSelectedDrawing(drawing)
    selectedDrawing = drawing
    lineDialogOpen = false
  }

  function handleFibConfirm(drawing: FibRetracementDrawing) {
    controller?.updateSelectedDrawing(drawing)
    selectedDrawing = drawing
    fibDialogOpen = false
  }

  async function handleHorizontalDefaultsChange(defaults: HorizontalLineDefaults) {
    const nextDefaults = {
      ...currentDefaults,
      horizontalLine: { ...defaults },
    }

    localDefaultsOverride = cloneDrawingDefaults(nextDefaults)
    if (controller) {
      controller.defaults = localDefaultsOverride
    }
    await onDefaultsChange?.(nextDefaults)
  }

  async function handleDiagonalDefaultsChange(defaults: DiagonalLineDefaults) {
    const nextDefaults = {
      ...currentDefaults,
      diagonalLine: { ...defaults },
    }
    localDefaultsOverride = cloneDrawingDefaults(nextDefaults)
    if (controller) {
      controller.defaults = localDefaultsOverride
    }
    await onDefaultsChange?.(nextDefaults)
  }

  async function handleFibDefaultsChange(defaults: FibRetracementDefaults) {
    const nextDefaults = {
      ...currentDefaults,
      fibRetracement: structuredClone(defaults),
    }
    localDefaultsOverride = cloneDrawingDefaults(nextDefaults)
    if (controller) {
      controller.defaults = localDefaultsOverride
    }
    await onDefaultsChange?.(nextDefaults)
  }

  async function handleLineDefaultsChange(
    defaults: HorizontalLineDefaults | DiagonalLineDefaults,
  ) {
    if (editingLine?.type === 'horizontal-line') {
      await handleHorizontalDefaultsChange(defaults as HorizontalLineDefaults)
      return
    }

    await handleDiagonalDefaultsChange(defaults as DiagonalLineDefaults)
  }

  function setActiveToolValue(value: string) {
    chartContextMenuOpen = false
    controller?.setActiveDrawingTool(
      value === '' ? null : (value as DrawingToolType),
    )
  }

  function handleToolMenuSelection(
    event: MouseEvent,
    value: DrawingToolType | '',
  ) {
    event.preventDefault()
    event.stopPropagation()
    setActiveToolValue(value)
  }

  function toLocalCoords(clientX: number, clientY: number) {
    if (!containerElement) {
      return { x: 0, y: 0 }
    }

    const rect = containerElement.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  function attachContainer(node: HTMLDivElement) {
    containerElement = node

    return () => {
      if (containerElement === node) {
        containerElement = null
      }
    }
  }

  function openChartContextMenuAt(clientX: number, clientY: number) {
    chartContextMenuCoords = toLocalCoords(clientX, clientY)
    drawingMenuOpen = false
    chartContextMenuOpen = true
  }

  function handleMouseDown(event: MouseEvent) {
    controller?.handleMouseDown(event)
  }

  function handleMouseMove(event: MouseEvent) {
    controller?.handleMouseMove(event)
  }

  function handleMouseUp() {
    controller?.handleMouseUp()
  }

  function handleClick(event: MouseEvent) {
    if (event.button === 0 && chartContextMenuOpen) {
      chartContextMenuOpen = false
    }

    controller?.handleClick(event)
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault()
    controller?.handleContextMenu(event)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && chartContextMenuOpen) {
      chartContextMenuOpen = false
      return
    }

    controller?.handleKeyDown(event)
  }

  function mountChart(node: HTMLDivElement) {
    const onMouseDown = (event: MouseEvent) => handleMouseDown(event)
    const onMouseMove = (event: MouseEvent) => handleMouseMove(event)
    const onClick = (event: MouseEvent) => handleClick(event)
    const onContextMenu = (event: MouseEvent) => handleContextMenu(event)

    node.addEventListener('mousedown', onMouseDown, true)
    node.addEventListener('mousemove', onMouseMove, true)
    node.addEventListener('click', onClick, true)
    node.addEventListener('contextmenu', onContextMenu, true)

    queueMicrotask(() => {
      if (controller) {
        return
      }

      controller = new ChartController({
        element: node,
        drawingSymbol: symbol,
        candles,
        initialVisibleLogicalRange,
        indicators,
        drawings: drawings ?? undefined,
        drawingDefaults: currentDefaults,
        onDrawingsChange,
        onLiveDrawingsChange: handleDrawingsChange,
        onActiveCandleChange,
        onVisibleLogicalRangeChange,
        onChartContextMenuRequest: (request) => {
          selectedDrawing = null
          openChartContextMenuAt(request.x, request.y)
        },
        onDrawingMenuRequest: (request, drawing) => {
          selectedDrawing = drawing
          drawingMenuCoords = toLocalCoords(request.x, request.y)
          chartContextMenuOpen = false
          drawingMenuOpen = true
        },
        onSelectedDrawingChange: (drawing) => {
          selectedDrawing = drawing
        },
      })
    })

    return () => {
      node.removeEventListener('mousedown', onMouseDown, true)
      node.removeEventListener('mousemove', onMouseMove, true)
      node.removeEventListener('click', onClick, true)
      node.removeEventListener('contextmenu', onContextMenu, true)
      controller?.destroy()
      controller = null
    }
  }

</script>

<svelte:window onmouseup={handleMouseUp} onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  {@attach attachContainer}
  class="relative min-h-0 flex-1 self-stretch"
  role="application"
  aria-label="Price chart drawing area"
  tabindex="0"
  onkeydown={handleKeyDown}
>
  {#if showDrawingMenu}
    <div
      class="absolute z-50 w-48 overflow-hidden rounded-lg border border-border/70 bg-[#211b14]/96 p-1 shadow-md backdrop-blur-sm"
      style={`left:${drawingMenuCoords.x}px; top:${drawingMenuCoords.y}px;`}
    >
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={handleEditMenuClick}>
        Edit
      </button>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10" onclick={handleRemoveMenuClick}>
        Remove
      </button>
    </div>
  {/if}

  {#if chartContextMenuOpen}
    <div
      class="absolute z-50 w-52 overflow-hidden rounded-lg border border-border/70 bg-[#211b14]/96 p-1 shadow-md backdrop-blur-sm"
      style={`left:${chartContextMenuCoords.x}px; top:${chartContextMenuCoords.y}px;`}
    >
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, 'horizontal-line')}>
        Horizontal line
      </button>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, 'diagonal-line')}>
        Diagonal line
      </button>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, 'fib-retracement')}>
        Fib retracement
      </button>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, '')}>
        Selection mode
      </button>
      <div class="my-1 h-px bg-border/70"></div>
      <button
        class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
        disabled={!canRemoveAllDrawings}
        onclick={handleRemoveAllMenuClick}
      >
        Remove all drawings
      </button>
    </div>
  {/if}

  <div {@attach mountChart} class="min-h-0 h-full w-full"></div>
</div>

<AlertDialog.Root bind:open={removeAllDialogOpen}>
  <AlertDialog.Content class="max-w-md gap-5 border border-border/70 bg-[#211b14]/96 p-5 text-foreground shadow-xl backdrop-blur-sm">
    <AlertDialog.Header>
      <AlertDialog.Title>Remove all drawings?</AlertDialog.Title>
      <AlertDialog.Description class="text-muted-foreground">
        This will permanently delete all saved drawings for this chart. This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="flex-col gap-2 border-0 bg-transparent p-0 sm:flex-row sm:justify-end">
      <AlertDialog.Cancel type="button" variant="outline">Cancel</AlertDialog.Cancel>
      <AlertDialog.Action type="button" variant="destructive" onclick={handleRemoveAllConfirm}>
        Remove all
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

{#if editingLine}
  {#key lineDialogSession}
    <EditLineDialog
      bind:open={lineDialogOpen}
      title={lineDialogTitle}
      drawing={editingLine}
      defaults={selectedHorizontalDefaults}
      onConfirm={handleLineConfirm}
      onSetDefault={handleLineDefaultsChange}
    />
  {/key}
{/if}

{#if editingFib}
  {#key fibDialogSession}
    <EditFibDialog
      bind:open={fibDialogOpen}
      drawing={editingFib}
      defaults={currentDefaults.fibRetracement}
      onConfirm={handleFibConfirm}
      onSetDefault={handleFibDefaultsChange}
    />
  {/key}
{/if}
