import { redirect } from '@sveltejs/kit';
import { buildClerkProps } from 'svelte-clerk/server';
import type { LayoutServerLoad } from './$types';

function isPublicRoute(pathname: string) {
  return (
    pathname === '/sign-in' ||
    pathname.startsWith('/sign-in/') ||
    pathname === '/sign-up' ||
    pathname.startsWith('/sign-up/')
  );
}

function sanitizeRedirectUrl(value: string | null) {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return '/scanner';
  }

  return value;
}

function buildRedirectTarget(url: URL) {
  return `${url.pathname}${url.search}`;
}

export const load: LayoutServerLoad = ({ locals, url }) => {
  const auth = locals.auth();
  const routeIsPublic = isPublicRoute(url.pathname);
  const redirectUrl = sanitizeRedirectUrl(url.searchParams.get('redirect_url'));

  if (!auth.userId && !routeIsPublic) {
    const signInUrl = new URL('/sign-in', url);
    signInUrl.searchParams.set('redirect_url', buildRedirectTarget(url));

    throw redirect(307, signInUrl);
  }

  if (auth.userId && routeIsPublic) {
    throw redirect(307, redirectUrl);
  }

  return {
    ...buildClerkProps(auth),
  };
};
