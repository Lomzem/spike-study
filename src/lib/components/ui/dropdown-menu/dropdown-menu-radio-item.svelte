<script lang="ts">
	import CircleIcon from '@lucide/svelte/icons/circle';
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let { class: className, ...restProps }: DropdownMenuPrimitive.RadioItemProps = $props();
</script>

<DropdownMenuPrimitive.RadioItem
	data-slot="dropdown-menu-radio-item"
	class={cn(
		"relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pr-2 pl-7 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		className,
	)}
	{...restProps}
>
	{#snippet child({ props, checked })}
		<div {...props}>
			<span class="absolute left-2 flex size-3.5 items-center justify-center">
				{#if checked}
					<CircleIcon class="size-2 fill-current" />
				{/if}
			</span>
			{@render restProps.children?.({ checked })}
		</div>
	{/snippet}
</DropdownMenuPrimitive.RadioItem>
