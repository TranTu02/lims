import type { BaseEntity } from "./common";

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

export interface Identity extends BaseEntity {
    identityId: string;
    email: string;
    identityName?: string;
    alias?: string;
    roles: IdentityRole;
    permissions?: Record<string, any>; // Cấu trúc permission cụ thể tùy logic
    password?: string; // Thường không trả về password hash ở FE
    identityStatus: "active" | "inactive";
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
