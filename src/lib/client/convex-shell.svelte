<script lang="ts">
  import type { Snippet } from 'svelte'
  import { browser } from '$app/environment'
  import { env as publicEnv } from '$env/dynamic/public'
  import { setupConvex, useConvexClient } from 'convex-svelte'
  import { useClerkContext } from 'svelte-clerk'
  import { provideConvexAuthReady } from './convex-auth'

  const convexUrl = publicEnv.PUBLIC_CONVEX_URL ?? ''
  const hasConvexConfig = convexUrl.length > 0

  let { children }: { children: Snippet } = $props()
  const convexAuthReady = provideConvexAuthReady()


  if (browser && hasConvexConfig) {
    setupConvex(convexUrl)

    const clerk = useClerkContext()
    const convex = useConvexClient()

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
  } else {
    convexAuthReady.set(false)
  }
</script>

{@render children()}
