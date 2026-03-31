import api from "@/api/client";
import type { ApiResponse } from "@/api/client";
import type { SendEmailBody, SendEmailResult } from "@/types/notification";

function assertSuccess<T>(res: ApiResponse<T>): T {
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }
    return (res.data !== undefined ? res.data : res) as T;
}

export const notificationApi = {
    /**
     * Send email using general notification service
     * URL: POST /v2/notifications/send-email
     */
    sendEmail: (body: SendEmailBody) =>
        api.post<SendEmailResult, SendEmailBody>("/v2/notifications/send-email", { body }),

    /**
     * Get email template details (if any)
     * URL: GET /v2/notifications/get/template?id=...
     */
    getTemplate: (id: string, options?: { lang?: string; refId?: string; refType?: string }) =>
        api.get<any>("/v2/notifications/get/template", { query: { id, ...options } }),
};

/**
 * Custom hooks or utility for easier usage if needed
 */
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSendEmail() {
    return useMutation({
        mutationFn: async (body: SendEmailBody) => {
            const res = await notificationApi.sendEmail(body);
            return assertSuccess(res);
        },
        onSuccess: () => {
             // Invalidate any relevant queries if necessary
        },
        onError: (error) => {
            toast.error(error.message || "Không thể gửi email.");
        }
    });
}
