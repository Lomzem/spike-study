<script lang="ts">
  import './layout.css'
  import { env as publicEnv } from '$env/dynamic/public'
  import favicon from '$lib/assets/favicon.svg'
  import AppHeader from '$lib/components/app/app-header.svelte'
  import ConvexShell from '$lib/client/convex-shell.svelte'
  import type { LayoutProps } from './$types'
  import { page } from '$app/state'
  import { ClerkProvider } from 'svelte-clerk'

  const clerkPublishableKey = publicEnv.PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
  const hasClerkConfig = clerkPublishableKey.length > 0

  let { children }: LayoutProps = $props()

  const pathname = $derived(page.url.pathname)
  const isPublicRoute = $derived(pathname.startsWith('/login'))
  const isFullscreenAppRoute = $derived(
    pathname === '/scanner' || pathname.startsWith('/chart'),
  )
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

{#if hasClerkConfig}
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
          <AppHeader {pathname} />
        {/if}

        {@render children()}
      </div>
    </ConvexShell>
  </ClerkProvider>
{:else}
  <main class="grid min-h-dvh place-items-center px-6 py-10">
    <section class="w-full max-w-xl rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Configuration Error
      </p>
      <h1 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        Clerk is not configured
      </h1>
      <p class="mt-3 text-sm leading-6 text-muted-foreground">
        Set <code>PUBLIC_CLERK_PUBLISHABLE_KEY</code> and reload the app.
      </p>
    </section>
  </main>
{/if}
