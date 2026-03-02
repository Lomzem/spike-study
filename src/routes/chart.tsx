import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/chart')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  )
}
