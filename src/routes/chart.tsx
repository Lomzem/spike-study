import {
  createFileRoute,
  Outlet,
  useNavigate,
  getRouteApi,
} from '@tanstack/react-router'
import { Input } from '~/components/ui/input'
import { DatePicker } from '~/components/ui/date-picker'

export const Route = createFileRoute('/chart')({
  component: RouteComponent,
})

const chartRouteApi = getRouteApi('/chart/$symbol/$date')

function StockInfoBar() {
  const navigate = useNavigate({ from: '/chart' })
  const { symbol, date } = chartRouteApi.useParams()

  const handleDateSelect = (newDate: string) => {
    if (symbol) {
      navigate({
        to: '/chart/$symbol/$date',
        params: { symbol, date: newDate },
      })
    }
  }

  return (
    <section className="flex gap-4 items-center py-1 px-4 border-b shrink-0 bg-bg border-border">
      {/* Symbol Selection */}
      <div className="flex gap-2 items-center">
        <label className="font-mono tracking-wider uppercase">Symbol</label>
        <Input
          type="text"
          className="py-0.5 px-2 w-20 font-mono text-xs font-bold rounded-md outline-none border-border bg-surface text-md text-primary"
          defaultValue={symbol}
          spellCheck={false}
        />
      </div>

      {/* Date Selection */}
      <div className="flex gap-2 items-center">
        <label className="font-mono tracking-wider uppercase">Date</label>
        <DatePicker
          date={date}
          onSelect={handleDateSelect}
          className="py-0.5 px-2 w-36 rounded-md border-border bg-surface"
        />
      </div>
    </section>
  )
}

function RouteComponent() {
  return (
    <>
      <StockInfoBar />
      <Outlet />
    </>
  )
}
