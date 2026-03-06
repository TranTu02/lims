export const stableKey = (obj: unknown): string => {
    if (obj === null || typeof obj !== "object") return String(obj);
    return JSON.stringify(obj);
};

export const chemicalKeys = {
    all: ["chemical"] as const,

    // SKUs
    skus: {
        all: () => [...chemicalKeys.all, "skus"] as const,
        list: (input?: unknown) => [...chemicalKeys.skus.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.skus.all(), "detail", id] as const,
        full: (id: string) => [...chemicalKeys.skus.all(), "full", id] as const,
    },

    // Suppliers
    suppliers: {
        all: () => [...chemicalKeys.all, "suppliers"] as const,
        list: (input?: unknown) => [...chemicalKeys.suppliers.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.suppliers.all(), "detail", id] as const,
        full: (id: string) => [...chemicalKeys.suppliers.all(), "full", id] as const,
    },

    // SKU Suppliers (Catalog)
    skuSuppliers: {
        all: () => [...chemicalKeys.all, "skuSuppliers"] as const,
        list: (input?: unknown) => [...chemicalKeys.skuSuppliers.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.skuSuppliers.all(), "detail", id] as const,
        full: (id: string) => [...chemicalKeys.skuSuppliers.all(), "full", id] as const,
    },

    // Inventories (Lọ/Chai)
    inventories: {
        all: () => [...chemicalKeys.all, "inventories"] as const,
        list: (input?: unknown) => [...chemicalKeys.inventories.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.inventories.all(), "detail", id] as const,
        full: (id: string) => [...chemicalKeys.inventories.all(), "full", id] as const,
    },

    // Transaction Blocks
    transactionBlocks: {
        all: () => [...chemicalKeys.all, "transactionBlocks"] as const,
        list: (input?: unknown) => [...chemicalKeys.transactionBlocks.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.transactionBlocks.all(), "detail", id] as const,
        full: (id: string) => [...chemicalKeys.transactionBlocks.all(), "full", id] as const,
    },

    // Transactions (Chi tiết log)
    transactions: {
        all: () => [...chemicalKeys.all, "transactions"] as const,
        list: (input?: unknown) => [...chemicalKeys.transactions.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.transactions.all(), "detail", id] as const,
        full: (id: string) => [...chemicalKeys.transactions.all(), "full", id] as const,
    },

    // Audit Blocks (Phiếu kiểm kê)
    auditBlocks: {
        all: () => [...chemicalKeys.all, "auditBlocks"] as const,
        list: (input?: unknown) => [...chemicalKeys.auditBlocks.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.auditBlocks.all(), "detail", id] as const,
        full: (id: string) => [...chemicalKeys.auditBlocks.all(), "full", id] as const,
    },

    // Audit Details (Chi tiết kiểm kê)
    auditDetails: {
        all: () => [...chemicalKeys.all, "auditDetails"] as const,
        list: (input?: unknown) => [...chemicalKeys.auditDetails.all(), "list", stableKey(input)] as const,
        detail: (id: string) => [...chemicalKeys.auditDetails.all(), "detail", id] as const,
    },
};
