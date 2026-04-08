<script lang="ts">
import { CandlestickSeries, createChart, type UTCTimestamp } from 'lightweight-charts';
import { onMount } from 'svelte';

let { data } = $props();

let chartElement: HTMLElement | undefined = $state(undefined);

onMount(() => {
	if (!chartElement) return;

	const chart = createChart(chartElement, {
		timeScale: {
			timeVisible: true
		},
		width: chartElement.clientWidth,
		height: chartElement.clientHeight
	});

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
    });
    candlestickSeries.setData(
        data.intradayData.map((row) => ({
            time: Math.floor(row.time / 1000) as UTCTimestamp,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close
        }))
    );

    const resizeObserver = new ResizeObserver(() => {
        if (!chartElement) return;
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
});
</script>

{#if data.intradayData.length === 0}
	<p class="flex h-dvh w-dvw flex-col items-center justify-center">
		<span class="text-center text-xl">No data for {data.symbol} on {data.date}</span>
	</p>
{:else}
	<main bind:this={chartElement} class="h-dvh w-dvw"></main>
{/if}
