import type { EntityInfo, MaybeMoney, MaybeNumber } from "../common";

export type QuoteClientInfo = {
  taxCode: string | null;
  taxName: string | null;
  taxAddress: string | null;
  [key: string]: unknown;
};

export type QuoteContactPerson = {
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactPosition: string | null;
  [key: string]: unknown;
};

export type QuoteSalePerson = Record<string, unknown>;

export type QuoteBase = {
  entity: EntityInfo;

  quoteId: string;

  clientId: string | null;

  createdAt: string;
  createdById: string | null;

  modifiedAt: string;
  modifiedById: string | null;

  deletedAt: string | null;
};

export type QuoteDetail = QuoteBase & {
  quoteCode: string | null;

  client: QuoteClientInfo | null;

  salePersonId: string | null;
  salePerson: QuoteSalePerson | null;

  contactPerson: QuoteContactPerson | null;

  samples: unknown[] | null;

  totalFeeBeforeTax: MaybeMoney;
  totalFeeBeforeTaxAndDiscount: MaybeMoney;
  totalTaxValue: MaybeMoney;
  totalDiscountValue: MaybeMoney;

  taxRate: MaybeNumber;
  discount: MaybeNumber;

  totalAmount: MaybeMoney;

  quoteStatus: string | null;
};

export type QuoteListItem = QuoteDetail & {
  total_count: string;
};

export type QuoteUpsertFields = {
  quoteCode?: string | null;

  clientId?: string | null;
  client?: QuoteClientInfo | null;

  salePersonId?: string | null;
  salePerson?: QuoteSalePerson | null;

  contactPerson?: QuoteContactPerson | null;

  samples?: unknown[] | null;

  totalFeeBeforeTax?: MaybeMoney;
  totalFeeBeforeTaxAndDiscount?: MaybeMoney;
  totalTaxValue?: MaybeMoney;
  totalDiscountValue?: MaybeMoney;

  taxRate?: MaybeNumber;
  discount?: MaybeNumber;

  totalAmount?: MaybeMoney;
  quoteStatus?: string | null;

  createdAt?: string;
  createdById?: string | null;
  modifiedAt?: string;
  modifiedById?: string | null;
  deletedAt?: string | null;
};

export type QuotesCreateBody = {
  entity: EntityInfo;

  quoteId: string;
} & QuoteUpsertFields;


export type QuotesUpdateBody = {
  entity: EntityInfo;
  quoteId: string;
} & QuoteUpsertFields;

export type QuoteFormFields = QuoteUpsertFields;
