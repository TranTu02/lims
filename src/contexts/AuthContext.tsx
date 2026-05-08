import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import Cookies from "js-cookie";
import { login as apiLogin, checkSessionStatus } from "@/api";

export interface User {
    email: string;
    roles: string[];
    identityRoles: string[];
    identityId: string;
    identityName: string;
}

export type UserRole =
    | {
          IT: boolean;
          bot: boolean;
          admin: boolean;
          accountant: boolean;
          superAdmin: boolean;
          technician: boolean;
          collaborator: boolean;
          dispatchClerk: boolean;
          sampleManager: boolean;
          administrative: boolean;
          qualityControl: boolean;
          customerService: boolean;
          marketingCommunications: boolean;
          documentManagementSpecialist: boolean;
      }
    | any; // Allow loose typing if matrix changes

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    loginAsGuest: () => void;
    logout: () => void;
    hasAccess: (page: string) => boolean;
    loading: boolean;
    isAdmin: boolean;
    canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based access control matrix (Updated based on UI_ROUTING_MATRIX and real role keys)
const accessMatrix: Record<string, string[]> = {
    // Admin roles
    ROLE_SUPER_ADMIN: ["*"],
    ROLE_ADMIN: ["*"],
    admin: ["*"],
    superAdmin: ["*"],
    ROLE_DIRECTOR: ["hr", "dashboard", "*"], 

    // Management roles
    ROLE_TECH_MANAGER: ["manager", "assignment", "document", "libraries"],
    ROLE_QA_MANAGER: ["manager", "document", "libraries"],
    ROLE_QA: ["manager", "document", "libraries"],
    ROLE_MANAGER: ["manager", "assignment", "document", "libraries"],
    ROLE_SECTION_HEAD: ["technician", "manager", "assignment", "handover"],
    ROLE_VALIDATOR: ["manager"],

    // Functional roles
    ROLE_TECHNICIAN: ["technician", "handover", "chemical-inventory"],
    ROLE_SENIOR_ANALYST: ["technician", "handover", "chemical-inventory"],
    ROLE_IPC_INSPECTOR: ["technician"],
    ROLE_RND_SPECIALIST: ["technician"],
    technician: ["technician", "handover", "chemical-inventory"],

    // Reception & Logistics
    ROLE_RECEPTIONIST: ["reception", "handover", "stored-samples"],
    ROLE_SAMPLER: ["reception"],
    sampleManager: ["reception", "handover", "stored-samples"],

    // Inventory
    ROLE_INVENTORY_MGR: ["inventory", "chemical-inventory", "general-inventory"],
    ROLE_EQUIPMENT_MGR: ["inventory", "general-inventory"],
    ROLE_SAMPLE_CUSTODIAN: ["handover", "stored-samples"],

    // Commercial
    ROLE_SALES_MANAGER: ["crm"],
    ROLE_SALES_EXEC: ["crm"],
    ROLE_CS: ["crm", "reception"],

    // Accounting & Reports
    ROLE_ACCOUNTANT: ["crm", "accounting"],
    ROLE_REPORT_OFFICER: ["manager", "accounting"],

    // System/Docs
    ROLE_DOC_CONTROLLER: ["document", "libraries"],

    // Default fallback
    guest: ["dashboard"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem("sessionId"));
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check session status on mount
    useEffect(() => {
        const verifySession = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                const response: any = await checkSessionStatus({ body: { sessionId } });
                const payload = response.data || response;

                if (!payload || payload.sessionStatus !== "active") {
                    console.log("Session invalid or expired, logging out...");
                    logout();
                } else {
                    const identity = payload.identity;
                    if (identity) {
                        setUser((_prev) => {
                            const updatedUser: User = {
                                identityId: identity.identityId,
                                identityName: identity.identityName,
                                roles: identity.identityRoles || [],
                                identityRoles: identity.identityRoles || [],
                                email: identity.identityEmail || identity.email || "",
                            };

                            localStorage.setItem("user", JSON.stringify(updatedUser));
                            return updatedUser;
                        });
                    }
                }
            } catch (error) {
                console.error("Session check failed:", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [sessionId]);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response: any = await apiLogin({ body: { username, password } });
            const payload = response.data || response; // Handle both wrapped and unwrapped APIs

            if (payload && payload.token && payload.identity) {
                const identity = payload.identity;
                const token = payload.token;
                const newSessionId = payload.sessionId;

                // Save Token
                Cookies.set("authToken", token, { expires: 7 });

                // Save Session ID if available
                if (newSessionId) {
                    setSessionId(newSessionId);
                    localStorage.setItem("sessionId", newSessionId);
                }

                const mappedUser: User = {
                    identityId: identity.identityId,
                    identityName: identity.identityName,
                    roles: identity.identityRoles || [],
                    identityRoles: identity.identityRoles || [],
                    email: identity.identityEmail || identity.email || "",
                };

                setUser(mappedUser);
                setIsGuest(false);
                localStorage.setItem("user", JSON.stringify(mappedUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    };

    const loginAsGuest = () => {
        setUser(null);
        setSessionId(null);
        setIsGuest(true);
        localStorage.removeItem("user");
        localStorage.removeItem("sessionId");
        Cookies.remove("authToken");
    };

    const logout = () => {
        setUser(null);
        setSessionId(null);
        setIsGuest(false);
        localStorage.removeItem("user");
        localStorage.removeItem("sessionId");
        Cookies.remove("authToken");
        // Force reload or redirect logic if needed
        window.location.href = "/login";
    };

    const hasAccess = useCallback(
        (page: string): boolean => {
            // Public sections (Always visible)
            if (page === "libraries") return true;

            if (isGuest) return accessMatrix.guest.includes(page) || accessMatrix.guest.includes("*");
            if (!user) return false;

            const roles = user.identityRoles || user.roles || [];

            // Bypass for Super Admins
            if (roles.includes("ROLE_SUPER_ADMIN") || roles.includes("ROLE_ADMIN") || roles.includes("admin")) {
                return true;
            }

            // Simple OR check: if any active role has access, grant it.
            for (const roleKey of roles) {
                const allowedPages = accessMatrix[roleKey] || [];
                if (allowedPages.includes(page) || allowedPages.includes("*")) {
                    return true;
                }
            }
            return false;
        },
        [isGuest, user],
    );

    const isAdmin =
        user?.identityRoles?.some((r) => ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "admin", "superAdmin"].includes(r)) || false;

    return (
        <AuthContext.Provider value={{ user, isGuest, login, loginAsGuest, logout, hasAccess, loading, isAdmin, canEdit: isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
