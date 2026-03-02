import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Input } from '~/components/ui/input'

export const Route = createFileRoute('/chart')({
  component: RouteComponent,
})

function StockInfoBar() {
  return (
    <section className="flex gap-4 items-center py-1 px-4 border-b shrink-0 bg-bg border-border">
      {/* Symbol Selection */}
      <div className="flex gap-2 items-center">
        <label className="font-mono tracking-wider uppercase">Symbol</label>
        <Input
          type="text"
          className="py-0.5 px-2 w-20 font-mono text-xs font-bold rounded-md outline-none border-border bg-surface text-md text-primary"
          defaultValue="AAPL"
          spellCheck={false}
        />
      </div>

      {/* Date Selection */}
      <label className="font-mono tracking-wider uppercase">Date</label>
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
