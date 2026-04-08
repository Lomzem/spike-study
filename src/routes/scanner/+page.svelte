<script lang="ts">
import type { PageData } from './$types';
import ChevronLeft from '@lucide/svelte/icons/chevron-left';
import ChevronRight from '@lucide/svelte/icons/chevron-right';
import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
import X from '@lucide/svelte/icons/x';

let { data }: { data: PageData } = $props();

const integerFormatter = new Intl.NumberFormat('en-US');

// ── Formatting helpers ──

function commaFormat(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return integerFormatter.format(Number(digits));
}

function decimalFormat(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const whole = parts[0] ?? '';
  if (!whole && !parts[1]) return '';
  const formatted = whole ? integerFormatter.format(Number(whole)) : '0';
  return parts.length > 1 ? `${formatted}.${parts[1]}` : formatted;
}

function stripFormatting(val: string): string {
  return val.replace(/,/g, '');
}

function formatPrice(value: number) {
  return value.toFixed(2);
}

function formatPercent(value: number | null) {
  if (value == null) return '--';
  const percent = value * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
}

function formatWholeNumber(value: number | null) {
  if (value == null) return '--';
  return integerFormatter.format(value);
}

function changeColor(value: number | null): string {
  if (value == null) return 'var(--moss)';
  if (value > 0) return 'var(--green)';
  if (value < 0) return 'var(--amber)';
  return 'var(--moss)';
}

function accentBarColor(change: number | null): string {
  if (change == null) return 'var(--mist)';
  if (change > 0.05) return 'var(--green)';
  if (change > 0) return 'rgba(90, 138, 92, 0.4)';
  if (change < -0.05) return 'var(--amber)';
  if (change < 0) return 'rgba(196, 120, 58, 0.4)';
  return 'var(--mist)';
}

// ── Formatted filter state ──

const initialFilters = $derived(data.filters);
let minVolumeDisplay = $state('');
let minTradesDisplay = $state('');
let minPriceDisplay = $state('');
let maxPriceDisplay = $state('');

$effect(() => {
  minVolumeDisplay = initialFilters.minVolume ? commaFormat(initialFilters.minVolume) : '';
  minTradesDisplay = initialFilters.minTrades ? commaFormat(initialFilters.minTrades) : '';
  minPriceDisplay = initialFilters.minPrice ? decimalFormat(initialFilters.minPrice) : '';
  maxPriceDisplay = initialFilters.maxPrice ? decimalFormat(initialFilters.maxPrice) : '';
});

let minVolumeRaw = $derived(stripFormatting(minVolumeDisplay));
let minTradesRaw = $derived(stripFormatting(minTradesDisplay));
let minPriceRaw = $derived(stripFormatting(minPriceDisplay));
let maxPriceRaw = $derived(stripFormatting(maxPriceDisplay));

// ── Pagination ──

function buildPageHref(nextPage: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data.filters)) {
    if (value) params.set(key, value);
  }
  params.set('sortBy', data.sort.by);
  params.set('sortDir', data.sort.dir);
  params.set('pageSize', `${data.pageSize}`);
  params.set('page', `${nextPage}`);
  return `/scanner?${params.toString()}`;
}

const startRow = $derived(data.totalCount === 0 ? 0 : (data.page - 1) * data.pageSize + 1);
const endRow = $derived(Math.min(data.page * data.pageSize, data.totalCount));

const sortLabels: Record<string, string> = {
  date: 'Date',
  symbol: 'Symbol',
  open: 'Open',
  gap: 'Gap %',
  range: 'Range %',
  change: 'Change %',
  volume: 'Volume',
  trades: 'Trades',
};

const percentFields = [
  { name: 'minGap', label: 'Min gap %' },
  { name: 'maxGap', label: 'Max gap %' },
  { name: 'minRange', label: 'Min range %' },
  { name: 'minChange', label: 'Min change %' },
] as const;

let sidebarOpen = $state(false);
</script>

<svelte:head> <title>Scanner</title> </svelte:head>

<main
  class="relative flex h-[calc(100dvh-theme(spacing.10))] overflow-hidden"
  style="
    background: var(--canopy);
    --gold: #c4a46a;
    --green: #5a8a5c;
    --amber: #c4783a;
    --bark: #2a2318;
    --bark-deep: #1e1a11;
    --moss: #8b7e6a;
    --canopy: #1a1610;
    --mist: rgba(139, 126, 106, 0.15);
    --cream: #e8dcc8;
  "
>
  <!-- Grain -->
  <div
    class="pointer-events-none absolute inset-0 z-50 opacity-[0.025]"
    style="background-image: url('data:image/svg+xml,<svg viewBox=&quot;0 0 256 256&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><filter id=&quot;n&quot;><feTurbulence type=&quot;fractalNoise&quot; baseFrequency=&quot;0.9&quot; numOctaves=&quot;4&quot; stitchTiles=&quot;stitch&quot;/></filter><rect width=&quot;100%25&quot; height=&quot;100%25&quot; filter=&quot;url(%23n)&quot;/></svg>'); background-repeat: repeat; background-size: 256px 256px;"
  ></div>

  <!-- ═══ Mobile filter toggle ═══ -->
  <button
    type="button"
    class="absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center border transition-colors hover:border-[var(--gold)] lg:hidden"
    style="background: var(--bark); border-color: var(--mist); color: var(--moss);"
    onclick={() => sidebarOpen = !sidebarOpen}
  >
    {#if sidebarOpen}
      <X size={16} />
    {:else}
      <SlidersHorizontal size={16} />
    {/if}
  </button>

  <!-- ═══ Filter sidebar ═══ -->
  <aside
    class="absolute inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col border-r transition-transform duration-200 lg:relative lg:translate-x-0 {sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}"
    style="background: var(--bark-deep); border-color: var(--mist);"
    class:max-lg:shadow-2xl={sidebarOpen}
  >
    <div class="flex items-center gap-3 border-b px-5 py-4" style="border-color: var(--mist);">
      <h1
        style="font-family: 'Rubik', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--gold); line-height: 1;"
      >
        Scanner
      </h1>
      <span class="mt-px text-[0.625rem] uppercase tracking-[0.25em]" style="color: var(--moss);">
        Filters
      </span>
    </div>

    <form method="GET" class="flex min-h-0 flex-1 flex-col">
      <div class="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        <!-- Date range -->
        {#each [
          { name: 'minDate', label: 'Min date', value: data.filters.minDate },
          { name: 'maxDate', label: 'Max date', value: data.filters.maxDate },
        ] as field}
          <label class="block py-1.5">
            <span
              class="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.2em]"
              style="color: var(--moss);">{field.label}</span>
            <input
              name={field.name}
              type="text"
              value={field.value}
              placeholder="Any"
              onfocus={(e) => { e.currentTarget.type = 'date'; }}
              onblur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = 'text'; }}
              class="h-8 w-full border-b bg-transparent px-0 font-mono text-sm outline-none transition-colors placeholder:font-sans placeholder:text-[var(--moss)]/40 focus:border-b-[var(--gold)]"
              style="border-color: var(--mist); color: var(--cream); color-scheme: dark;"
            />
          </label>
        {/each}

        <div class="h-2"></div>

        <!-- Comma-formatted fields -->
        {#each [
          { label: 'Min volume', display: minVolumeDisplay, raw: minVolumeRaw, hiddenName: 'minVolume', handler: (v: string) => minVolumeDisplay = commaFormat(v), inputmode: 'numeric' as const },
          { label: 'Min trades', display: minTradesDisplay, raw: minTradesRaw, hiddenName: 'minTrades', handler: (v: string) => minTradesDisplay = commaFormat(v), inputmode: 'numeric' as const },
        ] as field}
          <label class="block py-1.5">
            <span
              class="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.2em]"
              style="color: var(--moss);"
              >{field.label}</span
            >
            <input type="hidden" name={field.hiddenName} value={field.raw}>
            <input
              type="text"
              inputmode={field.inputmode}
              value={field.display}
              oninput={(e) => field.handler(e.currentTarget.value)}
              placeholder="Any"
              class="h-8 w-full border-b bg-transparent px-0 text-sm outline-none transition-colors placeholder:text-[var(--moss)]/40 focus:border-b-[var(--gold)]"
              style="border-color: var(--mist); color: var(--cream);"
            >
          </label>
        {/each}

        <!-- Decimal-formatted price fields -->
        {#each [
          { label: 'Min open price', display: minPriceDisplay, raw: minPriceRaw, hiddenName: 'minPrice', handler: (v: string) => minPriceDisplay = decimalFormat(v) },
          { label: 'Max open price', display: maxPriceDisplay, raw: maxPriceRaw, hiddenName: 'maxPrice', handler: (v: string) => maxPriceDisplay = decimalFormat(v) },
        ] as field}
          <label class="block py-1.5">
            <span
              class="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.2em]"
              style="color: var(--moss);"
              >{field.label}</span
            >
            <input type="hidden" name={field.hiddenName} value={field.raw}>
            <input
              type="text"
              inputmode="decimal"
              value={field.display}
              oninput={(e) => field.handler(e.currentTarget.value)}
              placeholder="Any"
              class="h-8 w-full border-b bg-transparent px-0 text-sm outline-none transition-colors placeholder:text-[var(--moss)]/40 focus:border-b-[var(--gold)]"
              style="border-color: var(--mist); color: var(--cream);"
            >
          </label>
        {/each}

        <!-- Percent fields -->
        {#each percentFields as field}
          <label class="block py-1.5">
            <span
              class="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.2em]"
              style="color: var(--moss);"
              >{field.label}</span
            >
            <input
              name={field.name}
              type="number"
              step="0.01"
              value={data.filters[field.name]}
              placeholder="Any"
              class="h-8 w-full border-b bg-transparent px-0 text-sm outline-none transition-colors placeholder:text-[var(--moss)]/40 focus:border-b-[var(--gold)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              style="border-color: var(--mist); color: var(--cream);"
            >
          </label>
        {/each}

        <div class="h-3"></div>

        <!-- Sort -->
        <div class="py-1.5">
          <span
            class="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.2em]"
            style="color: var(--moss);"
            >Sort by</span
          >
          <div class="flex gap-2">
            <select
              name="sortBy"
              class="h-8 flex-1 border-b bg-transparent px-0 text-sm outline-none focus:border-b-[var(--gold)]"
              style="border-color: var(--mist); color: var(--cream);"
            >
              {#each data.sort.options as option}
                <option
                  value={option}
                  selected={option === data.sort.by}
                  style="background: var(--bark); color: var(--cream);"
                >
                  {sortLabels[option] ?? option}
                </option>
              {/each}
            </select>
            <select
              name="sortDir"
              class="h-8 w-20 border-b bg-transparent px-0 text-sm outline-none focus:border-b-[var(--gold)]"
              style="border-color: var(--mist); color: var(--cream);"
            >
              {#each data.sort.directions as direction}
                <option
                  value={direction}
                  selected={direction === data.sort.dir}
                  style="background: var(--bark); color: var(--cream);"
                >
                  {direction === 'asc' ? '↑ Asc' : '↓ Desc'}
                </option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Rows per page -->
        <div class="py-1.5">
          <span
            class="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.2em]"
            style="color: var(--moss);"
            >Rows per page</span
          >
          <select
            name="pageSize"
            class="h-8 w-full border-b bg-transparent px-0 text-sm outline-none focus:border-b-[var(--gold)]"
            style="border-color: var(--mist); color: var(--cream);"
          >
            {#each data.pageSizeOptions as option}
              <option
                value={option}
                selected={option === data.pageSize}
                style="background: var(--bark); color: var(--cream);"
              >
                {option}
              </option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Sidebar footer: actions -->
      <div class="flex flex-col gap-2 border-t px-4 py-4" style="border-color: var(--mist);">
        <input type="hidden" name="page" value="1">
        <button
          type="submit"
          class="flex h-9 w-full items-center justify-center text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
          style="background: var(--gold); color: var(--canopy);"
        >
          Run scan
        </button>
        <a
          href="/scanner"
          class="flex h-8 w-full items-center justify-center text-[0.6875rem] uppercase tracking-[0.15em] transition-colors hover:text-[var(--cream)]"
          style="color: var(--moss);"
        >
          Reset filters
        </a>
      </div>
    </form>
  </aside>

  <!-- ═══ Results panel ═══ -->
  <section class="relative flex min-w-0 flex-1 flex-col">
    <!-- Results header -->
    {#if data.hasScanned}
    <div
      class="flex shrink-0 items-center justify-between border-b px-5 py-3"
      style="border-color: var(--mist); background: rgba(42, 35, 24, 0.3);"
    >
      <div class="flex items-baseline gap-3">
        <span class="text-[0.6875rem] uppercase tracking-[0.2em]" style="color: var(--moss);"
          >Results</span
        >
        {#if data.totalCount > 0}
          <span class="text-xs tabular-nums" style="color: var(--cream);">
            {integerFormatter.format(data.totalCount)}
          </span>
          <span class="text-[0.625rem]" style="color: var(--moss);">
            showing {startRow}–{endRow}
          </span>
        {/if}
      </div>

      <!-- Pagination -->
      <div class="flex items-center gap-3">
        {#if data.totalCount > 0}
          <span class="text-[0.625rem] tabular-nums" style="color: var(--moss);">
            {data.page}/{data.totalPages}
          </span>
        {/if}
        <div class="flex">
          <a
            class="inline-flex h-7 w-7 items-center justify-center border transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] {data.page <= 1 ? 'pointer-events-none opacity-25' : ''}"
            style="border-color: var(--mist); color: var(--moss);"
            href={buildPageHref(Math.max(1, data.page - 1))}
            ><ChevronLeft size={14} /></a
          >
          <a
            class="inline-flex h-7 w-7 items-center justify-center border border-l-0 transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] {data.page >= data.totalPages || data.totalCount === 0 ? 'pointer-events-none opacity-25' : ''}"
            style="border-color: var(--mist); color: var(--moss);"
            href={buildPageHref(Math.min(data.totalPages, data.page + 1))}
            ><ChevronRight size={14} /></a
          >
        </div>
      </div>
    </div>
    {/if}

    <!-- Table -->
    {#if !data.hasScanned}
      <div class="flex flex-1 flex-col items-center justify-center gap-4">
        <div class="h-px w-16" style="background: var(--mist);"></div>
        <p class="text-sm" style="color: var(--moss);">Set your filters and hit Run Scan.</p>
        <div class="h-px w-16" style="background: var(--mist);"></div>
      </div>
    {:else if data.results.length === 0}
      <div class="flex flex-1 flex-col items-center justify-center gap-4">
        <div class="h-px w-16" style="background: var(--mist);"></div>
        <p class="text-sm" style="color: var(--moss);">No rows match the current scan.</p>
        <div class="h-px w-16" style="background: var(--mist);"></div>
      </div>
    {:else}
      <div class="flex-1 overflow-y-auto">
        <table class="w-full min-w-[780px] border-collapse">
          <thead class="sticky top-0 z-10" style="background: var(--canopy);">
            <tr>
              <!-- Accent bar spacer -->
              <th class="w-1" style="border-bottom: 1px solid var(--mist);"></th>
              {#each ['Date', 'Symbol', 'Open', 'Gap', 'Range', 'Change', 'Vol', 'Trades'] as header, i}
                <th
                  class="px-3 py-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] {i >= 2 ? 'text-right' : 'text-left'}"
                  style="color: var(--moss); border-bottom: 1px solid var(--mist);"
                >
                  {header}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each data.results as row, i}
              <tr
                class="group cursor-pointer border-b border-[var(--mist)] transition-colors hover:bg-[rgba(196,164,106,0.04)]"
                style="animation: rowIn 0.3s ease both; animation-delay: {Math.min(i * 20, 400)}ms;"
                onclick={() => window.location.href = `/chart/${encodeURIComponent(row.symbol)}/${row.date}`}
              >
                <!-- Accent bar -->
                <td class="w-1 p-0">
                  <div
                    class="h-full w-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                    style="background: {accentBarColor(row.change)};"
                  ></div>
                </td>

                <td
                  class="px-3 py-2.5 font-mono text-[0.6875rem] tabular-nums"
                  style="color: var(--moss);"
                >
                  {row.date}
                </td>
                <td class="px-3 py-2.5">
                  <span class="text-sm font-bold tracking-wide" style="color: var(--gold);"
                    >{row.symbol}</span
                  >
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-[0.6875rem] tabular-nums"
                  style="color: var(--cream);"
                >
                  {formatPrice(row.open)}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-[0.6875rem] tabular-nums"
                  style="color: {changeColor(row.gap)};"
                >
                  {formatPercent(row.gap)}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-[0.6875rem] tabular-nums"
                  style="color: {changeColor(row.range)};"
                >
                  {formatPercent(row.range)}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-[0.6875rem] tabular-nums"
                  style="color: {changeColor(row.change)};"
                >
                  {formatPercent(row.change)}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-[0.6875rem] tabular-nums"
                  style="color: var(--cream);"
                >
                  {formatWholeNumber(row.volume)}
                </td>
                <td
                  class="px-3 py-2.5 text-right font-mono text-[0.6875rem] tabular-nums"
                  style="color: var(--cream);"
                >
                  {formatWholeNumber(row.trades)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <!-- Bottom accent -->
    <div
      class="h-px w-full shrink-0"
      style="background: linear-gradient(90deg, transparent, var(--gold), transparent);"
    ></div>
  </section>

  <!-- Mobile overlay backdrop -->
  {#if sidebarOpen}
    <button
      type="button"
      class="absolute inset-0 z-20 bg-black/50 lg:hidden"
      onclick={() => sidebarOpen = false}
      aria-label="Close filters"
    ></button>
  {/if}
</main>

<style>
@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar — thin bark-and-gold track */
main ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
main ::-webkit-scrollbar-track {
  background: rgba(30, 26, 17, 0.6);
}
main ::-webkit-scrollbar-thumb {
  background: rgba(196, 164, 106, 0.25);
  border-radius: 0;
}
main ::-webkit-scrollbar-thumb:hover {
  background: rgba(196, 164, 106, 0.45);
}
main ::-webkit-scrollbar-corner {
  background: transparent;
}
main {
  scrollbar-color: rgba(196, 164, 106, 0.25) rgba(30, 26, 17, 0.6);
  scrollbar-width: thin;
}
</style>
