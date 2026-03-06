export const crmKeys = {
    clients: {
        all: ["crm", "clients"] as const,
        list: (query: Record<string, unknown> | undefined, sort?: Record<string, unknown> | undefined) => ["crm", "clients", "list", query ?? {}, sort ?? {}] as const,
        detail: (clientId: string) => ["crm", "clients", "detail", clientId] as const,
        filter: (input: unknown) => [...crmKeys.clients.all, "filter", input] as const,
    },
    orders: {
        all: ["crm", "orders"] as const,
        list: (query: Record<string, unknown> | undefined, sort?: Record<string, unknown> | undefined) => ["crm", "orders", "list", query ?? {}, sort ?? {}] as const,
        detail: (orderId: string) => ["crm", "orders", "detail", orderId] as const,
        full: (orderId: string) => ["crm", "orders", "full", orderId] as const,
        filter: (input: unknown) => [...crmKeys.orders.all, "filter", input] as const,
    },
    quotes: {
        all: ["crm", "quotes"] as const,
        list: (query: Record<string, unknown> | undefined, sort?: Record<string, unknown> | undefined) => ["crm", "quotes", "list", query ?? {}, sort ?? {}] as const,
        detail: (quoteId: string) => ["crm", "quotes", "detail", quoteId] as const,
        full: (quoteId: string) => ["crm", "quotes", "full", quoteId] as const,
        filter: (input: unknown) => [...crmKeys.quotes.all, "filter", input] as const,
    },
    incomingRequests: {
        all: ["crm", "incomingRequests"] as const,
        list: (query?: Record<string, unknown>) => ["crm", "incomingRequests", "list", query ?? {}] as const,
        detail: (requestId: string) => ["crm", "incomingRequests", "detail", requestId] as const,
    },
};
