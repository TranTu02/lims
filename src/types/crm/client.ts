import type { EntityInfo } from "../common";

export type ApiError = {
  message?: string;
  code?: string | null;
  details?: unknown;
} | null;

export type ApiMeta = Record<string, unknown> | null;

export type ApiResponse<TData, TMeta = ApiMeta> = {
  success: boolean;
  data: TData;
  meta: TMeta;
  error: ApiError;
};

export type ClientContact = {
  contactId?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactPosition?: string | null;
  contactAddress?: string | null;

  [key: string]: unknown;
};

export type ClientInvoiceInfo = {
  taxCode?: string | null;
  taxName?: string | null;
  taxEmail?: string | null;
  taxAddress?: string | null;

  [key: string]: unknown;
};

export type ClientSaleScope = "public" | "private" | (string & {}) | null;

export type ClientBase = {
  entity: EntityInfo;

  clientId: string;
  clientName: string;

  legalId: string | null;
  clientAddress: string | null;
  clientPhone: string | null;
  clientEmail: string | null;

  clientSaleScope: ClientSaleScope;

  availableByIds: string[] | null;
  availableByName: string[] | null;

  clientContacts: ClientContact[] | null;

  invoiceInfo: ClientInvoiceInfo | null;

  totalOrderAmount: string | null;

  createdAt: string;
  createdById: string | null;
  modifiedAt: string;
  modifiedById: string | null;
  deletedAt: string | null;
};

export type ClientListItem = ClientBase & {
  total_count: string;
};

export type ClientDetail = ClientBase;

export type ClientsCreateBody = {
  clientName: string;

  legalId?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;

  clientSaleScope?: ClientSaleScope;

  availableByIds?: string[] | null;
  availableByName?: string[] | null;

  clientContacts?: ClientContact[] | null;

  invoiceInfo?: ClientInvoiceInfo | null;

  totalOrderAmount?: string | null;

  [key: string]: unknown;
};

export type ClientsUpdateBody = {
  clientId: string;

  clientName?: string;

  legalId?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;

  clientSaleScope?: ClientSaleScope;

  availableByIds?: string[] | null;
  availableByName?: string[] | null;

  clientContacts?: ClientContact[] | null;

  invoiceInfo?: ClientInvoiceInfo | null;

  totalOrderAmount?: string | null;

  [key: string]: unknown;
};

export type ClientsListResponse = ApiResponse<ClientListItem[]>;

export type ClientsDetailResponse = ApiResponse<ClientDetail>;

export type ClientsCreateResponse = ApiResponse<ClientDetail>;

export type ClientsUpdateResponse = ApiResponse<ClientDetail>;

export type ClientsDeleteResponse = ApiResponse<null | { clientId: string } | boolean>;
