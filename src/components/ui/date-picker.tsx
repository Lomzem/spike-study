import * as React from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

interface DatePickerProps {
  date: string
  onSelect: (date: string) => void
  className?: string
}

function DatePicker({ date, onSelect, className }: DatePickerProps) {
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
      <PopoverTrigger asChild>
        <Button
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
      <PopoverContent className="p-0 w-auto" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          captionLayout="dropdown"
          className="rounded-md border shadow"
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
