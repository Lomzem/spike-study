import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { getSafeRedirectTarget } from '~/utils/redirect'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: getSafeRedirectTarget(search.redirect),
  }),
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect } = Route.useSearch()

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-10">
      <SignIn
        fallbackRedirectUrl={redirect}
        forceRedirectUrl={redirect}
        oauthFlow="redirect"
      />
    </main>
  )
}
