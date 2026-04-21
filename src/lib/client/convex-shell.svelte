<script lang="ts">
  import type { Snippet } from 'svelte'
  import { setupConvex, useConvexClient } from 'convex-svelte'
  import { useClerkContext } from 'svelte-clerk'
  import { provideConvexAuthReady } from './convex-auth'

  const convexUrl =
    import.meta.env.PUBLIC_CONVEX_URL ?? import.meta.env.VITE_CONVEX_URL

  if (!convexUrl) {
    throw new Error('PUBLIC_CONVEX_URL or VITE_CONVEX_URL is not set')
  }

  setupConvex(convexUrl)

  let { children }: { children: Snippet } = $props()

  const clerk = useClerkContext()
  const convex = useConvexClient()
  const convexAuthReady = provideConvexAuthReady()

  $effect(() => {
    if (!clerk.isLoaded) {
      convexAuthReady.set(false)
      return
    }

    if (!clerk.session) {
      convexAuthReady.set(false)
      convex.setAuth(
        async () => null,
        () => {},
      )
      return
    }

    convex.setAuth(
      async () =>
        (await clerk.session?.getToken({ template: 'convex' })) ?? null,
      (isAuthenticated) => {
        convexAuthReady.set(isAuthenticated)
      },
    )
  })
</script>

{@render children()}
