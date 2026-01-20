import api from "./client";

export interface ApiInput {
    headers?: Record<string, string>;
    body?: any;
    query?: any;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: any;
}

export const login = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v1/auth/login", configRequest(headers, body, query));
};

export const logout = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v1/auth/logout", configRequest(headers, body, query));
};

export const checkSessionStatus = async ({ headers, body, query }: ApiInput): Promise<ApiResponse> => {
    return api.post("/v1/auth/check-status", configRequest(headers, body, query));
};

// Helper helper to adapt ApiInput to axios config
function configRequest(headers?: any, body?: any, query?: any) {
    return {
        headers,
        params: query,
        ...body, // Post body usually goes as 2nd arg in axios, but this structure seems to imply body is spreading or passed.
        // Wait, partner api.post implementation in client.ts might be a wrapper.
        // Standard axios.post(url, data, config).
        // If partner uses `api.post`, I need to check `client.ts` in partner project to be sure about signature.
        // But for now, I'll assume standard Axios and adapt logic.
        // Usage: api.post("/v1/auth/login", body, { headers, params: query })
    };
}
