<script lang="ts">
import './layout.css';
import favicon from '$lib/assets/favicon.svg';

import type { Snippet } from 'svelte';
import { page } from '$app/state';
import { ClerkProvider, ClerkLoaded, ClerkLoading, UserButton } from 'svelte-clerk';

const { children }: { children: Snippet } = $props();

const isPublicRoute = $derived(
  page.url.pathname.startsWith('/sign-in') || page.url.pathname.startsWith('/sign-up'),
);
const isScanner = $derived(page.url.pathname === '/scanner');
const isChart = $derived(page.url.pathname.startsWith('/chart'));
</script>

<svelte:head>
  <link rel="icon" href={favicon}>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link
    href="https://fonts.googleapis.com/css2?family=Rubik:wght@700&display=swap"
    rel="stylesheet"
  >
</svelte:head>
<ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
  <div class="min-h-dvh bg-background text-foreground">
    {#if !isPublicRoute}
      <nav
        class="relative z-20 flex items-center justify-between border-b px-5 py-1.5"
        style="border-color: rgba(139, 126, 106, 0.15); background: rgba(26, 22, 16, 0.95); backdrop-filter: blur(12px);"
      >
        <div class="flex items-center gap-1">
          <a
            href="/scanner"
            class="rounded px-3 py-1 text-xs font-medium tracking-wide transition-colors"
            style="color: {isScanner ? '#e8dcc8' : '#8b7e6a'}; background: {isScanner ? 'rgba(139, 126, 106, 0.15)' : 'transparent'};"
          >
            Scanner
          </a>
          <a
            href={isChart ? page.url.pathname : '#'}
            class="rounded px-3 py-1 text-xs font-medium tracking-wide transition-colors"
            style="color: {isChart ? '#e8dcc8' : '#8b7e6a'}; background: {isChart ? 'rgba(139, 126, 106, 0.15)' : 'transparent'}; {isChart ? '' : 'pointer-events: none; opacity: 0.4;'}"
          >
            Chart
          </a>
        </div>

        <div class="flex h-6 w-6 items-center justify-center">
          <ClerkLoading>
            <div class="h-6 w-6 rounded-full" style="background: rgba(139, 126, 106, 0.15);"></div>
          </ClerkLoading>
          <ClerkLoaded> <UserButton signInUrl="/sign-in" /> </ClerkLoaded>
        </div>
      </nav>
    {/if}

    {@render children()}
  </div>
</ClerkProvider>
