<script lang="ts">
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Attachment } from 'svelte/attachments';

let { data } = $props();

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
    data.intradayData.map((row) => ({
      time: Math.floor(row.time / 1000) as UTCTimestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    })),
  );

  const volumeSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' } }, 1);
  volumeSeries.setData(
    data.intradayData.map((row) => ({
      time: Math.floor(row.time / 1000) as UTCTimestamp,
      value: row.volume,
      color: row.close > row.open ? '#26a69a' : '#ef5350',
    })),
  );

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
    chart.remove();
  };
};
</script>

{#if data.intradayData.length === 0}
  <p class="flex h-dvh w-dvw flex-col items-center justify-center">
    <span class="text-center text-xl">No data for {data.symbol} on {data.date}</span>
  </p>
{:else}
  <main {@attach createChartAttachment} class="h-dvh w-dvw"></main>
{/if}
