<script lang="ts">
  import { ChartController } from '../chart-controller'
  import {
    cloneDrawingDefaults,
  } from '../drawings/defaults'
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
    candles,
    indicators,
    drawings,
    drawingDefaults,
    onDefaultsChange,
    onDrawingsChange,
    onActiveCandleChange,
  }: {
    candles: Array<ChartCandle>
    indicators: ChartIndicatorState
    drawings: ChartDrawingState | null
    drawingDefaults: DrawingDefaults
    onDefaultsChange?: (defaults: DrawingDefaults) => void | Promise<void>
    onDrawingsChange?: (drawings: Array<SavedDrawing>) => void
    onActiveCandleChange?: (candle: ChartCandle | null) => void
  } = $props()

  let containerElement: HTMLDivElement
  let controller: ChartController | null = null

  let activeToolValue = $state('')
  let selectedDrawing = $state<SavedDrawing | null>(null)
  let currentDefaults = $derived.by(() => cloneDrawingDefaults(drawingDefaults))
  let toolMenuCoords = $state({ x: 0, y: 0 })
  let drawingMenuCoords = $state({ x: 0, y: 0 })
  let toolMenuOpen = $state(false)
  let drawingMenuOpen = $state(false)
  let lineDialogOpen = $state(false)
  let fibDialogOpen = $state(false)
  let lineDialogSession = $state(0)
  let fibDialogSession = $state(0)
  let lineDialogTitle = $state('Edit line')
  let editingLine = $state<HorizontalLineDrawing | DiagonalLineDrawing | null>(null)
  let editingFib = $state<FibRetracementDrawing | null>(null)

  const selectedHorizontalDefaults = $derived(
    editingLine?.type === 'horizontal-line' ? currentDefaults.horizontalLine : currentDefaults.diagonalLine,
  )
  const activeTool = $derived(
    activeToolValue === '' ? null : (activeToolValue as DrawingToolType),
  )
  const showDrawingMenu = $derived(drawingMenuOpen && selectedDrawing !== null)

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
      controller.drawings = drawings
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
      editingFib = structuredClone(selectedDrawing)
      fibDialogSession += 1
      fibDialogOpen = true
      return
    }

    editingLine = structuredClone(selectedDrawing)
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
    currentDefaults = cloneDrawingDefaults(nextDefaults)
    await onDefaultsChange?.(nextDefaults)
  }

  async function handleDiagonalDefaultsChange(defaults: DiagonalLineDefaults) {
    const nextDefaults = {
      ...currentDefaults,
      diagonalLine: { ...defaults },
    }
    currentDefaults = cloneDrawingDefaults(nextDefaults)
    await onDefaultsChange?.(nextDefaults)
  }

  async function handleFibDefaultsChange(defaults: FibRetracementDefaults) {
    const nextDefaults = {
      ...currentDefaults,
      fibRetracement: structuredClone(defaults),
    }
    currentDefaults = cloneDrawingDefaults(nextDefaults)
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
    activeToolValue = value
    toolMenuOpen = false
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

  function getActiveToolValue() {
    return activeToolValue
  }

  function toLocalCoords(clientX: number, clientY: number) {
    const rect = containerElement.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  function openToolMenuAt(clientX: number, clientY: number) {
    toolMenuCoords = toLocalCoords(clientX, clientY)
    drawingMenuOpen = false
    toolMenuOpen = true
  }

  function handleMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault()
      openToolMenuAt(event.clientX, event.clientY)
      return
    }

    controller?.handleMouseDown(event)
  }

  function handleMouseMove(event: MouseEvent) {
    controller?.handleMouseMove(event)
  }

  function handleMouseUp() {
    controller?.handleMouseUp()
  }

  function handleClick(event: MouseEvent) {
    controller?.handleClick(event)
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault()
    controller?.handleContextMenu(event)
  }

  function handleAuxClick(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault()
      openToolMenuAt(event.clientX, event.clientY)
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    controller?.handleKeyDown(event)
  }

  function mountChart(node: HTMLDivElement) {
    const onMouseDown = (event: MouseEvent) => handleMouseDown(event)
    const onMouseMove = (event: MouseEvent) => handleMouseMove(event)
    const onClick = (event: MouseEvent) => handleClick(event)
    const onContextMenu = (event: MouseEvent) => handleContextMenu(event)
    const onAuxClick = (event: MouseEvent) => handleAuxClick(event)

    node.addEventListener('mousedown', onMouseDown, true)
    node.addEventListener('mousemove', onMouseMove, true)
    node.addEventListener('click', onClick, true)
    node.addEventListener('contextmenu', onContextMenu, true)
    node.addEventListener('auxclick', onAuxClick, true)

    queueMicrotask(() => {
      if (controller) {
        return
      }

      controller = new ChartController({
        element: node,
        candles,
        indicators,
        drawings: drawings ?? undefined,
        drawingDefaults: currentDefaults,
        onDrawingsChange,
        onActiveCandleChange,
        onToolMenuRequest: (request) => {
          toolMenuCoords = toLocalCoords(request.x, request.y)
          drawingMenuOpen = false
          toolMenuOpen = true
        },
        onDrawingMenuRequest: (request, drawing) => {
          selectedDrawing = drawing
          drawingMenuCoords = toLocalCoords(request.x, request.y)
          toolMenuOpen = false
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
      node.removeEventListener('auxclick', onAuxClick, true)
      controller?.destroy()
      controller = null
    }
  }

</script>

<svelte:window onmouseup={handleMouseUp} onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={containerElement}
  class="relative min-h-0 flex-1 self-stretch"
  role="application"
  aria-label="Price chart drawing area"
  tabindex="0"
  onkeydown={handleKeyDown}
>
  {#if toolMenuOpen}
    <div
      class="absolute z-50 w-52 overflow-hidden rounded-lg border border-border/70 bg-[#211b14]/96 p-1 shadow-md backdrop-blur-sm"
      style={`left:${toolMenuCoords.x}px; top:${toolMenuCoords.y}px;`}
    >
      <div class="px-2 py-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Drawing Tool
      </div>
      <div class="my-1 h-px bg-border/70"></div>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, 'horizontal-line')}>
        Horizontal line
      </button>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, 'diagonal-line')}>
        Diagonal line
      </button>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, 'fib-retracement')}>
        Fib retracement
      </button>
      <div class="my-1 h-px bg-border/70"></div>
      <button class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground" onclick={(event) => handleToolMenuSelection(event, '')}>
        Selection mode
      </button>
    </div>
  {/if}

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

  <div {@attach mountChart} class="min-h-0 h-full w-full"></div>
</div>

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
