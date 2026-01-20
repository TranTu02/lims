import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import Cookies from "js-cookie";
import { login as apiLogin, checkSessionStatus } from "@/api";

export interface User {
    email: string;
    roles: UserRole;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based access control matrix (Simplified/Updated)
const accessMatrix: Record<string, string[]> = {
    // Admin roles
    admin: [
        "dashboard",
        "clients",
        "quotes",
        "quotes-create",
        "orders",
        "orders-create",
        "parameters",
        "accounting",
        "settings",
        "reception",
        "technician",
        "manager",
        "assignment",
        "handover",
        "stored-samples",
        "library",
        "protocols",
        "document",
        "inventory",
        "hr",
    ], // Expanded for LIMS paths
    superAdmin: ["dashboard", "reception", "technician", "manager", "assignment", "handover", "stored-samples", "library", "protocols", "document", "inventory", "hr", "settings"],

    // Functional Roles
    technician: ["dashboard", "technician", "library", "protocols"],
    sampleManager: ["dashboard", "reception", "handover", "stored-samples"],

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
                const response = await checkSessionStatus({ body: { sessionId } });
                if (!response.success || response.data?.sessionStatus !== "active") {
                    console.log("Session invalid or expired, logging out...");
                    logout();
                } else {
                    const identity = response.data.identity;
                    if (identity) {
                        setUser((_prev) => {
                            const updatedUser: User = {
                                identityId: identity.identityId,
                                identityName: identity.identityName,
                                roles: identity.roles,
                                email: identity.email || "",
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
            const response = await apiLogin({ body: { username, password } });
            if (response.success && response.data) {
                const identity = response.data.identity;
                const token = response.data.token;
                const newSessionId = response.data.sessionId;

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
                    roles: identity.roles,
                    email: identity.email || "",
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

    const hasAccess = (page: string): boolean => {
        if (isGuest) return accessMatrix.guest.includes(page);
        if (!user) return false;

        const userRoles = user.roles;
        // Simple OR check: if any active role has access, grant it.
        for (const [roleKey, isActive] of Object.entries(userRoles)) {
            if (isActive) {
                const allowedPages = accessMatrix[roleKey] || [];
                if (allowedPages.includes(page) || allowedPages.includes("*")) {
                    return true;
                }
            }
        }
        return false;
    };

    return <AuthContext.Provider value={{ user, isGuest, login, loginAsGuest, logout, hasAccess, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
