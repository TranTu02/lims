import type {
    ClientContact,
    ClientInvoiceInfo,
    ClientsCreateBody,
    ClientsUpdateBody,
  } from "@/types/crm/client";
  
  export type ClientUpsertFormState = {
    clientId: string;
    clientName: string;
    legalId: string;
    clientAddress: string;
    clientPhone: string;
    clientEmail: string;
    clientSaleScope: string;
  
    availableByIds: string;
    availableByName: string;
  
    invoiceInfo: {
      taxAddress: string;
      taxCode: string;
      taxName: string;
      taxEmail: string;
    };
  
    clientContacts: Array<{
      contactId: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      contactPosition: string;
      contactAddress: string;
    }>;
  };
  
  function toStr(v: unknown) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }
  
  function toNullIfEmpty(v: string): string | null {
    const s = v.trim();
    return s.length === 0 ? null : s;
  }
  
  function splitCsvToArray(v: string): string[] | null {
    const parts = v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    return parts.length ? parts : null;
  }
  
  export function joinArr(arr: string[] | null | undefined): string {
    return (arr ?? []).join(", ");
  }
  
  export function normalizeContacts(
    v: ClientContact[] | null | undefined
  ): ClientUpsertFormState["clientContacts"] {
    if (!v || v.length === 0) return [];
    return v.map((c) => ({
      contactId: toStr(c.contactId ?? ""),
      contactName: toStr(c.contactName ?? ""),
      contactPhone: toStr(c.contactPhone ?? ""),
      contactEmail: toStr(c.contactEmail ?? ""),
      contactPosition: toStr(c.contactPosition ?? ""),
      contactAddress: toStr(c.contactAddress ?? ""),
    }));
  }
  
  export function normalizeInvoice(
    v: ClientInvoiceInfo | null | undefined
  ): ClientUpsertFormState["invoiceInfo"] {
    return {
      taxAddress: toStr(v?.taxAddress ?? ""),
      taxCode: toStr(v?.taxCode ?? ""),
      taxName: toStr(v?.taxName ?? ""),
      taxEmail: toStr(v?.taxEmail ?? ""),
    };
  }
  
  export function toClientCreateBody(values: ClientUpsertFormState): ClientsCreateBody {
    return {
      clientName: values.clientName.trim(),
      legalId: toNullIfEmpty(values.legalId),
      clientAddress: toNullIfEmpty(values.clientAddress),
      clientPhone: toNullIfEmpty(values.clientPhone),
      clientEmail: toNullIfEmpty(values.clientEmail),
      clientSaleScope: toNullIfEmpty(values.clientSaleScope),
  
      availableByIds: splitCsvToArray(values.availableByIds),
      availableByName: splitCsvToArray(values.availableByName),
  
      clientContacts: values.clientContacts.length
        ? values.clientContacts.map((c) => ({
            contactName: toNullIfEmpty(c.contactName),
            contactPhone: toNullIfEmpty(c.contactPhone),
            contactEmail: toNullIfEmpty(c.contactEmail),
            contactPosition: toNullIfEmpty(c.contactPosition),
            contactAddress: toNullIfEmpty(c.contactAddress),
          }))
        : null,
  
      invoiceInfo:
        toNullIfEmpty(values.invoiceInfo.taxAddress) ||
        toNullIfEmpty(values.invoiceInfo.taxCode) ||
        toNullIfEmpty(values.invoiceInfo.taxName) ||
        toNullIfEmpty(values.invoiceInfo.taxEmail)
          ? {
              taxAddress: toNullIfEmpty(values.invoiceInfo.taxAddress),
              taxCode: toNullIfEmpty(values.invoiceInfo.taxCode),
              taxName: toNullIfEmpty(values.invoiceInfo.taxName),
              taxEmail: toNullIfEmpty(values.invoiceInfo.taxEmail),
            }
          : null,
    };
  }
  
  export function toClientUpdateBody(values: ClientUpsertFormState): ClientsUpdateBody {
    return {
      clientId: values.clientId.trim(),
      clientPhone: toNullIfEmpty(values.clientPhone),
  
      clientContacts: values.clientContacts.length
        ? values.clientContacts.map((c) => ({
            contactId: toNullIfEmpty(c.contactId),
            contactName: toNullIfEmpty(c.contactName),
            contactPhone: toNullIfEmpty(c.contactPhone),
            contactEmail: toNullIfEmpty(c.contactEmail),
            contactPosition: toNullIfEmpty(c.contactPosition),
            contactAddress: toNullIfEmpty(c.contactAddress),
          }))
        : null,
    };
  }
  
  export const emptyContact: ClientUpsertFormState["clientContacts"][number] = {
    contactId: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactPosition: "",
    contactAddress: "",
  };
  