<script lang="ts">
  import {
    getLocalTimeZone,
    parseDate,
    today,
    type DateValue,
  } from '@internationalized/date'
  import CalendarPopover from '$lib/components/date-picker/calendar-popover.svelte'
  import { formatIsoDateLabel } from '$lib/components/date-picker/format-iso-date-label'

  let {
    name,
    label,
    value,
  }: {
    name: string
    label: string
    value: string
  } = $props()

  let selectedDate = $state<DateValue | undefined>()
  const placeholderDate = $derived(selectedDate ?? today(getLocalTimeZone()))

  $effect(() => {
    const nextValue = value ? parseDate(value) : undefined

    if (nextValue?.toString() !== selectedDate?.toString()) {
      selectedDate = nextValue
    }
  })

  function handleValueChange(nextValue: DateValue | undefined) {
    selectedDate = nextValue
  }
</script>

<label class="grid gap-1.5">
  <span
    class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
  >{label}</span
  >
  <input type="hidden" {name} value={selectedDate?.toString() ?? ''} />

  <CalendarPopover
    value={selectedDate}
    placeholder={placeholderDate}
    calendarLabel={`${label} picker`}
    triggerLabel={formatIsoDateLabel(selectedDate?.toString())}
    triggerClass="w-full justify-start text-left font-normal"
    onSelect={handleValueChange}
  />
</label>
