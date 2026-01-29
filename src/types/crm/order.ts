import type { EntityInfo, MaybeMoney, MaybeNumber } from "../common";

export type OrderBase = {
  entity: EntityInfo;

  orderId: string;
  quoteId: string | null;

  clientId: string;

  createdAt: string;
  createdById: string | null;
  modifiedAt: string;
  modifiedById: string | null;
};

export type OrderDetail = OrderBase & {
  client: unknown | null;

  contactPerson: Record<string, unknown> | null;

  salePersonId: string | null;
  salePerson: unknown | null;
  saleCommissionPercent: MaybeNumber;

  samples: unknown[] | null;

  totalAmount: MaybeMoney;
  totalFeeBeforeTax: MaybeMoney;
  totalFeeBeforeTaxAndDiscount: MaybeMoney;
  totalTaxValue: MaybeMoney;
  totalDiscountValue: MaybeMoney;

  orderStatus: string | null;

  taxRate: MaybeNumber;
  discountRate: MaybeNumber;

  paymentStatus: string | null;
  transactions: unknown[] | null;

  deletedAt: string | null;

  reportRecipient: Record<string, unknown> | null;
  orderUri: string | null;
  requestForm: Record<string, unknown> | null;
};

export type OrderFull = OrderBase & {
  totalAmount: number;
  totalFeeBeforeTax: number;
  orderStatus: string | null;
};

export type OrderListItem = OrderDetail & {
  total_count: string;
};

export type OrdersCreateBody = Record<string, unknown>;
export type OrdersCreateFullBody = Record<string, unknown>;
export type OrdersUpdateBody = { orderId: string } & Record<string, unknown>;
