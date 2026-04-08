<script lang="ts">
import { goto } from '$app/navigation';
import { Button } from '$lib/components/ui/button';
import { Calendar } from '$lib/components/ui/calendar';
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

function handleCalendarChange(date: DateValue | undefined) {
  if (!date) return;
  navigateToDate(dateValueToString(date));
}

function isCalendarDateDisabled(date: DateValue) {
  const dateString = dateValueToString(date);
  return dateString !== data.date && !isSelectableDate(dateString);
}

const createChartAttachment: Attachment<HTMLElement> = (chartElement) => {
  const chart = createChart(chartElement, {
    timeScale: {
      timeVisible: true,
    },
    width: chartElement.clientWidth,
    height: chartElement.clientHeight,
  });

  const candlestickSeries = chart.addSeries(
    CandlestickSeries,
    {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
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
      color: row.close > row.open ? '#26a69a' : '#ef5350',
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

<main class="flex h-dvh w-dvw flex-col">
  <div class="flex flex-wrap items-start gap-3 border-b px-4 py-3 text-sm">
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex flex-col gap-1 text-xs uppercase tracking-wide text-muted-foreground">
        Chart Date
        <Popover.Root bind:open={isDatePickerOpen}>
          <Popover.Trigger>
            <Button type="button" variant="outline" class="w-36 justify-start font-normal">
              {data.date}
            </Button>
          </Popover.Trigger>
          <Popover.Content align="start" class="w-auto p-0">
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
      </label>
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-2 pt-1">
      <span><strong>Symbol:</strong> {data.symbol}</span>
      <span><strong>Date:</strong> {data.date}</span>
      <span><strong>Open:</strong> {activeRow?.open}</span>
      <span><strong>High:</strong> {activeRow?.high}</span>
      <span><strong>Low:</strong> {activeRow?.low}</span>
      <span><strong>Close:</strong> {activeRow?.close}</span>
      <span><strong>Volume:</strong> {activeRow?.volume.toLocaleString()}</span>
    </div>
  </div>
  {#if data.intradayData.length === 0}
    <div class="flex flex-1 items-center justify-center px-4">
      <span class="text-center text-xl">No data for {data.symbol} on {data.date}</span>
    </div>
  {:else}
    <div class="min-h-0 flex-1" {@attach createChartAttachment}></div>
  {/if}
</main>
