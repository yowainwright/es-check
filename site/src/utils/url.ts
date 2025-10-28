/**
 * Helper function to construct URLs with proper base path handling
 * @param path - The path to append to the base URL (e.g., 'docs/gettingstarted' or '/docs/gettingstarted')
 * @returns The full URL with the base path properly handled
 */
export function getUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL;
  const hasTrailingSlash = baseUrl.endsWith("/");
  const pathWithoutLeadingSlash = path.startsWith("/") ? path.slice(1) : path;

  return `${baseUrl}${hasTrailingSlash ? "" : "/"}${pathWithoutLeadingSlash}`;
}

/**
 * Helper function to normalize a pathname by removing the base URL
 * Useful for comparing paths with sidebar items
 * @param pathname - The full pathname including base URL
 * @returns The pathname without the base URL
 */
export function normalizePathname(pathname: string): string {
  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  return pathname.startsWith(baseUrl)
    ? pathname.slice(baseUrl.length)
    : pathname;
}
