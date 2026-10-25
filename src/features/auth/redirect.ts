const BASE = "http://melange.internal";

/**
 * Only allows internal paths after login ("/admin", "/carrito?x=1").
 * Blocks open redirects such as "https://evil.com", "//evil.com", "/\\evil.com" and
 * "/\t/evil.com" (browsers strip tabs/newlines, turning it into "//evil.com").
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  try {
    // Resolve like a browser would: anything that leaves our origin is rejected.
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
