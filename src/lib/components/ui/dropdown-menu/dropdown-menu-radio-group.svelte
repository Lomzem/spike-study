<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	let { value = $bindable(""), ...restProps }: DropdownMenuPrimitive.RadioGroupProps = $props();
</script>

<DropdownMenuPrimitive.RadioGroup bind:value data-slot="dropdown-menu-radio-group" {...restProps} />
