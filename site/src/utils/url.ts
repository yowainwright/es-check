const BASE_URL = import.meta.env.BASE_URL || "/es-check";
const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

export function resolveUrl(path: string): string {
  if (!path) return base || "/";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function normalizePathname(pathname: string): string {
  return pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
}
