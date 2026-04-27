import { withClerkHandler } from 'svelte-clerk/server'
import { env as privateEnv } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'

const publishableKey = publicEnv.PUBLIC_CLERK_PUBLISHABLE_KEY
const secretKey = privateEnv.CLERK_SECRET_KEY

if (!publishableKey || !secretKey) {
  throw new Error('Missing PUBLIC_CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY')
}

export const handle = withClerkHandler({
  publishableKey,
  secretKey,
})
