export const roleKeys = [
  // 1. Executive & Management
  "ROLE_DIRECTOR",
  "ROLE_TECH_MANAGER",
  "ROLE_QA_MANAGER",

  // 2. Technical Operations
  "ROLE_SECTION_HEAD",
  "ROLE_VALIDATOR",
  "ROLE_SENIOR_ANALYST",
  "ROLE_TECHNICIAN",
  "ROLE_IPC_INSPECTOR",
  "ROLE_RND_SPECIALIST",

  // 3. Sample & Logistics
  "ROLE_RECEPTIONIST",
  "ROLE_SAMPLER",
  "ROLE_SAMPLE_CUSTODIAN",
  "ROLE_EQUIPMENT_MGR",
  "ROLE_INVENTORY_MGR",

  // 4. Commercial & Admin
  "ROLE_SALES_MANAGER",
  "ROLE_SALES_EXEC",
  "ROLE_SALES_COLLABORATOR",
  "ROLE_CS",
  "ROLE_ACCOUNTANT",
  "ROLE_REPORT_OFFICER",

  // 5. System Support
  "ROLE_SUPER_ADMIN",
  "ROLE_DOC_CONTROLLER",
  "ROLE_HSE_OFFICER",

  // Backward compatibility / Legacy
  "ROLE_ADMIN",
  "ROLE_CUSTOMER"
] as const;

export type RoleKey = (typeof roleKeys)[number];

export function pickRoles(roles: unknown, keys: readonly RoleKey[]) {
  const src = roles;
  const out: Record<RoleKey, boolean> = {} as Record<RoleKey, boolean>;
  
  if (Array.isArray(src)) {
    keys.forEach((k) => {
      out[k] = src.includes(k);
    });
  } else if (src && typeof src === "object") {
    const obj = src as Record<string, unknown>;
    keys.forEach((k) => {
      out[k] = Boolean(obj[k]);
    });
  } else {
    keys.forEach((k) => {
      out[k] = false;
    });
  }
  
  return out;
}

export function mergeRoles(
  base: Record<string, boolean>,
  patch: Record<string, boolean>
): Record<string, boolean> {
  return { ...base, ...patch };
}

export function activeRoleKeys(roles: unknown): string[] {
  if (!roles) return [];
  
  if (Array.isArray(roles)) {
    return roles.filter(r => typeof r === 'string');
  }
  
  if (typeof roles === "object") {
    return Object.entries(roles as Record<string, unknown>)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
  }
  
  return [];
}
