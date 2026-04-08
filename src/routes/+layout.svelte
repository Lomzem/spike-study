<script lang="ts">
import './layout.css';
import favicon from '$lib/assets/favicon.svg';

import type { Snippet } from 'svelte';
import { ClerkProvider } from 'svelte-clerk';

const { children }: { children: Snippet } = $props();
</script>

<svelte:head><link rel="icon" href={favicon}></svelte:head>
<ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
  <div class="min-h-dvh bg-background text-foreground">
    {@render children()}
  </div>
</ClerkProvider>
