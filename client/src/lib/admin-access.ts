export function canAccessAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role === "admin";
}
