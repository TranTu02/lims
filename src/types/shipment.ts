export type ShipmentAddressSnapshot = {
    address: string;
    wardId: number | null;
    wardName: string | null;
    districtId: number | null;
    districtName: string | null;
    provinceId: number | null;
    provinceName: string | null;
};

export type ShipmentSender = {
    senderName: string;
    senderAddress: string | ShipmentAddressSnapshot;
    senderPhone: string;
    senderEmail?: string;
    [key: string]: unknown;
};

export type ShipmentReceiver = {
    receiverName: string;
    receiverAddress: string | ShipmentAddressSnapshot;
    receiverPhone: string;
    receiverEmail?: string;
    [key: string]: unknown;
};

export type ShipmentProduct = {
    name: string;
    description?: string;
    quantity: number;
    weight: number;
    type: string; // "HH"
    [key: string]: unknown;
};

export type ShipmentOrderInfo = {
    payment: number;
    service: string;
    serviceAddress?: string;
    voucher?: string;
    note?: string;
    [key: string]: unknown;
};

export type ShipmentItem = {
    name: string;
    type: string;
    weight: number;
    quantity: number;
    description?: string;
    [key: string]: unknown;
};

export type ShipmentStatus = "CREATED" | "PICKUP" | "DELIVERED" | "CANCELED";

export type ShipmentDetail = {
    shipmentId: string;
    shipmentCarrier: string; // "ViettelPost" | "Self-Pickup" | ...
    shipmentSender: ShipmentSender;
    shipmentReceiver: ShipmentReceiver;
    shipmentProduct: ShipmentProduct;
    shipmentOrder: ShipmentOrderInfo;
    shipmentItems: ShipmentItem[];
    shipmentReferenceIds: string[];
    shipmentReceiptIds: string[];
    shipmentStatus: ShipmentStatus;
    shipmentTrackingNumber: string | null;
    shipmentDate: string | null;
    shipmentDeliveryDate: string | null;
    shipmentFee: number;
    shipmentNote: string;
    appUID: string;
    _deprecated_trackingNumber?: string | null;
    createdAt: string;
    createdById: string;
    modifiedAt: string | null;
    modifiedById: string | null;
    deletedAt: string | null;
    
    // Virtual expanded info
    receipts?: any[]; 
};

export type ShipmentListItem = ShipmentDetail;

export type ShipmentsCreateBody = {
    mode?: "pickup" | "attach" | string;
    existingTrackingNumber?: string;
    attachShipmentId?: string;
    shipmentId?: string;             // newly requested
    shipmentCarrier?: string;
    shipmentSender?: ShipmentSender;
    shipmentReceiver?: ShipmentReceiver;
    shipmentStatus?: string;         // newly requested
    shipmentProduct?: ShipmentProduct;
    shipmentItems?: ShipmentItem[];  // newly requested
    shipmentOrder?: ShipmentOrderInfo;
    shipmentReferenceIds?: string[]; // newly requested
    shipmentReceiptIds: string[];
    shipmentNote?: string;           // newly requested
    appUID?: string;
};

export type ShipmentsUpdateBody = {
    shipmentId?: string;
    trackingNumber?: string;
    status?: string | ShipmentStatus;
    note?: string;
};

export type ShipmentsDeleteBody = {
    shipmentId: string;
};

export type ShipmentDeleteResult = {
    id: string;
    status: string;
};
