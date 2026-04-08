<script lang="ts">
	let { data } = $props();
</script>

<h1>{data.symbol}</h1>
<p>{data.date}</p>

{#if data.intradayData.length === 0}
	<p>No data found for {data.symbol} on {data.date}</p>
{:else}
	<pre>{JSON.stringify(data.intradayData, null, 2)}</pre>
{/if}
