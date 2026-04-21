import { redirect } from '@sveltejs/kit'
import { buildClerkProps } from 'svelte-clerk/server'
import type { LayoutServerLoad } from './$types'
import {
  buildRedirectTarget,
  sanitizeRedirectTarget,
} from '$lib/server/auth/redirect'

function isPublicRoute(pathname: string) {
  return pathname === '/login' || pathname.startsWith('/login/')
}

export const load: LayoutServerLoad = ({ locals, url }) => {
  const auth = locals.auth()
  const routeIsPublic = isPublicRoute(url.pathname)
  const redirectTarget = sanitizeRedirectTarget(
    url.searchParams.get('redirect_url'),
  )

  if (!auth.userId && !routeIsPublic) {
    const loginUrl = new URL('/login', url)
    loginUrl.searchParams.set('redirect_url', buildRedirectTarget(url))

    throw redirect(307, loginUrl)
  }

  if (auth.userId && routeIsPublic) {
    throw redirect(307, redirectTarget)
  }

  return {
    ...buildClerkProps(auth),
    userId: auth.userId,
  }
}
