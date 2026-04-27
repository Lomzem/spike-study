<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'

  let { message }: { message: string } = $props()
  const normalizedMessage = $derived(message.replace(/[.!?]+$/, ''))
</script>

<div class="flex flex-1 items-center justify-center px-6 py-10">
  <section
    class="w-full max-w-xl rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm backdrop-blur-sm"
  >
    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      Database Setup
    </p>
    <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
      Chart is waiting for a database connection
    </h2>
    <p class="mt-3 text-sm leading-6 text-muted-foreground">
      {normalizedMessage}. Set <code>DATABASE_URL</code> or
      <code>TURSO_DATABASE_URL</code> and reload the app.
    </p>
    <div class="mt-6">
      <Button href="/scanner" variant="outline">Back to scanner</Button>
    </div>
  </section>
</div>
