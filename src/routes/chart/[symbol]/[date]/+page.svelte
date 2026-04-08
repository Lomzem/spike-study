<script lang="ts">
import { goto } from '$app/navigation';
import { Button } from '$lib/components/ui/button';
import { Calendar } from '$lib/components/ui/calendar';
import * as Card from '$lib/components/ui/card';
import { Separator } from '$lib/components/ui/separator';
import * as Tooltip from '$lib/components/ui/tooltip';
import * as Popover from '$lib/components/ui/popover';
import { parseDate, type DateValue } from '@internationalized/date';
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type MouseEventParams,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Attachment } from 'svelte/attachments';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import ArrowRight from '@lucide/svelte/icons/arrow-right';
import BarChart3 from '@lucide/svelte/icons/bar-chart-3';

let { data } = $props();

const availableDateSet = $derived(new Set(data.availableDates));
const selectedCalendarDate = $derived(parseDate(data.date));

let isDatePickerOpen = $state(false);

const chartRows = $derived(
  data.intradayData.map((row) => ({
    ...row,
    chartTime: Math.floor(row.time / 1000) as UTCTimestamp,
  })),
);

const defaultRow = $derived(chartRows.at(-1) ?? null);
let activeRow = $state<(typeof chartRows)[number] | null>(null);

const chartRowsByTime = $derived(new Map(chartRows.map((row) => [row.chartTime, row])));

const currentDateIndex = $derived(data.availableDates.indexOf(data.date));
const prevDate = $derived(currentDateIndex > 0 ? data.availableDates[currentDateIndex - 1] : null);
const nextDate = $derived(
  currentDateIndex < data.availableDates.length - 1
    ? data.availableDates[currentDateIndex + 1]
    : null,
);

$effect(() => {
  activeRow = defaultRow;
});

function resetActiveRow() {
  activeRow = defaultRow;
}

function dateValueToString(date: DateValue) {
  return `${date.year}-${`${date.month}`.padStart(2, '0')}-${`${date.day}`.padStart(2, '0')}`;
}

function isSelectableDate(date: string) {
  return availableDateSet.has(date);
}

function navigateToDate(date: string) {
  if (date === data.date || !isSelectableDate(date)) return;
  isDatePickerOpen = false;
  void goto(`/chart/${encodeURIComponent(data.symbol)}/${date}`);
}

function goToDate(date: string | null) {
  if (date) navigateToDate(date);
}

function handleCalendarChange(date: DateValue | undefined) {
  if (!date) return;
  navigateToDate(dateValueToString(date));
}

function isCalendarDateDisabled(date: DateValue) {
  const dateString = dateValueToString(date);
  return dateString !== data.date && !isSelectableDate(dateString);
}

function formatPrice(n: number | undefined) {
  if (n == null) return '--';
  return n.toFixed(2);
}

function formatVolume(n: number | undefined) {
  if (n == null) return '--';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const createChartAttachment: Attachment<HTMLElement> = (chartElement) => {
  const chart = createChart(chartElement, {
    layout: {
      background: { color: 'transparent' },
      textColor: '#8b7e6a',
      fontFamily: "'Geist Variable', sans-serif",
      fontSize: 12,
    },
    grid: {
      vertLines: { color: 'rgba(139, 126, 106, 0.08)' },
      horzLines: { color: 'rgba(139, 126, 106, 0.08)' },
    },
    crosshair: {
      vertLine: { color: 'rgba(196, 164, 106, 0.3)', labelBackgroundColor: '#2a2318' },
      horzLine: { color: 'rgba(196, 164, 106, 0.3)', labelBackgroundColor: '#2a2318' },
    },
    timeScale: {
      timeVisible: true,
      borderColor: 'rgba(139, 126, 106, 0.15)',
    },
    rightPriceScale: {
      borderColor: 'rgba(139, 126, 106, 0.15)',
    },
    width: chartElement.clientWidth,
    height: chartElement.clientHeight,
  });

  const candlestickSeries = chart.addSeries(
    CandlestickSeries,
    {
      upColor: '#5a8a5c',
      downColor: '#c4783a',
      borderVisible: false,
      wickUpColor: '#5a8a5c',
      wickDownColor: '#c4783a',
    },
    0,
  );
  candlestickSeries.setData(
    chartRows.map((row) => ({
      time: row.chartTime,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    })),
  );

  const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' } }, 1);
  volumeSeries.setData(
    chartRows.map((row) => ({
      time: row.chartTime,
      value: row.volume,
      color: row.close > row.open ? 'rgba(90, 138, 92, 0.5)' : 'rgba(196, 120, 58, 0.5)',
    })),
  );

  const handleCrosshairMove = (param: MouseEventParams) => {
    if (!param.point || !param.time) {
      resetActiveRow();
      return;
    }
    activeRow = chartRowsByTime.get(param.time as UTCTimestamp) ?? defaultRow;
  };

  chart.subscribeCrosshairMove(handleCrosshairMove);

  const candlesPane = chart.panes()[0];
  candlesPane.setHeight((chartElement.clientHeight * 3) / 4);

  const resizeObserver = new ResizeObserver(() => {
    const width = chartElement.clientWidth;
    const height = chartElement.clientHeight;
    if (width <= 0 || height <= 0) return;
    chart.resize(width, height);
  });
  resizeObserver.observe(chartElement);

  return () => {
    resizeObserver.disconnect();
    chart.unsubscribeCrosshairMove(handleCrosshairMove);
    chart.remove();
  };
};
</script>

<main
  class="relative flex h-dvh w-dvw flex-col overflow-hidden"
  style="
    background: #1a1610;
    --forest-gold: #c4a46a;
    --forest-green: #5a8a5c;
    --forest-amber: #c4783a;
    --forest-bark: #2a2318;
    --forest-moss: #8b7e6a;
    --forest-canopy: #1a1610;
    --forest-mist: rgba(139, 126, 106, 0.15);
  "
>
  <!-- Subtle grain texture overlay -->
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.03]"
    style="background-image: url('data:image/svg+xml,<svg viewBox=&quot;0 0 256 256&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><filter id=&quot;n&quot;><feTurbulence type=&quot;fractalNoise&quot; baseFrequency=&quot;0.9&quot; numOctaves=&quot;4&quot; stitchTiles=&quot;stitch&quot;/></filter><rect width=&quot;100%25&quot; height=&quot;100%25&quot; filter=&quot;url(%23n)&quot;/></svg>'); background-repeat: repeat; background-size: 256px 256px;"
  ></div>

  <!-- Top bar -->
  <header
    class="relative z-10 flex items-center border-b px-5 py-3"
    style="border-color: var(--forest-mist); background: rgba(26, 22, 16, 0.9); backdrop-filter: blur(12px);"
  >
    <!-- Left: Symbol + Date Navigation + OHLCV -->
    <div class="flex items-center gap-4">
      <h1
        class="tracking-tight"
        style="font-family: 'Rubik', sans-serif; font-size: 1.75rem; font-weight: 700; color: var(--forest-gold); line-height: 1;"
      >
        {data.symbol}
      </h1>

      <!-- Date Picker -->
      <Popover.Root bind:open={isDatePickerOpen}>
        <Popover.Trigger>
          <Button
            type="button"
            variant="outline"
            class="h-9 gap-2.5 border px-4 font-mono text-sm tabular-nums"
            style="border-color: var(--forest-mist); background: transparent; color: #e8dcc8;"
          >
            <CalendarDays size={16} style="color: var(--forest-moss);" />
            {data.date}
          </Button>
        </Popover.Trigger>
        <Popover.Content
          align="start"
          class="w-auto p-0 font-mono tabular-nums"
          style="--popover: #2a2318; --popover-foreground: #e8dcc8; --accent: #3a3228; --accent-foreground: #e8dcc8; --muted: #3a3228; --muted-foreground: #8b7e6a; --foreground: #e8dcc8; --ring: #c4a46a; border-color: var(--forest-mist);"
        >
          <Calendar
            type="single"
            value={selectedCalendarDate}
            placeholder={selectedCalendarDate}
            onValueChange={handleCalendarChange}
            isDateDisabled={isCalendarDateDisabled}
            initialFocus
          />
        </Popover.Content>
      </Popover.Root>

      <Separator orientation="vertical" class="h-5" style="background: var(--forest-mist);" />

      <!-- OHLCV Row -->
      <div class="flex items-center gap-4" style="font-size: 0.875rem;">
        {#each [
          { label: 'O', value: formatPrice(activeRow?.open), key: 'open' },
          { label: 'H', value: formatPrice(activeRow?.high), key: 'high' },
          { label: 'L', value: formatPrice(activeRow?.low), key: 'low' },
          { label: 'C', value: formatPrice(activeRow?.close), key: 'close' },
        ] as item}
          <Tooltip.Root>
            <Tooltip.Trigger>
              <span class="flex items-center gap-1.5">
                <span
                  style="color: var(--forest-moss); text-transform: uppercase; letter-spacing: 0.1em;"
                  >{item.label}</span
                >
                <span style="color: #e8dcc8; font-weight: 500;">{item.value}</span>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content
              style="--foreground: #2a2318; --background: #c4a46a; border: 1px solid var(--forest-mist);"
            >
              {item.key === 'open' ? 'Open' : item.key === 'high' ? 'High' : item.key === 'low' ? 'Low' : 'Close'}
            </Tooltip.Content>
          </Tooltip.Root>
        {/each}

        <Separator orientation="vertical" class="h-3.5" style="background: var(--forest-mist);" />

        <Tooltip.Root>
          <Tooltip.Trigger>
            <span class="flex items-center gap-1.5">
              <BarChart3 size={14} style="color: var(--forest-moss);" />
              <span style="color: #e8dcc8; font-weight: 500;"
                >{formatVolume(activeRow?.volume)}</span
              >
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content
            style="--foreground: #2a2318; --background: #c4a46a; border: 1px solid var(--forest-mist);"
          >
            Volume: {activeRow?.volume.toLocaleString() ?? '--'}
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>
  </header>

  <!-- Chart area -->
  {#if data.intradayData.length === 0}
    <div class="flex flex-1 items-center justify-center px-4">
      <Card.Root class="border-0" style="background: var(--forest-bark); max-width: 24rem;">
        <Card.Header>
          <Card.Title style="font-size: 1.5rem; color: var(--forest-gold);">
            No Data Available
          </Card.Title>
          <Card.Description style="color: var(--forest-moss); font-size: 0.925rem;">
            No intraday data exists for {data.symbol} on {data.date}.
          </Card.Description>
        </Card.Header>
        {#if prevDate || nextDate}
          <Card.Footer class="gap-2" style="border-color: var(--forest-mist);">
            {#if prevDate}
              <Button
                variant="outline"
                size="sm"
                class="text-xs"
                style="border-color: var(--forest-mist); color: var(--forest-gold);"
                onclick={() => goToDate(prevDate)}
              >
                <ArrowLeft size={12} /> {prevDate}
              </Button>
            {/if}
            {#if nextDate}
              <Button
                variant="outline"
                size="sm"
                class="text-xs"
                style="border-color: var(--forest-mist); color: var(--forest-gold);"
                onclick={() => goToDate(nextDate)}
              >
                {nextDate} <ArrowRight size={12} />
              </Button>
            {/if}
          </Card.Footer>
        {/if}
      </Card.Root>
    </div>
  {:else}
    <div class="relative min-h-0 flex-1" {@attach createChartAttachment}></div>
  {/if}

  <!-- Bottom accent line -->
  <div
    class="h-px w-full"
    style="background: linear-gradient(90deg, transparent, var(--forest-gold), transparent);"
  ></div>
</main>
