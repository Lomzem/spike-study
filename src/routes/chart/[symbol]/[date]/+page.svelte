<script lang="ts">
import { createChart, LineSeries, type UTCTimestamp } from 'lightweight-charts';
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

	const lineSeries = chart.addSeries(LineSeries, {});
	lineSeries.setData(
		data.intradayData.map((row) => ({
			time: Math.floor(row.time / 1000) as UTCTimestamp,
			value: row.close
		}))
	);

	chart.timeScale().fitContent();

	return () => {
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
