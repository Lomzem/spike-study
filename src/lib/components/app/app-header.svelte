<script lang="ts">
  import {
    ClerkLoaded,
    ClerkLoading,
    UserButton,
  } from 'svelte-clerk'

  let { pathname }: { pathname: string } = $props()

  const isScannerRoute = $derived(pathname === '/scanner')
  const isChartRoute = $derived(
    pathname === '/chart' || pathname.startsWith('/chart/'),
  )

  const navLinkClass = $derived(
    isScannerRoute
      ? 'bg-muted text-foreground'
      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
  )
</script>

<header class="border-b border-border/70 bg-background/95 backdrop-blur">
  <div class="flex h-12 items-center gap-3 px-4">
    <div class="h-7 w-1 rounded-full bg-primary"></div>
    <a
      href="/scanner"
      class="text-sm font-semibold uppercase tracking-[0.28em] text-primary"
    >
      Spike Study
    </a>

    <div class="mx-2 hidden h-4 w-px bg-border sm:block"></div>

    <nav class="flex items-center gap-1">
      <a
        href="/scanner"
        class={`rounded px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] transition-colors ${navLinkClass}`}
      >
        Scanner
      </a>

      {#if isChartRoute}
        <a
          href={pathname}
          class="rounded bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-foreground transition-colors"
        >
          Chart
        </a>
      {:else}
        <span
          class="rounded px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          Chart
        </span>
      {/if}
    </nav>

    <div class="ml-auto flex h-8 w-8 items-center justify-center">
      <ClerkLoading>
        <div class="h-8 w-8 rounded-full bg-muted"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <UserButton />
      </ClerkLoaded>
    </div>
  </div>
</header>
