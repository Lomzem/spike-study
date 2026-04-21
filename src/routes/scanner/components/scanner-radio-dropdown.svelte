<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'

  type Option = {
    value: string
    label: string
  }

  let {
    name,
    label,
    value = $bindable(''),
    options,
  }: {
    name: string
    label: string
    value: string
    options: Array<Option>
  } = $props()

  const selectedLabel = $derived(
    options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '',
  )
</script>

<div class="grid gap-1.5">
  <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
  <input type="hidden" {name} {value} />

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button variant="outline" class="w-full justify-between font-normal" {...props}>
          <span>{selectedLabel}</span>
          <ChevronDownIcon class="size-4 text-muted-foreground" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>

    <DropdownMenu.Content class="w-[var(--bits-anchor-width)] min-w-48">
      <DropdownMenu.RadioGroup bind:value>
        {#each options as option (option.value)}
          <DropdownMenu.RadioItem value={option.value}>
            {#snippet children()}
              {option.label}
            {/snippet}
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
