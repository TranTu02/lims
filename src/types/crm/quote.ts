import type { EntityInfo, MaybeMoney, MaybeNumber } from "../common";

export type QuoteBase = {
  entity: EntityInfo;

  quoteId: string;
  clientId: string;

  createdAt: string;
  createdById: string | null;
  modifiedAt: string;
  modifiedById: string | null;
};

export type QuoteDetail = QuoteBase & {
  quoteCode: string | null;

  client: unknown | null;

  salePersonId: string | null;
  salePerson: unknown | null;

  contactPerson: Record<string, unknown> | null;

  samples: unknown[] | null;

  totalFeeBeforeTax: MaybeMoney;
  totalFeeBeforeTaxAndDiscount: MaybeMoney;
  totalTaxValue: MaybeMoney;
  totalDiscountValue: MaybeMoney;

  taxRate: MaybeNumber;
  discount: MaybeNumber;

  totalAmount: MaybeMoney;

  quoteStatus: string | null;

  deletedAt: string | null;
};

export type QuoteFull = QuoteBase & {
  totalAmount: number;
  quoteStatus: string | null;
};

export type QuoteListItem = QuoteDetail & {
  total_count: string;
};

export type QuotesCreateBody = Record<string, unknown>;
export type QuotesCreateFullBody = Record<string, unknown>;
export type QuotesUpdateBody = { quoteId: string } & Record<string, unknown>;
