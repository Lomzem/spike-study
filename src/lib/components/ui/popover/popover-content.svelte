<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		align = "end",
		sideOffset = 8,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<PopoverPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<PopoverPrimitive.PortalProps>;
		children: Snippet;
	} = $props();
</script>

<PopoverPrimitive.Portal {...portalProps}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		{align}
		{sideOffset}
		class={cn(
			"z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none opacity-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
