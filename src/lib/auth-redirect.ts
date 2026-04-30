export function sanitizeRedirectPath(
  redirect: string | null | undefined,
  fallback: string = '/profile'
) {
  if (!redirect || !redirect.startsWith('/')) {
    return fallback;
  }

  if (redirect.startsWith('//')) {
    return fallback;
  }

  return redirect;
}

export function buildAuthRedirectHref(
  basePath: '/auth/login' | '/auth/register',
  redirect: string
) {
  const params = new URLSearchParams({
    redirect: sanitizeRedirectPath(redirect, '/'),
  });

  return `${basePath}?${params.toString()}`;
}
