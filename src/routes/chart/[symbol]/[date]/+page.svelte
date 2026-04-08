<script lang="ts">
	let { data } = $props();
</script>

<h1>{data.symbol}</h1>
<p>{data.date}</p>

<pre>{JSON.stringify(data.intradayData, null, 2)}</pre>
