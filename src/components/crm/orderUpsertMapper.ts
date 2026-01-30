import type {
    OrderDetail,
    OrdersCreateBody,
    OrdersUpdateBody,
    OrderRequestForm,
    OrderSampleItem,
    OrderTransaction,
  } from "@/types/crm/order";
  
  export type FormAnalysis = { id: string; matrixId: string };
  export type FormSample = {
    id: string;
    sampleId: string;
    sampleName: string;
    sampleTypeId: string;
    userSampleId: string;
    sampleTypeName: string;
    analyses: FormAnalysis[];
  };
  export type FormTransaction = {
    id: string;
    date: string;
    note: string;
    amount: string;
    method: string;
  };
  
  export type OrderUpsertFormState = {
    orderId: string;
    quoteId: string;
    clientId: string;
  
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  
    salePersonId: string;
    saleCommissionPercent: string;
  
    totalAmount: string;
    taxRate: string;
    discountRate: string;
  
    orderStatus: string;
    paymentStatus: string;
  
    samples: FormSample[];
    transactions: FormTransaction[];
  
    requestedBy: string;
    requestedAt: string;
    requestNotes: string;
  };
  
  function uid(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
  
  function toStr(v: unknown) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }
  function toNullIfEmpty(v: string): string | null {
    const s = v.trim();
    return s.length === 0 ? null : s;
  }
  function getProp(obj: unknown, key: string): unknown {
    if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[key];
    return undefined;
  }
  export function getStr(obj: unknown, key: string): string {
    return toStr(getProp(obj, key));
  }
  
  function safeJsonParse(value: string | null | undefined): unknown {
    if (!value) return null;
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
  }
  
  export function normalizeOrderInitial(initial?: OrderDetail | null): OrderUpsertFormState {
    const requestFormRaw = initial?.requestForm ?? null;
    const parsed = safeJsonParse(requestFormRaw);
    const rf = isRecord(parsed) ? parsed : null;
  
    const samplesRaw = Array.isArray(initial?.samples) ? initial?.samples ?? [] : [];
    const transactionsRaw = Array.isArray(initial?.transactions) ? initial?.transactions ?? [] : [];
  
    return {
      orderId: getStr(initial, "orderId"),
      quoteId: getStr(initial, "quoteId"),
      clientId: getStr(initial, "clientId"),
  
      contactName: toStr(initial?.contactPerson?.contactName ?? ""),
      contactEmail: toStr(initial?.contactPerson?.contactEmail ?? ""),
      contactPhone: toStr(initial?.contactPerson?.contactPhone ?? ""),
  
      salePersonId: getStr(initial, "salePersonId"),
      saleCommissionPercent: getStr(initial, "saleCommissionPercent"),
  
      totalAmount: getStr(initial, "totalAmount"),
      taxRate: getStr(initial, "taxRate"),
      discountRate: getStr(initial, "discountRate"),
  
      orderStatus: getStr(initial, "orderStatus"),
      paymentStatus: getStr(initial, "paymentStatus"),
  
      samples: samplesRaw.map((s) => ({
        id: uid("sample"),
        sampleId: toStr(s.sampleId ?? ""),
        sampleName: toStr(s.sampleName ?? ""),
        sampleTypeId: toStr(s.sampleTypeId ?? ""),
        userSampleId: toStr(s.userSampleId ?? ""),
        sampleTypeName: toStr(s.sampleTypeName ?? ""),
        analyses: (Array.isArray(s.analyses) ? s.analyses ?? [] : []).map((a) => ({
          id: uid("analysis"),
          matrixId: toStr(a.matrixId ?? ""),
        })),
      })),
  
      transactions: transactionsRaw.map((tx) => ({
        id: uid("tx"),
        date: toStr(tx.date ?? ""),
        note: toStr(tx.note ?? ""),
        amount: toStr(tx.amount ?? ""),
        method: toStr(tx.method ?? ""),
      })),
  
      requestedBy: toStr(rf?.requestedBy ?? ""),
      requestedAt: toStr(rf?.requestedAt ?? ""),
      requestNotes: toStr(rf?.notes ?? ""),
    };
  }
  
  function toSamples(values: OrderUpsertFormState): OrderSampleItem[] | null {
    if (!values.samples.length) return null;
  
    const mapped: OrderSampleItem[] = values.samples.map((s) => ({
      sampleId: toNullIfEmpty(s.sampleId),
      sampleName: toNullIfEmpty(s.sampleName),
      sampleTypeId: toNullIfEmpty(s.sampleTypeId),
      userSampleId: toNullIfEmpty(s.userSampleId),
      sampleTypeName: toNullIfEmpty(s.sampleTypeName),
      analyses: s.analyses.length
        ? s.analyses.map((a) => ({ matrixId: toNullIfEmpty(a.matrixId) }))
        : [],
    }));
  
    return mapped;
  }
  
  function toTransactions(values: OrderUpsertFormState): OrderTransaction[] | null {
    if (!values.transactions.length) return null;
  
    const mapped: OrderTransaction[] = values.transactions.map((tx) => ({
      date: toNullIfEmpty(tx.date),
      note: toNullIfEmpty(tx.note),
      amount: toNullIfEmpty(tx.amount),
      method: toNullIfEmpty(tx.method),
    }));
  
    return mapped;
  }
  
  function toRequestFormString(values: OrderUpsertFormState): string | null {
    const rf: OrderRequestForm = {
      requestedBy: toNullIfEmpty(values.requestedBy),
      requestedAt: toNullIfEmpty(values.requestedAt),
      notes: toNullIfEmpty(values.requestNotes),
    };
  
    const hasAny =
      Boolean(rf.requestedBy) || Boolean(rf.requestedAt) || Boolean(rf.notes);
  
    return hasAny ? JSON.stringify(rf) : null;
  }
  
  export function toOrdersCreateBody(values: OrderUpsertFormState): OrdersCreateBody {
    return {
      orderId: toNullIfEmpty(values.orderId),
      quoteId: toNullIfEmpty(values.quoteId),
      clientId: toNullIfEmpty(values.clientId),
  
      contactPerson:
        toNullIfEmpty(values.contactName) ||
        toNullIfEmpty(values.contactEmail) ||
        toNullIfEmpty(values.contactPhone)
          ? {
              contactName: toNullIfEmpty(values.contactName),
              contactEmail: toNullIfEmpty(values.contactEmail),
              contactPhone: toNullIfEmpty(values.contactPhone),
            }
          : null,
  
      salePersonId: toNullIfEmpty(values.salePersonId),
      saleCommissionPercent: toNullIfEmpty(values.saleCommissionPercent),
  
      totalAmount: toNullIfEmpty(values.totalAmount),
      taxRate: toNullIfEmpty(values.taxRate),
      discountRate: toNullIfEmpty(values.discountRate),
  
      orderStatus: toNullIfEmpty(values.orderStatus),
      paymentStatus: toNullIfEmpty(values.paymentStatus),
  
      samples: toSamples(values),
      transactions: toTransactions(values),
  
      requestForm: toRequestFormString(values),
    };
  }
  
  export function toOrdersUpdateBody(values: OrderUpsertFormState): OrdersUpdateBody {
    return {
      orderId: values.orderId.trim(),
  
      quoteId: toNullIfEmpty(values.quoteId),
      clientId: toNullIfEmpty(values.clientId),
  
      contactPerson:
        toNullIfEmpty(values.contactName) ||
        toNullIfEmpty(values.contactEmail) ||
        toNullIfEmpty(values.contactPhone)
          ? {
              contactName: toNullIfEmpty(values.contactName),
              contactEmail: toNullIfEmpty(values.contactEmail),
              contactPhone: toNullIfEmpty(values.contactPhone),
            }
          : null,
  
      salePersonId: toNullIfEmpty(values.salePersonId),
      saleCommissionPercent: toNullIfEmpty(values.saleCommissionPercent),
  
      totalAmount: toNullIfEmpty(values.totalAmount),
      taxRate: toNullIfEmpty(values.taxRate),
      discountRate: toNullIfEmpty(values.discountRate),
  
      orderStatus: toNullIfEmpty(values.orderStatus),
      paymentStatus: toNullIfEmpty(values.paymentStatus),
  
      samples: toSamples(values),
      transactions: toTransactions(values),
  
      requestForm: toRequestFormString(values),
    };
  }
  
  export function createEmptyOrderFormState(): OrderUpsertFormState {
    return {
      orderId: "",
      quoteId: "",
      clientId: "",
  
      contactName: "",
      contactEmail: "",
      contactPhone: "",
  
      salePersonId: "",
      saleCommissionPercent: "",
  
      totalAmount: "",
      taxRate: "",
      discountRate: "",
  
      orderStatus: "",
      paymentStatus: "",
  
      samples: [],
      transactions: [],
  
      requestedBy: "",
      requestedAt: "",
      requestNotes: "",
    };
  }
  
  export function createEmptySample(): FormSample {
    return {
      id: uid("sample"),
      sampleId: "",
      sampleName: "",
      sampleTypeId: "",
      userSampleId: "",
      sampleTypeName: "",
      analyses: [{ id: uid("analysis"), matrixId: "" }],
    };
  }
  
  export function createEmptyTransaction(): FormTransaction {
    return {
      id: uid("tx"),
      date: "",
      note: "",
      amount: "",
      method: "",
    };
  }
  