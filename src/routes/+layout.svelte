<script lang="ts">
  import './layout.css'
  import favicon from '$lib/assets/favicon.svg'
  import ConvexShell from '$lib/client/convex-shell.svelte'
  import type { LayoutProps } from './$types'
  import { page } from '$app/state'
  import {
    ClerkLoaded,
    ClerkLoading,
    ClerkProvider,
    UserButton,
  } from 'svelte-clerk'

  const clerkPublishableKey =
    import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ??
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  if (!clerkPublishableKey) {
    throw new Error(
      'PUBLIC_CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY is not set',
    )
  }

  let { children }: LayoutProps = $props()

  const isPublicRoute = $derived(
    page.url.pathname.startsWith('/login'),
  )
  const isScannerRoute = $derived(page.url.pathname === '/scanner')
  const isChartRoute = $derived(page.url.pathname.startsWith('/chart'))
  const isFullscreenAppRoute = $derived(isScannerRoute || isChartRoute)

</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap"
    rel="stylesheet"
  />
  <title>Spike Study</title>
</svelte:head>

<ClerkProvider
  publishableKey={clerkPublishableKey}
  signInUrl="/login"
  signUpUrl="/login"
>
  <ConvexShell>
    <div
      class="min-h-dvh bg-background text-foreground antialiased"
      class:h-dvh={isFullscreenAppRoute}
      class:overflow-hidden={isFullscreenAppRoute}
    >
      {#if !isPublicRoute}
        <header
          class="border-b backdrop-blur"
          style="border-color: rgba(139, 126, 106, 0.15); background: rgba(26, 22, 16, 0.95);"
        >
          <div class="flex h-12 items-center gap-3 px-4">
            <div class="h-7 w-1 rounded-full bg-primary"></div>
            <a
              href="/scanner"
              class="text-sm font-semibold uppercase tracking-[0.28em] text-primary"
              style="font-family: 'Rubik', sans-serif;"
            >
              Spike Study
            </a>

            <div class="mx-2 hidden h-4 w-px sm:block" style="background: rgba(139, 126, 106, 0.15);"></div>

            <nav class="flex items-center gap-1">
              <a
                href="/scanner"
                class="rounded px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] transition-colors"
                style="color: {isScannerRoute ? '#e8dcc8' : '#8b7e6a'}; background: {isScannerRoute ? 'rgba(139, 126, 106, 0.15)' : 'transparent'};"
              >
                Scanner
              </a>
              {#if isChartRoute}
                <a
                  href={page.url.pathname}
                  class="rounded px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] transition-colors"
                  style="color: #e8dcc8; background: rgba(139, 126, 106, 0.15);"
                >
                  Chart
                </a>
              {:else}
                <span
                  class="rounded px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]"
                  style="color: #8b7e6a;"
                >
                  Chart
                </span>
              {/if}
            </nav>

            <div class="ml-auto flex h-8 w-8 items-center justify-center">
              <ClerkLoading>
                <div class="h-8 w-8 rounded-full" style="background: rgba(139, 126, 106, 0.15);"></div>
              </ClerkLoading>
              <ClerkLoaded>
                <UserButton />
              </ClerkLoaded>
            </div>
          </div>
        </header>
      {/if}

      {@render children()}
    </div>
  </ConvexShell>
</ClerkProvider>
