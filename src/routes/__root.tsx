import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from '@tanstack/react-router'
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from '@clerk/tanstack-react-start'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { createServerFn } from '@tanstack/react-start'
import * as React from 'react'
import { auth } from '@clerk/tanstack-react-start/server'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { ConvexReactClient } from 'convex/react'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { getToken, userId } = await auth()
  const token = await getToken({ template: 'convex' })

  return {
    userId,
    token,
  }
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  beforeLoad: async (ctx) => {
    const clerkAuth = await fetchClerkAuth()
    const { userId, token } = clerkAuth
    // During SSR only (the only time serverHttpClient exists),
    // set the Clerk auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    return {
      userId,
      token,
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

function NavBar() {
  return (
    <header className="flex items-center h-12 border-b border-border shrink-0">
      {/* Orange vertical line */}
      <div className="w-1 h-full bg-primary" />

      {/* Logo */}
      <h1 className="ml-2 font-bold tracking-widest uppercase font-monospace text-primary">
        Spike Study
      </h1>

      {/* Separator */}
      <div className="mx-3 w-px h-4 bg-fg-muted" />

      {/* Nav Tabs */}
      <nav className="flex gap-0 items-center h-full">
        <Link
          to="/scanner"
          className="flex items-center px-3 h-full font-medium tracking-wider uppercase border-b-2 border-transparent transition-colors duration-200 font-monospace"
          activeProps={{ className: 'text-primary' }}
          inactiveProps={{
            className: 'hover:border-primary/30',
          }}
        >
          {' '}
          Scanner
        </Link>
        <Link
          to="/chart/AAPL/2026-01-22"
          className="flex items-center px-3 h-full font-medium tracking-wider uppercase border-b-2 border-transparent transition-colors duration-200 font-monospace"
          activeProps={{ className: 'text-primary' }}
          inactiveProps={{
            className: 'hover:border-primary/30',
          }}
        >
          Chart
        </Link>
      </nav>
    </header>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="grid min-h-dvh bg-bg text-fg dark">
        <NavBar />
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
