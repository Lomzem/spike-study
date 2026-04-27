<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 8,
		children,
		...restProps
	}: WithoutChildrenOrChild<DropdownMenuPrimitive.ContentProps> & {
		children: Snippet;
	} = $props();
</script>

<DropdownMenuPrimitive.Content
	bind:ref
	data-slot="dropdown-menu-content"
	{sideOffset}
	class={cn(
		"z-50 min-w-40 rounded-md border border-border bg-[#1a1610] p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</DropdownMenuPrimitive.Content>
