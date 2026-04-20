import * as React from 'react'
import { format, isValid, parseISO } from 'date-fns'

import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

interface DatePickerProps {
  id?: string
  date: string
  onSelect: (date: string) => void
  onClear?: () => void
  className?: string
}

function DatePicker({
  id,
  date,
  onSelect,
  onClear,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!date) return undefined
    const parsed = parseISO(date)
    return isValid(parsed) ? parsed : undefined
  }, [date])

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      onSelect(format(newDate, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            data-empty={!date}
            className={cn(
              'justify-start text-left font-mono text-sm h-9',
              'border-border bg-surface',
              'hover:bg-accent hover:text-accent-foreground',
              'data-[empty=true]:text-muted-foreground',
              className,
            )}
          >
            {date || <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        {onClear && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClear}
            className={cn(
              'text-fg-muted hover:text-fg shrink-0',
              !date && 'invisible',
            )}
            aria-label="Clear date"
          >
            &times;
          </Button>
        )}
      </div>
      <PopoverContent
        className="p-0 w-auto border-border bg-surface text-fg"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          captionLayout="dropdown"
          className="rounded-md border-0 shadow-none bg-transparent"
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
