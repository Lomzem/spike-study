<script lang="ts">
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type MouseEventParams,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Attachment } from 'svelte/attachments';

let { data } = $props();

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

{#if data.intradayData.length === 0}
  <p class="flex h-dvh w-dvw flex-col items-center justify-center">
    <span class="text-center text-xl">No data for {data.symbol} on {data.date}</span>
  </p>
{:else}
  <main class="flex h-dvh w-dvw flex-col">
    <div class="flex flex-wrap gap-x-4 gap-y-2 border-b px-4 py-3 text-sm">
      <span><strong>Symbol:</strong> {data.symbol}</span>
      <span><strong>Date:</strong> {data.date}</span>
      <span><strong>Open:</strong> {activeRow?.open}</span>
      <span><strong>High:</strong> {activeRow?.high}</span>
      <span><strong>Low:</strong> {activeRow?.low}</span>
      <span><strong>Close:</strong> {activeRow?.close}</span>
      <span><strong>Volume:</strong> {activeRow?.volume.toLocaleString()}</span>
    </div>
    <div class="min-h-0 flex-1" {@attach createChartAttachment}></div>
  </main>
{/if}
