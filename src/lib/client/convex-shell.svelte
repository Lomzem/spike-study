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
    let authMode: 'loading' | 'signed-out' | 'signed-in' = 'loading'

    async function fetchConvexToken() {
      return (await clerk.session?.getToken({ template: 'convex' })) ?? null
    }

    function handleAuthChange(isAuthenticated: boolean) {
      convexAuthReady.set(isAuthenticated)
    }

    $effect(() => {
      if (!clerk.isLoaded) {
        authMode = 'loading'
        return
      }

      if (!clerk.session) {
        if (authMode !== 'signed-out') {
          authMode = 'signed-out'
          convexAuthReady.set(false)
          convex.setAuth(
            async () => null,
            () => {},
          )
        }
        return
      }

      if (authMode !== 'signed-in') {
        authMode = 'signed-in'
        convex.setAuth(fetchConvexToken, handleAuthChange)
      }
    })
  }
</script>

{@render children()}
