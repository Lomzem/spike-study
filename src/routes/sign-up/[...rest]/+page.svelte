<script lang="ts">
import { page } from '$app/state';
import { SignUp } from 'svelte-clerk';

const redirectUrl = $derived.by(() => {
  const value = page.url.searchParams.get('redirect_url');

  if (!value?.startsWith('/') || value.startsWith('//')) {
    return '/scanner';
  }

  return value;
});
</script>

<main class="flex min-h-dvh items-center justify-center bg-background px-6 py-10 text-foreground">
  <SignUp
    path="/sign-up"
    routing="path"
    signInUrl="/sign-in"
    forceRedirectUrl={redirectUrl}
    fallbackRedirectUrl="/scanner"
  />
</main>
