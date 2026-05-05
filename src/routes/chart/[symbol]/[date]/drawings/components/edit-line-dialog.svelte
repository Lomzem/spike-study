<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { cloneSavedDrawing } from '../clone'
  import type {
    DiagonalLineDefaults,
    DiagonalLineDrawing,
    HorizontalLineDefaults,
    HorizontalLineDrawing,
  } from '../types'

  type EditableLineDrawing = HorizontalLineDrawing | DiagonalLineDrawing
  type EditableLineDefaults = HorizontalLineDefaults | DiagonalLineDefaults

  const lineStyleOptions = [
    { label: 'Solid', value: 0 },
    { label: 'Dotted', value: 1 },
    { label: 'Dashed', value: 2 },
  ] as const

  let {
    open = $bindable(false),
    title,
    drawing,
    defaults,
    onConfirm,
    onSetDefault,
  }: {
    open: boolean
    title: string
    drawing: EditableLineDrawing | null
    defaults: EditableLineDefaults
    onConfirm?: (drawing: EditableLineDrawing) => void
    onSetDefault?: (defaults: EditableLineDefaults) => void | Promise<void>
  } = $props()

  const getInitialDrawing = () => (drawing ? cloneSavedDrawing(drawing) : null)
  const getOriginalKey = () => (drawing ? JSON.stringify(drawing) : '')

  let draft = $state<EditableLineDrawing | null>(getInitialDrawing())
  const originalKey = getOriginalKey()
  let savedAsDefault = $state(false)

  function lineDefaultsFromDrawing(line: EditableLineDrawing): EditableLineDefaults {
    return {
      color: line.color,
      lineWidth: line.lineWidth,
      lineStyle: line.lineStyle,
      extendLeft: line.extendLeft,
      extendRight: line.extendRight,
    }
  }

  const draftDefaultKey = $derived(
    draft ? JSON.stringify(lineDefaultsFromDrawing(draft)) : '',
  )
  const defaultsKey = $derived(JSON.stringify(defaults))
  const hasDrawingChanges = $derived(
    draft !== null && JSON.stringify(draft) !== originalKey,
  )
  const canSaveDefaults = $derived(
    draft !== null && !savedAsDefault && draftDefaultKey !== defaultsKey,
  )

  async function handleSetDefault() {
    if (!draft) {
      return
    }

    const nextDefaults = lineDefaultsFromDrawing(draft)
    await onSetDefault?.(nextDefaults)
    savedAsDefault = true
  }

  function handleConfirm() {
    if (!draft) {
      return
    }

    onConfirm?.(cloneSavedDrawing(draft))
    open = false
  }

  function updateLineWidth(width: 1 | 2 | 3 | 4) {
    if (draft) {
      savedAsDefault = false
      draft.lineWidth = width
    }
  }

  function updateLineStyle(style: 0 | 1 | 2) {
    if (draft) {
      savedAsDefault = false
      draft.lineStyle = style
    }
  }

  function updateLineColor(color: string) {
    if (draft) {
      savedAsDefault = false
      draft.color = color
    }
  }

  function updateExtendLeft(extendLeft: boolean) {
    if (draft) {
      savedAsDefault = false
      draft.extendLeft = extendLeft
    }
  }

  function updateExtendRight(extendRight: boolean) {
    if (draft) {
      savedAsDefault = false
      draft.extendRight = extendRight
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-md gap-5 border-border/70 bg-[#211b14]/96 p-5 text-foreground shadow-xl backdrop-blur-sm">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
    </Dialog.Header>

    {#if draft}
      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="line-color">Color</Label>
          <div class="flex items-center gap-3">
            <Input id="line-color" type="color" value={draft.color} class="h-10 w-14 rounded-md p-1" oninput={(event) => updateLineColor((event.currentTarget as HTMLInputElement).value)} />
            <Input value={draft.color} class="flex-1" oninput={(event) => updateLineColor((event.currentTarget as HTMLInputElement).value)} />
          </div>
        </div>

        <div class="grid gap-2">
          <Label>Width</Label>
          <div class="flex flex-wrap gap-2">
            {#each [1, 2, 3, 4] as width (width)}
              <Button
                type="button"
                variant={draft.lineWidth === width ? 'default' : 'outline'}
                size="sm"
                onclick={() => updateLineWidth(width as 1 | 2 | 3 | 4)}
              >
                {width}px
              </Button>
            {/each}
          </div>
        </div>

        <div class="grid gap-2">
          <Label>Style</Label>
          <div class="flex flex-wrap gap-2">
            {#each lineStyleOptions as option (option.value)}
              <Button
                type="button"
                variant={draft.lineStyle === option.value ? 'default' : 'outline'}
                size="sm"
                onclick={() => updateLineStyle(option.value)}
              >
                {option.label}
              </Button>
            {/each}
          </div>
        </div>

        <div class="grid gap-3 rounded-lg border border-border/60 bg-background/30 p-3">
          <div class="flex items-center justify-between gap-3">
            <Label for="extend-left">Extend left</Label>
            <Switch id="extend-left" checked={draft.extendLeft} onCheckedChange={updateExtendLeft} />
          </div>
          <div class="flex items-center justify-between gap-3">
            <Label for="extend-right">Extend right</Label>
            <Switch id="extend-right" checked={draft.extendRight} onCheckedChange={updateExtendRight} />
          </div>
        </div>
      </div>
    {/if}

    <Dialog.Footer class="gap-2 sm:flex-row sm:items-center">
      <Dialog.Close type="button" class="contents">
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancel</Button>
        {/snippet}
      </Dialog.Close>
      <Button type="button" class="sm:mr-auto" variant={savedAsDefault ? 'secondary' : 'outline'} disabled={!canSaveDefaults} onclick={handleSetDefault}>
        {savedAsDefault ? 'Saved as Default' : 'Set as Default'}
      </Button>
      <Button type="button" disabled={!hasDrawingChanges} onclick={handleConfirm}>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
