export const roleKeys = [
  "ROLE_SUPER_ADMIN",
  "ROLE_ADMIN",
  "ROLE_MANAGER",
  "ROLE_TECHNICIAN",
  "ROLE_QC",
  "ROLE_CSKH",
  "ROLE_ACCOUNTANT",
  "ROLE_SAMPLE_MANAGER",
  "ROLE_DISPATCH_CLERK",
  "ROLE_DOCUMENT_SPECIALIST",
  "ROLE_MARKETING",
  "ROLE_COLLABORATOR",
  "ROLE_ADMINISTRATIVE",
  "ROLE_IT",
  "ROLE_BOT",
  "ROLE_SALE",
  "ROLE_VALIDATOR",
] as const;

export type RoleKey = (typeof roleKeys)[number];

export function pickRoles(roles: unknown, keys: readonly RoleKey[]) {
  const src: Record<string, unknown> =
    roles && typeof roles === "object"
      ? (roles as Record<string, unknown>)
      : {};

  const out: Record<RoleKey, boolean> = {} as Record<RoleKey, boolean>;
  keys.forEach((k) => {
    out[k] = Boolean(src[k]);
  });
  return out;
}

export function mergeRoles(
  base: Record<string, boolean>,
  patch: Record<string, boolean>
): Record<string, boolean> {
  return { ...base, ...patch };
}

export function activeRoleKeys(roles: unknown): string[] {
  if (!roles || typeof roles !== "object") return [];
  return Object.entries(roles as Record<string, unknown>)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);
}
