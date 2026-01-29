export const crmKeys = {
    clients: {
      all: ["crm", "clients"] as const,
      list: (query: Record<string, unknown> | undefined, sort?: Record<string, unknown> | undefined) =>
        ["crm", "clients", "list", query ?? {}, sort ?? {}] as const,
      detail: (clientId: string) => ["crm", "clients", "detail", clientId] as const,
    },
    orders: {
      all: ["crm", "orders"] as const,
      list: (query: Record<string, unknown> | undefined, sort?: Record<string, unknown> | undefined) =>
        ["crm", "orders", "list", query ?? {}, sort ?? {}] as const,
      detail: (orderId: string) => ["crm", "orders", "detail", orderId] as const,
      full: (orderId: string) => ["crm", "orders", "full", orderId] as const,
    },
    quotes: {
      all: ["crm", "quotes"] as const,
      list: (query: Record<string, unknown> | undefined, sort?: Record<string, unknown> | undefined) =>
        ["crm", "quotes", "list", query ?? {}, sort ?? {}] as const,
      detail: (key: string) => ["crm", "quotes", "detail", key] as const,
      full: (key: string) => ["crm", "quotes", "full", key] as const,
    },
  };