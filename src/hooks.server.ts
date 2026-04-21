import { withClerkHandler } from 'svelte-clerk/server'

const publishableKey =
  import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ??
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ??
  process.env.PUBLIC_CLERK_PUBLISHABLE_KEY ??
  process.env.VITE_CLERK_PUBLISHABLE_KEY ??
  process.env.CLERK_PUBLISHABLE_KEY

const secretKey =
  import.meta.env.CLERK_SECRET_KEY ?? process.env.CLERK_SECRET_KEY

export const handle = withClerkHandler({
  publishableKey,
  secretKey,
})
