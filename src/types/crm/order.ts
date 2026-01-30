export type EntityInfo = {
  type?: string | null;
  [key: string]: unknown;
};

export type OrderStatus =
  | "Completed"
  | "Processing"
  | "Pending"
  | "Cancelled"
  | (string & {});

export type PaymentStatus =
  | "Paid"
  | "Unpaid"
  | "Partially"
  | "Debt"
  | (string & {});

export type OrderTransactionMethod =
  | "BankTransfer"
  | "Cash"
  | "Card"
  | (string & {});

export type OrderClientRef = {
  clientId?: string | null;
  clientName?: string | null;
  [key: string]: unknown;
};

export type OrderContactPerson = {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  [key: string]: unknown;
};

export type OrderSampleAnalysis = {
  matrixId?: string | null;
  [key: string]: unknown;
};

export type OrderSampleItem = {
  analyses?: OrderSampleAnalysis[] | null;

  sampleId?: string | null;
  sampleName?: string | null;
  sampleTypeId?: string | null;
  userSampleId?: string | null;
  sampleTypeName?: string | null;

  [key: string]: unknown;
};

export type OrderTransaction = {
  date?: string | null;
  note?: string | null;
  amount?: string | null;
  method?: OrderTransactionMethod | string | null;
  [key: string]: unknown;
};

export type OrderRequestForm = {
  requestedBy?: string | null;
  requestedAt?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

export type OrderDetail = {
  entity?: EntityInfo;

  orderId: string;
  quoteId?: string | null;

  clientId?: string | null;
  client?: OrderClientRef | null;

  contactPerson?: OrderContactPerson | null;

  salePersonId?: string | null;
  salePerson?: unknown | null;
  saleCommissionPercent?: string | null;

  samples?: OrderSampleItem[] | null;

  totalAmount?: string | null;
  totalFeeBeforeTax?: string | null;
  totalFeeBeforeTaxAndDiscount?: string | null;
  totalTaxValue?: string | null;
  totalDiscountValue?: string | null;

  orderStatus?: OrderStatus | string | null;
  taxRate?: string | null;
  discountRate?: string | null;
  paymentStatus?: PaymentStatus | string | null;

  transactions?: OrderTransaction[] | null;

  createdAt?: string | null;
  createdById?: string | null;
  modifiedAt?: string | null;
  modifiedById?: string | null;
  deletedAt?: string | null;

  reportRecipient?: unknown | null;
  orderUri?: string | null;

  requestForm?: string | null;

  [key: string]: unknown;
};

export type OrderFull = OrderDetail;

export type OrderListItem = Pick<
  OrderDetail,
  "orderId" | "quoteId" | "clientId" | "totalAmount" | "orderStatus" | "paymentStatus" | "createdAt"
> & {
  [key: string]: unknown;
};

export type OrdersCreateBody = {
  orderId?: string | null;
  quoteId?: string | null;
  clientId?: string | null;

  contactPerson?: OrderContactPerson | null;

  salePersonId?: string | null;
  saleCommissionPercent?: string | null;

  samples?: OrderSampleItem[] | null;

  totalAmount?: string | null;

  orderStatus?: OrderStatus | string | null;
  paymentStatus?: PaymentStatus | string | null;

  taxRate?: string | null;
  discountRate?: string | null;

  transactions?: OrderTransaction[] | null;

  reportRecipient?: unknown | null;
  orderUri?: string | null;

  requestForm?: string | null;

  [key: string]: unknown;
};

export type OrdersCreateFullBody = OrdersCreateBody;

export type OrdersUpdateBody = {
  orderId: string;

  quoteId?: string | null;
  clientId?: string | null;

  contactPerson?: OrderContactPerson | null;

  salePersonId?: string | null;
  saleCommissionPercent?: string | null;

  samples?: OrderSampleItem[] | null;

  totalAmount?: string | null;

  orderStatus?: OrderStatus | string | null;
  paymentStatus?: PaymentStatus | string | null;

  taxRate?: string | null;
  discountRate?: string | null;

  transactions?: OrderTransaction[] | null;

  reportRecipient?: unknown | null;
  orderUri?: string | null;

  requestForm?: string | null;

  [key: string]: unknown;
};
