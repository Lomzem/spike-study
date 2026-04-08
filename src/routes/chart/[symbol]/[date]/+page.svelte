<script lang="ts">
	import {
		CandlestickSeries,
		createChart,
		LineSeries,
		type UTCTimestamp
	} from 'lightweight-charts';
	import { onMount } from 'svelte';

	let { data } = $props();

	let chartElement: HTMLElement | undefined;

	onMount(() => {
		if (!chartElement) return;
		if (data.intradayData.length === 0) return;

		const chart = createChart(chartElement, {
			width: chartElement.clientWidth,
			height: chartElement.clientHeight
		});

		const lineSeries = chart.addSeries(LineSeries, {});
		lineSeries.setData(
			data.intradayData.map((row) => ({
				time: row.time as UTCTimestamp,
				value: row.close
			}))
		);

		chart.timeScale().fitContent();

		return () => {
			chart.remove();
		};
	});
</script>

<main bind:this={chartElement} class="h-dvh w-dvw"></main>
