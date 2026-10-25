/** True when `email` is one of the configured ADMIN_EMAILS (case-insensitive). */
export function isAdminEmail(email: string, adminEmails: readonly string[]): boolean {
  const normalized = email.trim().toLowerCase();
  return adminEmails.some((adminEmail) => adminEmail.trim().toLowerCase() === normalized);
}
