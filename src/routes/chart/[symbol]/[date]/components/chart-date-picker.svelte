<script lang="ts">
  import { goto } from '$app/navigation'
  import { parseDate, type DateValue } from '@internationalized/date'
  import CalendarPopover from '$lib/components/date-picker/calendar-popover.svelte'
  import { formatIsoDateLabel } from '$lib/components/date-picker/format-iso-date-label'

  let {
    symbol,
    date,
    availableDates,
  }: {
    symbol: string
    date: string
    availableDates: Array<string>
  } = $props()

  let selectedDate = $derived<DateValue | undefined>(parseDate(date))
  const availableDateSet = $derived(new Set(availableDates))
  const minValue = $derived(
    availableDates.length > 0 ? parseDate(availableDates[0]) : undefined,
  )
  const maxValue = $derived(
    availableDates.length > 0
      ? parseDate(availableDates[availableDates.length - 1])
      : undefined,
  )
  const isDisabled = $derived(availableDates.length === 0)

  function isDateDisabled(value: DateValue) {
    return !availableDateSet.has(value.toString())
  }

  async function handleValueChange(nextValue: DateValue | undefined) {
    if (!nextValue) {
      return
    }

    const nextDate = nextValue.toString()

    if (!availableDateSet.has(nextDate)) {
      return
    }

    if (nextDate === date) {
      return
    }

    await goto(`/chart/${encodeURIComponent(symbol)}/${nextDate}`)
  }
</script>

<CalendarPopover
  value={selectedDate}
  placeholder={selectedDate}
  calendarLabel={`${symbol} date picker`}
  triggerLabel={formatIsoDateLabel(date)}
  triggerSize="sm"
  disabled={isDisabled}
  {minValue}
  {maxValue}
  {isDateDisabled}
  muteOutsideMonthDays={true}
  onSelect={handleValueChange}
/>
