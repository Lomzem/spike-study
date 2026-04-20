import {
  Outlet,
  createFileRoute,
  useMatch,
  useNavigate,
} from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import type {
  ChartIndicatorContextValue,
  IndicatorState,
} from '~/routes/-chart-indicators'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { DatePicker } from '~/components/ui/date-picker'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  ChartIndicatorContext,
  useChartIndicators,
} from '~/routes/-chart-indicators'

export const Route = createFileRoute('/chart')({
  component: RouteComponent,
})

function IndicatorToggleRow({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={active}
      onClick={onClick}
      className="w-full justify-between rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm hover:bg-accent/70 data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-foreground"
      data-state={active ? 'on' : 'off'}
    >
      <span>{label}</span>
      <span
        className="text-xs font-medium text-muted-foreground data-[state=on]:text-foreground"
        data-state={active ? 'on' : 'off'}
      >
        {active ? 'On' : 'Off'}
      </span>
    </Button>
  )
}

function StockInfoBar() {
  const navigate = useNavigate({ from: '/chart' })
  const { showSma, showEma, showVwap, toggleIndicator } = useChartIndicators()
  const childMatch = useMatch({
    from: '/chart/$symbol/$date',
    shouldThrow: false,
  })
  const symbol = childMatch?.params.symbol ?? ''
  const date = childMatch?.params.date ?? ''
  const symbolId = useId()
  const dateId = useId()

  const handleDateSelect = (newDate: string) => {
    if (symbol) {
      navigate({
        to: '/chart/$symbol/$date',
        params: { symbol, date: newDate },
      })
    }
  }

  return (
    <section className="flex items-center gap-4 border-b border-border bg-bg px-4 py-1 shrink-0">
      {/* Symbol Selection */}
      <div className="flex gap-2 items-center">
        <label
          htmlFor={symbolId}
          className="font-mono tracking-wider uppercase"
        >
          Symbol
        </label>
        <Input
          id={symbolId}
          type="text"
          className="py-0.5 px-2 w-20 font-mono text-xs font-bold rounded-md outline-none border-border bg-surface text-md text-primary"
          defaultValue={symbol}
          spellCheck={false}
        />
      </div>

      {/* Date Selection */}
      <div className="flex gap-2 items-center">
        <label htmlFor={dateId} className="font-mono tracking-wider uppercase">
          Date
        </label>
        <DatePicker
          id={dateId}
          date={date}
          onSelect={handleDateSelect}
          className="py-0.5 px-2 w-36 rounded-md border-border bg-surface"
        />
      </div>

      <div className="ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 border-border bg-surface px-3"
            >
              <SlidersHorizontal className="size-4" />
              Indicators
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-64 border-border bg-surface p-3 text-fg"
          >
            <PopoverHeader className="mb-3 gap-0.5">
              <PopoverTitle>Indicators</PopoverTitle>
              <PopoverDescription>
                Toggle intraday overlays on the chart.
              </PopoverDescription>
            </PopoverHeader>
            <div className="flex flex-col gap-2">
              <IndicatorToggleRow
                active={showSma}
                label="SMA"
                onClick={() => toggleIndicator('showSma')}
              />
              <IndicatorToggleRow
                active={showEma}
                label="EMA"
                onClick={() => toggleIndicator('showEma')}
              />
              <IndicatorToggleRow
                active={showVwap}
                label="VWAP"
                onClick={() => toggleIndicator('showVwap')}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  )
}

function RouteComponent() {
  const [indicators, setIndicators] = useState<IndicatorState>({
    showSma: true,
    showEma: true,
    showVwap: true,
  })

  const value = useMemo<ChartIndicatorContextValue>(
    () => ({
      ...indicators,
      toggleIndicator: (indicator) => {
        setIndicators((current) => ({
          ...current,
          [indicator]: !current[indicator],
        }))
      },
    }),
    [indicators],
  )

  return (
    <ChartIndicatorContext.Provider value={value}>
      <div className="flex flex-col h-full">
        <StockInfoBar />
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
    </ChartIndicatorContext.Provider>
  )
}
