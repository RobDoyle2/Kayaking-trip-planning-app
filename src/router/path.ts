/**
 * Turns whatever is in the address bar into the one form the app routes on.
 * Handles: repeated slashes (//leadership), a trailing slash, /index.html, and capital letters.
 * Routes are lower case, so IDs or other case-sensitive values belong in the query string, not the path.
 */
export function normalisePath(pathname: string): string {
  const cleaned = pathname
    .replace(/\/{2,}/g, '/')
    .replace(/\/index\.html$/i, '/')
    .toLowerCase()
    .replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}
