import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/chart')({
  component: RouteComponent,
})

function StockInfoBar() {
  return (
    <section className="flex gap-2 items-center py-1 px-3 border-b shrink-0 bg-bg border-border"></section>
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
