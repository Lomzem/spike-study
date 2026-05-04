<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { cloneSavedDrawing } from '../clone'
  import { cloneFibDefaults, cloneFibLevels } from '../defaults'
  import type { FibRetracementDefaults, FibRetracementDrawing } from '../types'

  const lineStyleOptions = [
    { label: 'Solid', value: 0 },
    { label: 'Dotted', value: 1 },
    { label: 'Dashed', value: 2 },
  ] as const

  let {
    open = $bindable(false),
    drawing,
    defaults,
    onConfirm,
    onSetDefault,
  }: {
    open: boolean
    drawing: FibRetracementDrawing | null
    defaults: FibRetracementDefaults
    onConfirm?: (drawing: FibRetracementDrawing) => void
    onSetDefault?: (defaults: FibRetracementDefaults) => void | Promise<void>
  } = $props()

  const getInitialDrawing = () => (drawing ? cloneSavedDrawing(drawing) : null)
  const getOriginalKey = () => (drawing ? JSON.stringify(drawing) : '')

  let draft = $state<FibRetracementDrawing | null>(getInitialDrawing())
  const originalKey = getOriginalKey()
  let savedAsDefault = $state(false)

  function fibDefaultsFromDrawing(nextDrawing: FibRetracementDrawing): FibRetracementDefaults {
    return {
      color: nextDrawing.color,
      lineWidth: nextDrawing.lineWidth,
      lineStyle: nextDrawing.lineStyle,
      extendLeft: nextDrawing.extendLeft,
      extendRight: nextDrawing.extendRight,
      showPrices: nextDrawing.showPrices,
      showPercentages: nextDrawing.showPercentages,
      levels: cloneFibLevels(nextDrawing.levels),
    }
  }

  const draftDefaultKey = $derived(
    draft ? JSON.stringify(fibDefaultsFromDrawing(draft)) : '',
  )
  const defaultsKey = $derived(JSON.stringify(defaults))
  const hasDrawingChanges = $derived(
    draft !== null && JSON.stringify(draft) !== originalKey,
  )
  const canSaveDefaults = $derived(
    draft !== null && !savedAsDefault && draftDefaultKey !== defaultsKey,
  )

  function addLevel() {
    if (!draft) {
      return
    }

    savedAsDefault = false
    draft.levels = [
      ...draft.levels,
      {
        id: crypto.randomUUID(),
        value: 1,
        color: draft.color,
        visible: true,
      },
    ].sort((left, right) => left.value - right.value)
  }

  function removeLevel(levelId: string) {
    if (!draft) {
      return
    }

    savedAsDefault = false
    draft.levels = draft.levels.filter((level) => level.id !== levelId)
  }

  async function handleSetDefault() {
    if (!draft) {
      return
    }

    const nextDefaults = cloneFibDefaults(fibDefaultsFromDrawing(draft))
    await onSetDefault?.(nextDefaults)
    savedAsDefault = true
  }

  function handleConfirm() {
    if (!draft) {
      return
    }

    draft.levels = [...draft.levels].sort((left, right) => left.value - right.value)
    onConfirm?.(cloneSavedDrawing(draft))
    open = false
  }

  function updateFibWidth(width: 1 | 2 | 3 | 4) {
    if (draft) {
      savedAsDefault = false
      draft.lineWidth = width
    }
  }

  function updateFibStyle(style: 0 | 1 | 2) {
    if (draft) {
      savedAsDefault = false
      draft.lineStyle = style
    }
  }

  function updateBaseColor(color: string) {
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

  function updateShowPrices(showPrices: boolean) {
    if (draft) {
      savedAsDefault = false
      draft.showPrices = showPrices
    }
  }

  function updateShowPercentages(showPercentages: boolean) {
    if (draft) {
      savedAsDefault = false
      draft.showPercentages = showPercentages
    }
  }

  function updateLevelValue(levelId: string, value: number) {
    if (draft) {
      savedAsDefault = false
      draft.levels = draft.levels.map((level) =>
        level.id === levelId ? { ...level, value } : level,
      )
    }
  }

  function updateLevelColor(levelId: string, color: string) {
    if (draft) {
      savedAsDefault = false
      draft.levels = draft.levels.map((level) =>
        level.id === levelId ? { ...level, color } : level,
      )
    }
  }

  function updateLevelVisible(levelId: string, visible: boolean) {
    if (draft) {
      savedAsDefault = false
      draft.levels = draft.levels.map((level) =>
        level.id === levelId ? { ...level, visible } : level,
      )
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[85vh] max-w-2xl gap-5 overflow-y-auto border-border/70 bg-[#211b14]/96 p-5 text-foreground shadow-xl backdrop-blur-sm">
    <Dialog.Header>
      <Dialog.Title>Edit fib retracement</Dialog.Title>
      <Dialog.Description class="text-muted-foreground">
        Customize this fib retracement and optionally save its current settings as the new default for future fib drawings.
      </Dialog.Description>
    </Dialog.Header>

    {#if draft}
      <div class="grid gap-5">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="fib-color">Base color</Label>
            <div class="flex items-center gap-3">
              <Input id="fib-color" type="color" value={draft.color} class="h-10 w-14 rounded-md p-1" oninput={(event) => updateBaseColor((event.currentTarget as HTMLInputElement).value)} />
              <Input value={draft.color} class="flex-1" oninput={(event) => updateBaseColor((event.currentTarget as HTMLInputElement).value)} />
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
                onclick={() => updateFibWidth(width as 1 | 2 | 3 | 4)}
                >
                  {width}px
                </Button>
              {/each}
            </div>
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
                onclick={() => updateFibStyle(option.value)}
              >
                {option.label}
              </Button>
            {/each}
          </div>
        </div>

        <div class="grid gap-3 rounded-lg border border-border/60 bg-background/30 p-3 md:grid-cols-2">
          <div class="flex items-center justify-between gap-3">
            <Label for="fib-extend-left">Extend left</Label>
            <Switch id="fib-extend-left" checked={draft.extendLeft} onCheckedChange={updateExtendLeft} />
          </div>
          <div class="flex items-center justify-between gap-3">
            <Label for="fib-extend-right">Extend right</Label>
            <Switch id="fib-extend-right" checked={draft.extendRight} onCheckedChange={updateExtendRight} />
          </div>
          <div class="flex items-center justify-between gap-3">
            <Label for="fib-show-prices">Show prices</Label>
            <Switch id="fib-show-prices" checked={draft.showPrices} onCheckedChange={updateShowPrices} />
          </div>
          <div class="flex items-center justify-between gap-3">
            <Label for="fib-show-percentages">Show percentages</Label>
            <Switch id="fib-show-percentages" checked={draft.showPercentages} onCheckedChange={updateShowPercentages} />
          </div>
        </div>

        <div class="grid gap-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <Label>Levels</Label>
              <p class="mt-1 text-xs text-muted-foreground">
                Levels are automatically sorted numerically before rendering and saving.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onclick={addLevel}>Add level</Button>
          </div>

          <div class="grid gap-2 rounded-lg border border-border/60 bg-background/20 p-3">
            {#each draft.levels as level (level.id)}
              <div class="grid gap-3 rounded-md border border-border/50 bg-background/40 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-center">
                <div class="grid gap-1.5">
                  <Label for={`fib-level-${level.id}`}>Level</Label>
                  <Input
                    id={`fib-level-${level.id}`}
                    type="number"
                    step="0.0001"
                    value={String(level.value)}
                    oninput={(event) => updateLevelValue(level.id, Number((event.currentTarget as HTMLInputElement).value))}
                  />
                </div>
                <div class="grid gap-1.5">
                  <Label for={`fib-color-${level.id}`}>Color</Label>
                  <div class="flex items-center gap-3">
                    <Input id={`fib-color-${level.id}`} type="color" value={level.color} class="h-10 w-14 rounded-md p-1" oninput={(event) => updateLevelColor(level.id, (event.currentTarget as HTMLInputElement).value)} />
                    <Input value={level.color} class="flex-1" oninput={(event) => updateLevelColor(level.id, (event.currentTarget as HTMLInputElement).value)} />
                  </div>
                </div>
                <div class="flex items-center justify-between gap-3 md:flex-col md:items-start md:justify-center">
                  <Label for={`fib-visible-${level.id}`}>Visible</Label>
                  <Switch id={`fib-visible-${level.id}`} checked={level.visible} onCheckedChange={(visible) => updateLevelVisible(level.id, visible)} />
                </div>
                <div class="flex justify-end md:justify-center">
                  <Button type="button" variant="destructive" size="sm" onclick={() => removeLevel(level.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <Dialog.Footer class="flex-col gap-2 sm:flex-row sm:justify-end">
      <Dialog.Close type="button" class="contents">
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancel</Button>
        {/snippet}
      </Dialog.Close>
      <Button type="button" variant={savedAsDefault ? 'secondary' : 'outline'} disabled={!canSaveDefaults} onclick={handleSetDefault}>
        {savedAsDefault ? 'Saved as Default' : 'Set as Default'}
      </Button>
      <Button type="button" disabled={!hasDrawingChanges} onclick={handleConfirm}>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
