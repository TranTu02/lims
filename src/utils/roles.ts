export const roleKeys = [
  "superAdmin",
  "admin",
  "technician",
  "qualityControl",
  "customerService",
  "accountant",
  "sampleManager",
  "dispatchClerk",
  "documentManagementSpecialist",
  "marketingCommunications",
  "collaborator",
  "administrative",
  "IT",
  "bot",
  "sale",
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
