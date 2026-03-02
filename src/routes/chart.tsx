import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Input } from '~/components/ui/input'

export const Route = createFileRoute('/chart')({
  component: RouteComponent,
})

function StockInfoBar() {
  return (
    <section className="flex gap-2 items-center py-1 px-3 border-b shrink-0 bg-bg border-border">
      <label className="font-mono tracking-wider uppercase">Symbol</label>
      <Input
        type="text"
        className="py-0.5 px-2 w-20 font-mono text-xs font-bold rounded-md outline-none border-border bg-surface text-md text-primary"
        defaultValue="AAPL"
        spellCheck={false}
      />
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
