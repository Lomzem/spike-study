<script lang="ts">
  import type { PageProps } from './$types'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    buildScannerPageHref,
    buildScannerSortHref,
  } from './scanner-navigation'
  import ScannerEmptyState from './components/scanner-empty-state.svelte'
  import ScannerFilterPanel from './components/scanner-filter-panel.svelte'
  import ScannerResultsHeader from './components/scanner-results-header.svelte'
  import ScannerResultsTable from './components/scanner-results-table.svelte'

  let { data }: PageProps = $props()

  const startRow = $derived(
    data.totalCount === 0 ? 0 : (data.page - 1) * data.pageSize + 1,
  )
  const endRow = $derived(Math.min(data.page * data.pageSize, data.totalCount))

  const navigationState = $derived({
    filters: data.filters,
    sortBy: data.sortBy,
    sortDir: data.sortDir,
    pageSize: data.pageSize,
  })
</script>

<svelte:head>
  <title>Scanner</title>
</svelte:head>

<main
  class="relative flex h-[calc(100dvh-3rem)] overflow-hidden"
  style="background: radial-gradient(circle at top left, rgba(196, 164, 106, 0.12), transparent 24%), linear-gradient(180deg, rgba(26, 22, 16, 0.98), rgba(18, 15, 11, 1));"
>
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.04]"
    style="background-image: linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px); background-size: 24px 24px;"
  ></div>

  <ScannerFilterPanel
    filters={data.filters}
    sortBy={data.sortBy}
    sortDir={data.sortDir}
    pageSize={data.pageSize}
    pageSizeOptions={data.pageSizeOptions}
  />

  <section class="relative flex min-w-0 flex-1 flex-col bg-background/65 backdrop-blur-sm">
    {#if data.dbError}
      <div class="flex flex-1 items-center justify-center px-6 py-10">
        <section class="w-full max-w-xl rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Database Setup
          </p>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Scanner is waiting for a database connection
          </h2>
          <p class="mt-3 text-sm leading-6 text-muted-foreground">
            {data.dbError}. Set `DATABASE_URL` or `TURSO_DATABASE_URL` and reload the app.
          </p>
          <div class="mt-6">
            <Button href="/login" variant="outline">Back to login</Button>
          </div>
        </section>
      </div>
    {:else if data.hasScanned}
      <ScannerResultsHeader
        startRow={startRow}
        endRow={endRow}
        totalCount={data.totalCount}
        page={data.page}
        totalPages={data.totalPages}
        previousHref={buildScannerPageHref(navigationState, Math.max(1, data.page - 1))}
        nextHref={buildScannerPageHref(
          navigationState,
          Math.min(data.totalPages, data.page + 1),
        )}
      />
    {/if}

    {#if !data.dbError && data.rows.length > 0}
      <ScannerResultsTable
        rows={data.rows}
        sortBy={data.sortBy}
        sortDir={data.sortDir}
        buildSortHref={(column) => buildScannerSortHref(navigationState, column)}
      />
    {:else if !data.dbError}
      <ScannerEmptyState hasScanned={data.hasScanned} />
    {/if}

    <div class="h-px w-full shrink-0 bg-linear-to-r from-transparent via-primary/70 to-transparent"></div>
  </section>
</main>
