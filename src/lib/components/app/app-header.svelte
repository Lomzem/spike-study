<script lang="ts">
  import {
    ClerkLoaded,
    ClerkLoading,
    UserButton,
  } from 'svelte-clerk'

  let { pathname }: { pathname: string } = $props()

  const isScannerRoute = $derived(pathname === '/scanner')
  const isChartRoute = $derived(pathname.startsWith('/chart'))

  const scannerLinkStyle = $derived(
    isScannerRoute
      ? 'color: #e8dcc8; background: rgba(139, 126, 106, 0.15);'
      : 'color: #8b7e6a; background: transparent;',
  )
</script>

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

    <div
      class="mx-2 hidden h-4 w-px sm:block"
      style="background: rgba(139, 126, 106, 0.15);"
    ></div>

    <nav class="flex items-center gap-1">
      <a
        href="/scanner"
        class="rounded px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] transition-colors"
        style={scannerLinkStyle}
      >
        Scanner
      </a>

      {#if isChartRoute}
        <a
          href={pathname}
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
        <div
          class="h-8 w-8 rounded-full"
          style="background: rgba(139, 126, 106, 0.15);"
        ></div>
      </ClerkLoading>
      <ClerkLoaded>
        <UserButton />
      </ClerkLoaded>
    </div>
  </div>
</header>
