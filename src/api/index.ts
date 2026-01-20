import api from "./client";
import type { ApiResponse } from "./client";

// Generic Input Type matches RequestParams in client.ts
export interface ApiInput {
    headers?: Record<string, string>;
    body?: any;
    query?: any;
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

export const login = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v1/auth/login", { headers, body, query });
};

export const logout = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v1/auth/logout", { headers, body, query });
};

export const checkSessionStatus = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v1/auth/check-status", { headers, body, query });
};

// =============================================================================
// EXPORT
// =============================================================================

const apis = {
    auth: { login, logout, checkSessionStatus },
};

export default apis;
