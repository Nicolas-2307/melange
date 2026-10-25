/**
 * Only allows internal paths after login ("/admin", "/carrito?x=1").
 * Blocks open redirects such as "https://evil.com", "//evil.com" or "/\\evil.com".
 */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
