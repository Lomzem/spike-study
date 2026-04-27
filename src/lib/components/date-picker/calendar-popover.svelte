<script lang="ts">
  import { Calendar as CalendarPrimitive } from 'bits-ui'
  import type { DateValue } from '@internationalized/date'
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left'
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import { Button, type ButtonSize } from '$lib/components/ui/button/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { cn } from '$lib/utils'

  interface CalendarPopoverProps {
    value: DateValue | undefined
    placeholder?: DateValue | undefined
    calendarLabel: string
    triggerLabel: string
    triggerClass?: string
    triggerSize?: ButtonSize
    disabled?: boolean
    minValue?: DateValue | undefined
    maxValue?: DateValue | undefined
    isDateDisabled?: ((value: DateValue) => boolean) | undefined
    muteOutsideMonthDays?: boolean
    onSelect?: (value: DateValue | undefined) => void | Promise<void>
  }

  let {
    value,
    placeholder = undefined,
    calendarLabel,
    triggerLabel,
    triggerClass = '',
    triggerSize = 'default',
    disabled = false,
    minValue = undefined,
    maxValue = undefined,
    isDateDisabled = undefined,
    muteOutsideMonthDays = false,
    onSelect,
  }: CalendarPopoverProps = $props()

  let open = $state(false)

  function isOutsideMonth(dateValue: DateValue, monthValue: DateValue) {
    return (
      dateValue.month !== monthValue.month || dateValue.year !== monthValue.year
    )
  }

  function handleValueChange(nextValue: DateValue | undefined) {
    open = false

    const result = onSelect?.(nextValue)
    if (result) {
      void result.catch((error) => {
        console.error('Calendar selection handler failed', error)
      })
    }
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        size={triggerSize}
        class={triggerClass}
        {disabled}
        {...props}
      >
        {triggerLabel}
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class="w-auto p-3" align="start">
    <CalendarPrimitive.Root
      type="single"
      {value}
      onValueChange={handleValueChange}
      {placeholder}
      {minValue}
      {maxValue}
      fixedWeeks
      initialFocus
      disableDaysOutsideMonth={false}
      weekStartsOn={0}
      weekdayFormat="short"
      {calendarLabel}
      {isDateDisabled}
    >
      {#snippet children({ months, weekdays })}
        <div class="space-y-3">
          <CalendarPrimitive.Header class="flex items-center justify-between gap-2">
            <CalendarPrimitive.PrevButton>
              {#snippet child({ props })}
                <Button variant="ghost" size="icon-sm" class="size-7" {...props}>
                  <ChevronLeftIcon class="size-4" />
                  <span class="sr-only">Previous month</span>
                </Button>
              {/snippet}
            </CalendarPrimitive.PrevButton>

            <CalendarPrimitive.Heading class="text-sm font-medium text-foreground" />

            <CalendarPrimitive.NextButton>
              {#snippet child({ props })}
                <Button variant="ghost" size="icon-sm" class="size-7" {...props}>
                  <ChevronRightIcon class="size-4" />
                  <span class="sr-only">Next month</span>
                </Button>
              {/snippet}
            </CalendarPrimitive.NextButton>
          </CalendarPrimitive.Header>

          {#each months as month (month.value.toString())}
            <CalendarPrimitive.Grid class="w-full border-collapse">
              <CalendarPrimitive.GridHead>
                <CalendarPrimitive.GridRow>
                  {#each weekdays as weekday (weekday)}
                    <CalendarPrimitive.HeadCell class="h-8 w-9 text-[0.8rem] font-medium text-muted-foreground">
                      {weekday}
                    </CalendarPrimitive.HeadCell>
                  {/each}
                </CalendarPrimitive.GridRow>
              </CalendarPrimitive.GridHead>

              <CalendarPrimitive.GridBody>
                {#each month.weeks as weekDates, weekIndex (`${month.value.toString()}-${weekIndex}`)}
                  <CalendarPrimitive.GridRow>
                    {#each weekDates as dateValue (dateValue.toString())}
                      <CalendarPrimitive.Cell date={dateValue} month={month.value}>
                        {#snippet child({ props })}
                          <td {...props} class="h-9 w-9 p-0 text-center align-middle">
                            <CalendarPrimitive.Day>
                              {#snippet child({ props, day, selected, disabled: dayDisabled })}
                                <div
                                  {...props}
                                  class={cn(
                                    'flex size-9 items-center justify-center rounded-md text-sm transition-colors',
                                    selected
                                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                      : 'cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground',
                                    dayDisabled
                                      ? 'cursor-not-allowed text-muted-foreground/35 hover:bg-transparent hover:text-muted-foreground/35'
                                      : '',
                                    muteOutsideMonthDays &&
                                      isOutsideMonth(dateValue, month.value) &&
                                      !selected
                                      ? 'text-muted-foreground/25'
                                      : '',
                                  )}
                                >
                                  {day}
                                </div>
                              {/snippet}
                            </CalendarPrimitive.Day>
                          </td>
                        {/snippet}
                      </CalendarPrimitive.Cell>
                    {/each}
                  </CalendarPrimitive.GridRow>
                {/each}
              </CalendarPrimitive.GridBody>
            </CalendarPrimitive.Grid>
          {/each}
        </div>
      {/snippet}
    </CalendarPrimitive.Root>
  </Popover.Content>
</Popover.Root>
