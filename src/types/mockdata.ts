import type { Identity, Session } from "./identity";
import type { Client, Order } from "./crm";
import type { Matrix, Protocol, Parameter, SampleType } from "./library";
import type { Receipt, Sample, Analysis, Equipment, InventoryItem } from "./lab";
import type { FileEntity } from "./document";
import type { OpaiLog } from "./service";

// --- 0. CONSTANTS & HELPER ---
const NOW = new Date().toISOString();
const YESTERDAY = new Date(Date.now() - 86400000).toISOString();
const USER_ADMIN_ID = "USR-ADMIN-01";
const USER_SALE_ID = "USR-SALE-02";
const USER_TECH_ID = "USR-TECH-03";

// --- 1. IDENTITY MODULE ---

export const mockIdentities: Identity[] = [
    {
        identityId: USER_SALE_ID,
        email: "sale@lims.com",
        identityName: "Tran Thi Sale",
        alias: "Sales Team A",
        roles: { customerService: true, marketingCommunications: false },
        identityStatus: "active",
        createdAt: "2025-01-01T08:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
    {
        identityId: USER_TECH_ID,
        email: "tech@lims.com",
        identityName: "Nguyen Van Ky Thuat",
        alias: "Lab Team 1",
        roles: { technician: true, qualityControl: true },
        identityStatus: "active",
        createdAt: "2025-01-01T08:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
];

export const mockSessions: Session[] = [
    {
        sessionId: "SES-001-XYZ",
        identityId: USER_SALE_ID,
        sessionExpiry: new Date(Date.now() + 3600000).toISOString(), // +1 hour
        sessionStatus: "active",
        ipAddress: "192.168.1.100",
        sessionDomain: "app.lims-saas.com",
        createdAt: NOW,
        modifiedAt: NOW,
    },
];

// --- 2. LIBRARY MODULE (Cấu hình trước khi chạy đơn) ---

export const mockSampleTypes: SampleType[] = [
    {
        sampleTypeId: "ST-FOOD",
        sampleTypeName: "Thực phẩm & Nông sản",
        displayTypeStyle: { eng: "Food & Agriculture", default: "Thực phẩm" },
        createdAt: "2025-01-01T00:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: "2025-01-01T00:00:00Z",
        modifiedById: USER_ADMIN_ID,
    },
];

export const mockParameters: Parameter[] = [
    {
        parameterId: "PAR-PB",
        parameterName: "Chì (Lead - Pb)",
        displayStyle: { decimal: 3, unit: "mg/kg" },
        createdAt: "2025-01-01T00:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
    {
        parameterId: "PAR-SAL",
        parameterName: "Salmonella spp.",
        displayStyle: { format: "text" }, // Âm tính/Dương tính
        createdAt: "2025-01-01T00:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
];

// Matrix kết hợp Loại mẫu + Chỉ tiêu + Giá + Phương pháp
export const mockMatrices: Matrix[] = [
    {
        matrixId: "MAT-FOOD-PB",
        sampleTypeId: "ST-FOOD",
        parameterId: "PAR-PB",
        parameterName: "Chì (Lead - Pb)",
        sampleTypeName: "Thực phẩm",
        protocolCode: "AOAC 2015.01",
        feeBeforeTax: 500000,
        taxRate: 8,
        feeAfterTax: 540000,
        LOD: "0.01 mg/kg",
        LOQ: "0.03 mg/kg",
        thresholdLimit: "< 1.0",
        turnaroundTime: 5,
        createdAt: "2025-01-01T00:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
    {
        matrixId: "MAT-FOOD-SAL",
        sampleTypeId: "ST-FOOD",
        parameterId: "PAR-SAL",
        parameterName: "Salmonella spp.",
        sampleTypeName: "Thực phẩm",
        protocolCode: "ISO 6579-1:2017",
        feeBeforeTax: 300000,
        taxRate: 8,
        feeAfterTax: 324000,
        thresholdLimit: "Not Detected / 25g",
        turnaroundTime: 3,
        createdAt: "2025-01-01T00:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
];

export const mockProtocols: Protocol[] = [
    {
        protocolId: "PRO-AOAC-2015",
        protocolCode: "AOAC 2015.01",
        protocolName: "Determination of heavy metals",
        protocolGroup: "Kim loại",
        protocolSource: "AOAC International",
        protocolAccreditation: { VILAS: true },
        description: "Phương pháp xác định kim loại nặng bằng ICP-MS",
        executionTime: "2-3 giờ",
        createdAt: "2024-01-01T00:00:00Z",
        createdById: "ADMIN",
        modifiedAt: "2024-01-01T00:00:00Z",
        modifiedById: "ADMIN",
    },
    {
        protocolId: "PRO-ISO-6579",
        protocolCode: "ISO 6579-1:2017",
        protocolName: "Detection of Salmonella",
        protocolGroup: "Vi sinh",
        protocolSource: "ISO",
        protocolAccreditation: { VILAS: true, ISO: true },
        description: "Phương pháp phát hiện Salmonella spp.",
        executionTime: "3-5 ngày",
        createdAt: "2024-01-01T00:00:00Z",
        createdById: "ADMIN",
        modifiedAt: "2024-01-01T00:00:00Z",
        modifiedById: "ADMIN",
    },
];

// --- 3. CRM MODULE ---

export const mockClients: Client[] = [
    {
        clientId: "CLI-GREENFOOD",
        clientName: "Green Foods JSC",
        legalId: "0101234567",
        clientAddress: "123 Industrial Zone, Hanoi",
        clientPhone: "0987654321",
        clientEmail: "contact@greenfoods.vn",
        clientSaleScope: "public",
        availableByIds: [USER_SALE_ID],
        contacts: [
            {
                contactId: "CON-01",
                contactName: "Mr. Manager",
                contactPhone: "0909000000",
                contactEmail: "manager@greenfoods.vn",
                contactPosition: "QA Manager",
            },
        ],
        invoiceInfo: {
            taxCode: "0101234567",
            taxName: "Green Foods Joint Stock Company",
            taxAddress: "123 Industrial Zone, Hanoi",
        },
        totalOrderAmount: 15000000,
        createdAt: YESTERDAY,
        createdById: USER_SALE_ID,
        modifiedAt: NOW,
        modifiedById: USER_SALE_ID,
    },
];

export const mockOrders: Order[] = [
    {
        orderId: "ORD-2026-001",
        clientId: "CLI-GREENFOOD",
        client: {
            clientId: "CLI-GREENFOOD",
            clientName: "Green Foods JSC",
            clientAddress: "123 Industrial Zone, Hanoi",
        },
        contactPerson: {
            contactName: "Mr. Manager",
            contactPhone: "0909000000",
        },
        salePersonId: USER_SALE_ID,
        salePerson: "Tran Thi Sale",
        // Khách gửi 1 mẫu Tôm, yêu cầu làm 2 chỉ tiêu
        samples: [
            {
                sampleId: "SAM-2601-001", // Sẽ được sinh ra khi tạo Receipt, ở đây giả định Order đã xử lý
                userSampleId: "GF-SHRIMP-01",
                sampleName: "Tôm thẻ đông lạnh (Frozen Shrimp)",
                sampleTypeId: "ST-FOOD",
                analyses: [
                    {
                        matrixId: "MAT-FOOD-PB",
                        parameterName: "Chì (Lead - Pb)",
                        feeBeforeTax: 500000,
                        taxRate: 8,
                        feeAfterTax: 540000,
                    },
                    {
                        matrixId: "MAT-FOOD-SAL",
                        parameterName: "Salmonella spp.",
                        feeBeforeTax: 300000,
                        taxRate: 8,
                        feeAfterTax: 324000,
                    },
                ],
            },
        ],
        totalFeeBeforeTax: 800000,
        totalFeeBeforeTaxAndDiscount: 800000, // Không giảm giá
        totalDiscountValue: 0,
        discountRate: 0,
        taxRate: 8,
        totalTaxValue: 64000,
        totalAmount: 864000,
        orderStatus: "Processing",
        paymentStatus: "Unpaid",
        transactions: [],
        createdAt: NOW,
        createdById: USER_SALE_ID,
        modifiedAt: NOW,
        modifiedById: USER_SALE_ID,
    },
];

// --- 4. LAB MODULE (Quy trình nhận mẫu & phân tích) ---

export const mockReceipts: Receipt[] = [
    {
        receiptId: "REC-2601-001",
        receiptCode: "26A0001",
        receiptStatus: "Processing",
        receiptDate: NOW,
        receiptDeadline: new Date(Date.now() + 5 * 86400000).toISOString(), // +5 days
        receiptPriority: "Normal",
        receiptDeliveryMethod: "Pickup",
        orderId: "ORD-2026-001",
        clientId: "CLI-GREENFOOD",
        // Snapshot dữ liệu tại thời điểm nhận
        order: {
            orderId: "ORD-2026-001",
            totalAmount: 864000,
        },
        client: {
            clientId: "CLI-GREENFOOD",
            clientName: "Green Foods JSC",
        },
        conditionCheck: {
            temp: "-18oC",
            packaging: "Sealed plastic bag",
            integrity: "Good",
        },
        reportConfig: {
            language: "vi",
            copies: 2,
            sendSoftCopy: true,
        },
        createdAt: NOW,
        createdById: "USR-SAMPLE-MGR",
        modifiedAt: NOW,
        modifiedById: "USR-SAMPLE-MGR",
    },
];

export const mockSamples: Sample[] = [
    {
        sampleId: "SAM-2601-001",
        receiptId: "REC-2601-001",
        sampleTypeId: "ST-FOOD",
        sampleTypeName: "Thực phẩm & Nông sản",
        productType: "Thủy sản đông lạnh",
        sampleClientInfo: "Lô 01/2026 - NSX: 10/01/2026",
        sampleInfo: [
            { label: "Màu sắc", value: "Xám xanh" },
            { label: "Trạng thái", value: "Đông cứng" },
        ],
        sampleReceiptInfo: [{ label: "Nhiệt độ nhận", value: "-5 độ C" }],
        sampleStatus: "Analyzing", // Đang phân tích
        sampleVolume: "1 túi 500g",
        sampleWeight: 500,
        samplePreservation: "Tủ đông -18 độ C",
        sampleStorageLoc: "Freezer-01-A2",
        sampleIsReference: true, // Có lưu mẫu
        createdAt: NOW,
        createdById: "USR-SAMPLE-MGR",
        modifiedAt: NOW,
        modifiedById: "USR-SAMPLE-MGR",
    },
];

export const mockAnalyses: Analysis[] = [
    {
        analysisId: "ANA-2601-001-PB",
        sampleId: "SAM-2601-001",
        matrixId: "MAT-FOOD-PB",
        parameterId: "PAR-PB",
        parameterName: "Chì (Lead - Pb)",
        technicianId: USER_TECH_ID,
        equipmentId: "EQ-ICP-01",
        analysisStatus: "Testing", // KTV đang làm
        analysisResultStatus: "NotEvaluated",
        analysisMethodLOD: "0.01 mg/kg", // Snapshot từ Matrix
        protocolCode: "AOAC 2015.01", // Snapshot
        analysisLocation: "Lab Hóa Vô cơ",
        createdAt: NOW,
        createdById: "USR-SAMPLE-MGR",
        modifiedAt: NOW,
        modifiedById: USER_TECH_ID,
    },
    {
        analysisId: "ANA-2601-001-SAL",
        sampleId: "SAM-2601-001",
        matrixId: "MAT-FOOD-SAL",
        parameterId: "PAR-SAL",
        parameterName: "Salmonella spp.",
        technicianId: "USR-MICRO-BIO-01",
        analysisStatus: "Pending", // Chưa làm
        analysisResultStatus: "NotEvaluated",
        protocolCode: "ISO 6579-1:2017",
        analysisLocation: "Lab Vi Sinh",
        createdAt: NOW,
        createdById: "USR-SAMPLE-MGR",
        modifiedAt: NOW,
        modifiedById: "USR-SAMPLE-MGR",
    },
];

export const mockEquipments: Equipment[] = [
    {
        equipmentId: "EQ-ICP-01",
        equipmentName: "ICP-MS System",
        equipmentCode: "TS-2020-005",
        equipmentStatus: "Active",
        equipmentCalibDate: "2025-06-01T00:00:00Z",
        equipmentNextCalib: "2026-06-01T00:00:00Z",
        createdAt: "2020-01-01T00:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
];

export const mockInventoryItems: InventoryItem[] = [
    {
        itemId: "CHEM-HNO3",
        itemName: "Nitric Acid 65%",
        itemType: "Chemical",
        itemStockQty: 4.5, // Lít
        itemUnit: "Lit",
        itemLotNo: "M2025-001",
        itemExpiryDate: "2027-01-01T00:00:00Z",
        itemLocation: "Kho Hóa Chất - Tủ Axit",
        itemCasNo: "7697-37-2",
        createdAt: "2025-01-01T00:00:00Z",
        createdById: USER_ADMIN_ID,
        modifiedAt: NOW,
        modifiedById: USER_ADMIN_ID,
    },
];

// --- 5. DOCUMENT & SERVICE MODULE ---

export const mockFiles: FileEntity[] = [
    {
        fileId: "FILE-IMG-001",
        fileName: "sample_photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 2048000,
        uris: ["https://s3.aws.com/bucket/sample_photo.jpg"],
        fileTags: ["SamplePhoto", "Evidence"],
        createdAt: NOW,
        createdById: "USR-SAMPLE-MGR",
        modifiedAt: NOW,
        modifiedById: "USR-SAMPLE-MGR",
    },
];

export const mockOpaiLogs: OpaiLog[] = [
    {
        messageOpaiId: "MSG-AI-001",
        role: "user",
        content: "Phân tích xu hướng kết quả Chì trong mẫu tôm của khách hàng Green Foods năm ngoái",
        tokenUsage: {
            promptTokens: 50,
            completionTokens: 0,
            totalTokens: 50,
        },
        contextId: "CHAT-SESSION-01",
        createdAt: NOW,
        createdById: USER_SALE_ID,
        modifiedAt: NOW,
        modifiedById: USER_SALE_ID,
    },
];
