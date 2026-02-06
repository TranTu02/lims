import axios, { AxiosHeaders } from "axios";
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

export type ApiMeta = {
  page: number;
  itemsPerPage: number;
  total: number;
  totalItems?: number;
  totalPages: number;
  [key: string]: unknown;
  countsByEntity?: Record<string, number>;
};

export type ApiError = {
  code: string;
  message: string;
  traceId?: string;
  [key: string]: unknown;
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data?: T;
  meta?: ApiMeta | null;
  error?: ApiError | null;
}


export interface RequestParams<TBody = unknown, TQuery = Record<string, unknown>> {
  headers?: Record<string, string>;
  body?: TBody;
  params?: Record<string, unknown>;
  query?: TQuery;
}

const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || "http://localhost:3000";
const APP_UID = (import.meta.env.VITE_APP_UID as string | undefined) || "lims-core";
const ACCESS_KEY = (import.meta.env.VITE_ACCESS_KEY as string | undefined) || "";

const DEV_BEARER_TOKEN = (import.meta.env.VITE_DEV_BEARER_TOKEN as string | undefined) || "";

const IS_DEV = Boolean(import.meta.env.DEV);


const getAuthToken = (): string | null => {
  const cookieToken = Cookies.get("authToken");
  if (cookieToken && cookieToken.trim().length > 0) return cookieToken.trim();

  if (IS_DEV && DEV_BEARER_TOKEN.trim().length > 0) return DEV_BEARER_TOKEN.trim();

  return null;
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-app-uid": APP_UID,
    "x-access-key": ACCESS_KEY,
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();

    const headers = AxiosHeaders.from(config.headers);

    headers.set("Content-Type", "application/json");
    headers.set("x-app-uid", APP_UID);
    if (ACCESS_KEY) headers.set("x-access-key", ACCESS_KEY);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }

    config.headers = headers;
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error.response?.status as number | undefined;
    const data = error.response?.data as unknown;

    if (status === 401) {
      const url = error.config?.url as string | undefined;
      const isLoginRequest = url?.includes("/v2/auth/login") ?? false;

      if (IS_DEV && DEV_BEARER_TOKEN.trim().length > 0) {
        toast.error("401 Unauthorized (DEV): Backend từ chối request. Kiểm tra token/quyền.");
        return Promise.reject(error);
      }

      if (!isLoginRequest) {
        toast.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");

        Cookies.remove("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("sessionId");

        if (window.location.pathname !== "/login") {
          setTimeout(() => {
            window.location.href = "/login?reason=401";
          }, 1000);
        }
      }
    } else if (status === 403) {
      toast.error("Forbidden: You do not have permission.");
    } else if (typeof status === "number" && status >= 500) {
      const maybeApi = data as { error?: { message?: string } } | null;
      if (maybeApi?.error?.message) toast.error(maybeApi.error.message);
      else toast.error("Server Error: Something went wrong.");
    } else {
      const maybeApi = data as { error?: { message?: string } } | null;
      if (maybeApi?.error?.message) toast.error(maybeApi.error.message);
      else toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  },
);

function makeUnknownError(err: unknown): ApiResponse<never> {
  const e = err as { response?: { status?: number; data?: unknown }; message?: string } | null;

  return (
    (e?.response?.data as ApiResponse<never> | undefined) ?? {
      success: false,
      statusCode: e?.response?.status ?? 500,
      data: undefined,
      meta: null,
      error: {
        code: "UNKNOWN_ERROR",
        message: e?.message ?? "An unknown error occurred",
      },
    }
  );
}

function toError(err: unknown): Error {
  const e = err as { response?: { data?: unknown }; message?: string } | null;

  const maybeApi = e?.response?.data as { error?: { message?: string } } | null;
  const msg = maybeApi?.error?.message ?? e?.message ?? "An unknown error occurred";
  return new Error(msg);
}


const api = {
  get: async <T, TQuery = Record<string, unknown>>(
    url: string,
    { headers, params, query }: RequestParams<never, TQuery> = {},
  ): Promise<ApiResponse<T>> => {
    try {
      const finalParams: Record<string, unknown> = { ...(params ?? {}), ...(query ?? {}) };
      const response = await axiosInstance.get<ApiResponse<T>>(url, { headers, params: finalParams });
      return response.data;
    } catch (error: unknown) {
      return makeUnknownError(error) as ApiResponse<T>;
    }
  },

  post: async <T, TBody = unknown, TQuery = Record<string, unknown>>(
    url: string,
    { headers, body, query }: RequestParams<TBody, TQuery> = {},
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.post<ApiResponse<T>>(url, body, { headers, params: query });
      return response.data;
    } catch (error: unknown) {
      return makeUnknownError(error) as ApiResponse<T>;
    }
  },

  put: async <T, TBody = unknown, TQuery = Record<string, unknown>>(
    url: string,
    { headers, body, query }: RequestParams<TBody, TQuery> = {},
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.put<ApiResponse<T>>(url, body, { headers, params: query });
      return response.data;
    } catch (error: unknown) {
      return makeUnknownError(error) as ApiResponse<T>;
    }
  },

  delete: async <T, TBody = unknown, TQuery = Record<string, unknown>>(
    url: string,
    { headers, body, query }: RequestParams<TBody, TQuery> = {},
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await axiosInstance.delete<ApiResponse<T>>(url, { headers, data: body, params: query });
      return response.data;
    } catch (error: unknown) {
      return makeUnknownError(error) as ApiResponse<T>;
    }
  },

  getRaw: async <T, TQuery = Record<string, unknown>>(
    url: string,
    { headers, params, query }: RequestParams<never, TQuery> = {},
  ): Promise<T> => {
    try {
      const finalParams: Record<string, unknown> = { ...(params ?? {}), ...(query ?? {}) };
      const response = await axiosInstance.get<T>(url, { headers, params: finalParams });
      return response.data;
    } catch (error: unknown) {
      throw toError(error);
    }
  },

  postRaw: async <T, TBody = unknown, TQuery = Record<string, unknown>>(
    url: string,
    { headers, body, query }: RequestParams<TBody, TQuery> = {},
  ): Promise<T> => {
    try {
      const response = await axiosInstance.post<T>(url, body, { headers, params: query });
      return response.data;
    } catch (error: unknown) {
      throw toError(error);
    }
  },

  putRaw: async <T, TBody = unknown, TQuery = Record<string, unknown>>(
    url: string,
    { headers, body, query }: RequestParams<TBody, TQuery> = {},
  ): Promise<T> => {
    try {
      const response = await axiosInstance.put<T>(url, body, { headers, params: query });
      return response.data;
    } catch (error: unknown) {
      throw toError(error);
    }
  },

  deleteRaw: async <T, TBody = unknown, TQuery = Record<string, unknown>>(
    url: string,
    { headers, body, query }: RequestParams<TBody, TQuery> = {},
  ): Promise<T> => {
    try {
      const response = await axiosInstance.delete<T>(url, { headers, data: body, params: query });
      return response.data;
    } catch (error: unknown) {
      throw toError(error);
    }
  },
};

export default api;
