import type { BaseEntity } from "./common";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const IDENTITY_ROLE_CODES = {
    SUPER_ADMIN: "ROLE_SUPER_ADMIN",
    ADMIN: "ROLE_ADMIN",
    DIRECTOR: "ROLE_DIRECTOR",
    TECH_MANAGER: "ROLE_TECH_MANAGER",
    TECHNICIAN: "ROLE_TECHNICIAN",
    SALES_EXEC: "ROLE_SALES_EXEC",
    CS: "ROLE_CS",
    VALIDATOR: "ROLE_VALIDATOR",
    QA: "ROLE_QA",
} as const;

export type IdentityRoleCode = (typeof IDENTITY_ROLE_CODES)[keyof typeof IDENTITY_ROLE_CODES] | string;

export type IdentityStatusValue = "active" | "inactive" | "banned";

/* ------------------------------------------------------------------ */
/*  Core Identity Type (matches API response)                          */
/* ------------------------------------------------------------------ */

export interface IdentityListItem {
    identityId: string;
    identityName: string;
    identityEmail: string;
    identityPhone: string | null;
    identityStatus: IdentityStatusValue;
    identityRoles: IdentityRoleCode[];
    identityPolicies: Record<string, "ALLOW" | "DENY" | "LIMIT">;
    identityPermission: Record<string, Record<string, number>>;
    alias: string | null;
    createdAt: string;
    modifiedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Query Params                                                       */
/* ------------------------------------------------------------------ */

export type IdentitiesGetListBody = {
    page?: number;
    itemsPerPage?: number;
    search?: string | null;
    searchTerm?: string | null;
    sortBy?: string;
    sortDir?: "ASC" | "DESC";
    identityRoles?: IdentityRoleCode[];
    identityStatus?: IdentityStatusValue[];
    [key: string]: unknown;
};

export type IdentitiesGetListInput = {
    query?: IdentitiesGetListBody;
};

/* ------------------------------------------------------------------ */
/*  Legacy types (kept for backward-compatibility)                     */
/* ------------------------------------------------------------------ */

/** @deprecated Use IdentityListItem instead */
export type IdentityRole = {
    admin?: boolean;
    customerService?: boolean;
    technician?: boolean;
    collaborator?: boolean;
    administrative?: boolean;
    accountant?: boolean;
    sampleManager?: boolean;
    superAdmin?: boolean;
    dispatchClerk?: boolean;
    documentManagementSpecialist?: boolean;
    bot?: boolean;
    IT?: boolean;
    marketingCommunications?: boolean;
    qualityControl?: boolean;
    [key: string]: boolean | undefined;
};

/** @deprecated Use IdentityListItem instead */
export interface Identity extends BaseEntity {
    identityId: string;
    email: string;
    identityName?: string;
    alias?: string;
    roles: IdentityRole;
    permissions?: Record<string, unknown>;
    password?: string;
    identityStatus: IdentityStatusValue;
}

export interface Session extends Omit<BaseEntity, "createdById" | "modifiedById"> {
    sessionId: string;
    identityId: string;
    sessionExpiry: string;
    sessionStatus: "active" | "expired" | "revoked";
    ipAddress?: string;
    sessionDomain?: string;
    createdAt: string;
    modifiedAt: string;
}
