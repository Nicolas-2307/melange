/** True when `email` matches the configured ADMIN_EMAIL (case-insensitive). */
export function isAdminEmail(email: string, adminEmail: string | undefined): boolean {
  if (!adminEmail) return false;
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}
