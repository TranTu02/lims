export const QUERY_KEYS = {
    // Auth & Identity
    identity: {
        all: ["identity"] as const,
        profile: () => [...QUERY_KEYS.identity.all, "profile"] as const,
        sessions: () => [...QUERY_KEYS.identity.all, "sessions"] as const,
    },

    // CRM
    clients: {
        all: ["clients"] as const,
        lists: () => [...QUERY_KEYS.clients.all, "list"] as const,
        list: (filters: string) => [...QUERY_KEYS.clients.lists(), { filters }] as const,
        details: () => [...QUERY_KEYS.clients.all, "detail"] as const,
        detail: (id: string) => [...QUERY_KEYS.clients.details(), id] as const,
    },
    orders: {
        all: ["orders"] as const,
        lists: () => [...QUERY_KEYS.orders.all, "list"] as const,
        list: (filters: Record<string, unknown>) => [...QUERY_KEYS.orders.lists(), { filters }] as const,
        details: () => [...QUERY_KEYS.orders.all, "detail"] as const,
        detail: (id: string) => [...QUERY_KEYS.orders.details(), id] as const,
        print: (id: string) => [...QUERY_KEYS.orders.detail(id), "print"] as const,
    },
    quotes: {
        all: ["quotes"] as const,
        lists: () => [...QUERY_KEYS.quotes.all, "list"] as const,
        list: (filters: Record<string, unknown>) => [...QUERY_KEYS.quotes.lists(), { filters }] as const,
        details: () => [...QUERY_KEYS.quotes.all, "detail"] as const,
        detail: (id: string) => [...QUERY_KEYS.quotes.details(), id] as const,
    },

    // Library (Master Data)
    library: {
        all: ["library"] as const,
        matrices: {
            all: ["library", "matrices"] as const,
            list: () => [...QUERY_KEYS.library.matrices.all, "list"] as const,
        },
        sampleTypes: {
            all: ["library", "sample-types"] as const,
            list: () => [...QUERY_KEYS.library.sampleTypes.all, "list"] as const,
        },
        parameters: {
            all: ["library", "parameters"] as const,
            list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.library.parameters.all, "list", { filters }] as const,
        },
        methods: {
            all: ["library", "methods"] as const,
            list: () => [...QUERY_KEYS.library.methods.all, "list"] as const,
        },
    },

    // Lab Operations
    reception: {
        all: ["reception"] as const,
        receipts: {
            all: ["reception", "receipts"] as const,
            list: (filters: Record<string, unknown>) => [...QUERY_KEYS.reception.receipts.all, "list", { filters }] as const,
            detail: (id: string) => [...QUERY_KEYS.reception.receipts.all, "detail", id] as const,
        },
    },
    samples: {
        all: ["samples"] as const,
        lists: () => [...QUERY_KEYS.samples.all, "list"] as const,
        list: (filters: Record<string, unknown>) => [...QUERY_KEYS.samples.lists(), { filters }] as const,
        details: () => [...QUERY_KEYS.samples.all, "detail"] as const,
        detail: (id: string) => [...QUERY_KEYS.samples.details(), id] as const,
        tracking: (id: string) => [...QUERY_KEYS.samples.detail(id), "tracking"] as const,
    },
};
