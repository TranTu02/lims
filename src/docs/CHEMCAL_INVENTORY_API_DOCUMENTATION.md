# CHEMICAL INVENTORY MODULE - API DOCUMENTATION

This document provides detailed documentation for the CHEMICAL INVENTORY module API endpoints, including request methods, paths, query parameters, and **explicit JSON response structures** based on actual API test results. All endpoints work directly with the `chemicalInventory` database schema.

## 1. Authentication

All API endpoints require a valid JWT token in the `Authorization` header.

**Header Format**:

```http
Authorization: Bearer {authToken}
```

**Login Response Example**:

```json
{
    "token": "SS_6848c0bb-e6b4-4bfc-879c-0867274b7bba",
    "identity": "Nguyễn Văn An",
    "roles": [
        "ROLE_SUPER_ADMIN",
        "ROLE_DOC_CONTROLLER",
        "ROLE_DIRECTOR",
        "ROLE_TECH_MANAGER",
        "ROLE_QA_MANAGER",
        "ROLE_SECTION_HEAD",
        "ROLE_VALIDATOR",
        "ROLE_SENIOR_ANALYST",
        "ROLE_TECHNICIAN",
        "ROLE_RECEPTIONIST",
        "ROLE_SAMPLE_CUSTODIAN",
        "ROLE_EQUIPMENT_MGR",
        "ROLE_INVENTORY_MGR",
        "ROLE_SALES_MANAGER",
        "ROLE_SALES_EXEC",
        "ROLE_CS",
        "ROLE_ACCOUNTANT",
        "ROLE_REPORT_OFFICER"
    ]
}
```

---

## 2. CHEMICAL SKU APIs (Danh mục SKU Hóa chất gốc)

Đại diện cho các mặt hàng hóa chất cấp tổng.

### 2.1 Get Chemical SKU List

**Endpoint**: `GET /v2/chemicalskus/get/list` (hoặc `POST /v2/chemicalskus/get/list`)

**Query Parameters / Body**:

- `page` (number): Page number
- `itemsPerPage` (number): Items per page

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "chemicalSkuId": "SKU-CHEM-001",
            "chemicalName": "Hydrochloric Acid 94%",
            "chemicalCASNumber": "4801-90-8",
            "chemicalBaseUnit": "g",
            "chemicalTotalAvailableQty": "2248",
            "chemicalReorderLevel": "430",
            "chemicalHazardClass": "Toxic",
            "createdAt": "2026-03-03T07:15:29.334Z",
            "createdById": null,
            "modifiedAt": null,
            "modifiedById": null,
            "deletedAt": null
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 50,
        "totalPages": 50
    },
    "error": null
}
```

### 2.2 Get Chemical SKU Detail

**Endpoint**: `GET /v2/chemicalskus/get/detail?chemicalSkuId={id}`

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalSkuId": "SKU-CHEM-001",
        "chemicalName": "Hydrochloric Acid 94%",
        "chemicalCASNumber": "4801-90-8",
        "chemicalBaseUnit": "g",
        "chemicalTotalAvailableQty": 2248,
        "chemicalReorderLevel": 430,
        "chemicalHazardClass": "Toxic",
        "createdAt": "2026-03-03T07:15:29.334Z"
    },
    "pagination": null,
    "error": null
}
```

### 2.3 Get Chemical SKU Full

**Endpoint**: `GET /v2/chemicalskus/get/full?chemicalSkuId={id}`

**Response Structure**: (Bao gồm snapshots của Items thực tế trong kho và các Suppliers phân phối)

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalSkuId": "SKU-CHEM-001",
        "chemicalName": "Hydrochloric Acid 94%",
        "chemicalCASNumber": "4801-90-8",
        "chemicalBaseUnit": "g",
        "chemicalTotalAvailableQty": "2248",
        "chemicalReorderLevel": "430",
        "chemicalHazardClass": "Toxic",
        "createdAt": "2026-03-03T07:15:29.334Z",
        "items": [
            {
                "chemicalInventoryId": "BTL-2603-0105",
                "chemicalSkuId": "SKU-CHEM-001",
                "chemicalName": "Hydrochloric Acid 94%",
                "chemicalCASNumber": "4801-90-8",
                "chemicalSupplierId": "SUP-007",
                "lotNumber": "LOT-61855",
                "manufacturerName": "Fisher",
                "manufacturerCountry": "Germany",
                "inventoryCOADocumentIds": null,
                "currentAvailableQty": "1153",
                "mfgDate": "2023-11-15T00:00:00.000Z",
                "expDate": "2028-09-23T00:00:00.000Z",
                "openedDate": "2024-02-24T00:00:00.000Z",
                "openedExpDate": "2028-04-25T00:00:00.000Z",
                "chemicalInventoryStatus": "New",
                "storageBinLocation": "Tủ hóa chất B - Tầng 5",
                "createdAt": "2026-03-03T07:15:29.334Z",
                "createdById": null,
                "modifiedAt": null,
                "modifiedById": null,
                "deletedAt": null
            }
        ],
        "suppliers": [
            {
                "chemicalSku_chemicalSupplierId": "SKU-CHEM-001_SUP-007",
                "chemicalSkuId": "SKU-CHEM-001",
                "chemicalSupplierId": "SUP-007",
                "catalogNumber": "8.46396.1036",
                "brandManufacturer": "Scharlau",
                "packagingSize": "4000",
                "leadTimeDays": 43,
                "createdAt": "2026-03-03T07:15:29.334Z",
                "createdById": null,
                "modifiedAt": null,
                "modifiedById": null,
                "deletedAt": null,
                "chemicalSupplier": {
                    "chemicalSupplierId": "SUP-007",
                    "supplierName": "Công ty Hóa chất 7",
                    "supplierAddress": "24 Khu công nghiệp, Việt Nam",
                    "supplierStatus": "Inactive",
                    "supplierEvaluationScore": 79,
                    "createdAt": "2026-03-03T07:15:29.334Z",
                    "supplierIsoCertifications": [
                        "ISO 9001:2015"
                    ],
                    "supplierTaxCode": "0102930749",
                    "supplierContactPerson": [
                        {
                            "contactName": "Mr. Supplier 7",
                            "contactEmail": "contact@supp7.com",
                            "contactPhone": "0900912419"
                        }
                    ]
                }
            }
        ]
    },
    "pagination": null,
    "error": null
}
```

### 2.4 Create, Update, Delete SKU

- **Create**: `POST /v2/chemicalskus/create` (Payload: Dữ liệu SKU, trừ `chemicalSkuId`)
- **Update**: `POST /v2/chemicalskus/update` (Payload: Yêu cầu có `chemicalSkuId`)
- **Delete**: `POST /v2/chemicalskus/delete` (Payload: Cần truyền `{"chemicalSkuId": "..."}`)

---

## 3. CHEMICAL SUPPLIER APIs (Danh mục Nhà cung cấp)

Quản lý thông tin nhà cung cấp hóa chất.

### 3.1 Get Supplier List

**Endpoint**: `GET /v2/chemicalsuppliers/get/list`

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "chemicalSupplierId": "SUP-001",
            "supplierName": "Công ty Hóa chất 1",
            "supplierTaxCode": "0102478652",
            "supplierAddress": "89 Khu công nghiệp, Việt Nam",
            "supplierContactPerson": [
                {
                    "contactName": "Mr. Supplier 1",
                    "contactEmail": "contact@supp1.com",
                    "contactPhone": "0900697071"
                }
            ],
            "supplierStatus": "Active",
            "supplierEvaluationScore": "70",
            "supplierIsoCertifications": [
                "ISO 9001:2015",
                "ISO 17034"
            ],
            "createdAt": "2026-03-03T07:15:29.334Z",
            "createdById": null,
            "modifiedAt": null,
            "modifiedById": null,
            "deletedAt": null
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 10,
        "totalPages": 10
    },
    "error": null
}
```

### 3.2 Get Supplier Detail

**Endpoint**: `GET /v2/chemicalsuppliers/get/detail?chemicalSupplierId={id}`

**Response Structure**: Dữ liệu đối tượng duy nhất tương tự trả về từ List.

### 3.3 Get Supplier Full

**Endpoint**: `GET /v2/chemicalsuppliers/get/full?chemicalSupplierId={id}`

**Response Structure**: (Trường hợp này bao gồm snapshot link tới danh sách SKU phân phối `suppliedSkus`)

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalSupplierId": "SUP-001",
        "supplierName": "Công ty Hóa chất 1",
        "supplierAddress": "89 Khu công nghiệp, Việt Nam",
        "supplierStatus": "Active",
        "supplierEvaluationScore": 70,
        "createdAt": "2026-03-03T07:15:29.334Z",
        "supplierIsoCertifications": [
            "ISO 9001:2015",
            "ISO 17034"
        ],
        "supplierTaxCode": "0102478652",
        "supplierContactPerson": [
            {
                "contactName": "Mr. Supplier 1",
                "contactEmail": "contact@supp1.com",
                "contactPhone": "0900697071"
            }
        ],
        "suppliedSkus": [
            {
                "chemicalSku_chemicalSupplierId": "SKU-CHEM-002_SUP-001",
                "chemicalSkuId": "SKU-CHEM-002",
                "chemicalSupplierId": "SUP-001",
                "catalogNumber": "2.47963.8562",
                "brandManufacturer": "Sigma Aldrich",
                "packagingSize": "4000",
                "leadTimeDays": 21,
                "createdAt": "2026-03-03T07:15:29.334Z",
                "chemicalSku": {
                    "chemicalSkuId": "SKU-CHEM-002",
                    "chemicalName": "Methanol 53%",
                    "chemicalCASNumber": "3578-49-7",
                    "chemicalBaseUnit": "bottle",
                    "chemicalTotalAvailableQty": 6594,
                    "chemicalReorderLevel": 470,
                    "chemicalHazardClass": "Irritant",
                    "createdAt": "2026-03-03T07:15:29.334Z"
                }
            }
        ]
    },
    "pagination": null,
    "error": null
}
```

### 3.4 Create, Update, Delete Supplier

- **Create**: `POST /v2/chemicalsuppliers/create`
- **Update**: `POST /v2/chemicalsuppliers/update`
- **Delete**: `POST /v2/chemicalsuppliers/delete`

---

## 4. CHEMICAL SKU SUPPLIER APIs (Catalog)

Link nối SKU và Nhà cung cấp tương ứng quy cách lô/kiện.

### 4.1 Get SKU Supplier List

**Endpoint**: `GET /v2/chemicalskusuppliers/get/list`

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "chemicalSku_chemicalSupplierId": "SKU-CHEM-001_SUP-007",
            "chemicalSkuId": "SKU-CHEM-001",
            "chemicalSupplierId": "SUP-007",
            "catalogNumber": "8.46396.1036",
            "brandManufacturer": "Scharlau",
            "packagingSize": 4000,
            "leadTimeDays": 43,
            "createdAt": "2026-03-03T07:15:29.334Z"
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 74,
        "totalPages": 74
    },
    "error": null
}
```

### 4.2 Get SKU Supplier Detail

**Endpoint**: `GET /v2/chemicalskusuppliers/get/detail?chemicalSku_chemicalSupplierId={id}`

**Response Structure**: Dữ liệu phẳng

### 4.3 Get SKU Supplier Full

**Endpoint**: `GET /v2/chemicalskusuppliers/get/full?chemicalSku_chemicalSupplierId={id}`

**Response Structure**: (Trích xuất đầy đủ chi tiết của SKU và Supplier)

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalSku_chemicalSupplierId": "SKU-CHEM-001_SUP-007",
        "chemicalSkuId": "SKU-CHEM-001",
        "chemicalSupplierId": "SUP-007",
        "catalogNumber": "8.46396.1036",
        "brandManufacturer": "Scharlau",
        "packagingSize": 4000,
        "leadTimeDays": 43,
        "createdAt": "2026-03-03T07:15:29.334Z",
        "chemicalSku": {
            "chemicalSkuId": "SKU-CHEM-001",
            "chemicalName": "Hydrochloric Acid 94%",
            "chemicalCASNumber": "4801-90-8",
            "chemicalBaseUnit": "g",
            "chemicalTotalAvailableQty": 2248,
            "chemicalReorderLevel": 430,
            "chemicalHazardClass": "Toxic",
            "createdAt": "2026-03-03T07:15:29.334Z"
        },
        "chemicalSupplier": {
            "chemicalSupplierId": "SUP-007",
            "supplierName": "Công ty Hóa chất 7",
            "supplierAddress": "24 Khu công nghiệp, Việt Nam",
            "supplierStatus": "Inactive",
            "supplierEvaluationScore": 79,
            "createdAt": "2026-03-03T07:15:29.334Z",
            "supplierIsoCertifications": [
                "ISO 9001:2015"
            ],
            "supplierTaxCode": "0102930749",
            "supplierContactPerson": [
                {
                    "contactName": "Mr. Supplier 7",
                    "contactEmail": "contact@supp7.com",
                    "contactPhone": "0900912419"
                }
            ]
        }
    },
    "pagination": null,
    "error": null
}
```

### 4.4 Create, Update, Delete SKU Supplier

- **Create**: `POST /v2/chemicalskusuppliers/create`
- **Update**: `POST /v2/chemicalskusuppliers/update`
- **Delete**: `POST /v2/chemicalskusuppliers/delete`

---

## 5. CHEMICAL INVENTORY APIs (Tồn kho vật lý - Từng chai/lọ)

Đại diện cho từng thiết bị lọ/chai vật lý.

### 5.1 Get Inventory List

**Endpoint**: `GET /v2/chemicalinventories/get/list`

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "chemicalInventoryId": "BTL-2603-0001",
            "chemicalSkuId": "SKU-CHEM-021",
            "chemicalName": "Ethanol 58%",
            "chemicalCASNumber": "8049-22-8",
            "chemicalSupplierId": "SUP-007",
            "lotNumber": "LOT-62080",
            "manufacturerName": "Sigma Aldrich",
            "manufacturerCountry": "USA",
            "currentAvailableQty": 1672,
            "mfgDate": "2023-05-16T00:00:00.000Z",
            "expDate": "2028-07-25T00:00:00.000Z",
            "openedDate": "2024-04-08T00:00:00.000Z",
            "openedExpDate": "2028-05-14T00:00:00.000Z",
            "chemicalInventoryStatus": "InUse",
            "storageBinLocation": "Tủ hóa chất A - Tầng 3",
            "createdAt": "2026-03-03T07:15:29.334Z"
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 200,
        "totalPages": 200
    },
    "error": null
}
```

### 5.2 Get Inventory Detail

**Endpoint**: `GET /v2/chemicalinventories/get/detail?chemicalInventoryId={id}`

**Response Structure**: Trả về object chi tiết tĩnh.

### 5.3 Get Inventory Full

**Endpoint**: `GET /v2/chemicalinventories/get/full?chemicalInventoryId={id}`

**Response Structure**: (Trích xuất đầy đủ các class tham khảo liên quan tới Chai Hóa Chất cụ thể)

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalInventoryId": "BTL-2603-0001",
        "chemicalSkuId": "SKU-CHEM-021",
        "chemicalName": "Ethanol 58%",
        "chemicalCASNumber": "8049-22-8",
        "chemicalSupplierId": "SUP-007",
        "lotNumber": "LOT-62080",
        "manufacturerName": "Sigma Aldrich",
        "manufacturerCountry": "USA",
        "currentAvailableQty": 1672,
        "mfgDate": "2023-05-16T00:00:00.000Z",
        "expDate": "2028-07-25T00:00:00.000Z",
        "openedDate": "2024-04-08T00:00:00.000Z",
        "openedExpDate": "2028-05-14T00:00:00.000Z",
        "chemicalInventoryStatus": "InUse",
        "storageBinLocation": "Tủ hóa chất A - Tầng 3",
        "createdAt": "2026-03-03T07:15:29.334Z",
        "chemicalSku": {
            "chemicalSkuId": "SKU-CHEM-021",
            "chemicalName": "Ethanol 58%",
            "chemicalCASNumber": "8049-22-8",
            "chemicalBaseUnit": "bottle",
            "chemicalTotalAvailableQty": "9853",
            "chemicalReorderLevel": "432",
            "chemicalHazardClass": "Corrosive",
            "createdAt": "2026-03-03T07:15:29.334Z"
        },
        "chemicalSupplier": {
            "chemicalSupplierId": "SUP-007",
            "supplierName": "Công ty Hóa chất 7",
            "supplierAddress": "24 Khu công nghiệp, Việt Nam",
            "supplierStatus": "Inactive",
            "supplierEvaluationScore": 79,
            "createdAt": "2026-03-03T07:15:29.334Z",
            "supplierIsoCertifications": [
                "ISO 9001:2015"
            ],
            "supplierTaxCode": "0102930749",
            "supplierContactPerson": [
                {
                    "contactName": "Mr. Supplier 7",
                    "contactEmail": "contact@supp7.com",
                    "contactPhone": "0900912419"
                }
            ]
        }
    },
    "pagination": null,
    "error": null
}
```

### 5.4 Create, Update, Delete Inventory

- **Create**: `POST /v2/chemicalinventories/create`
- **Update**: `POST /v2/chemicalinventories/update`
- **Delete**: `POST /v2/chemicalinventories/delete`

---

## 6. CHEMICAL TRANSACTION BLOCK APIs (Phiếu Nhập/Xuất Header)

Phiếu Giao Dịch/Header liên kết tất cả Line Item với nhau khi Nhập kho/Xuất Kho.

### 6.1 Get Transaction Block List

**Endpoint**: `GET /v2/chemicaltransactionblocks/get/list`

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "chemicalTransactionBlockId": "TRB_3NA3JLS",
            "transactionType": "EXPORT",
            "referenceDocument": "",
            "createdAt": "2026-03-03T10:19:22.412Z",
            "createdById": "USR-DIR-001",
            "chemicalTransactionBlockStatus": "DRAFT",
            "approvedBy": null,
            "approvedAt": null
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 33,
        "totalPages": 33
    },
    "error": null
}
```

### 6.2 Get Transaction Block Detail

**Endpoint**: `GET /v2/chemicaltransactionblocks/get/detail?chemicalTransactionBlockId={id}`

**Response Structure**: Thông tin detail tĩnh.

### 6.3 Get Transaction Block Full

**Endpoint**: `GET /v2/chemicaltransactionblocks/get/full?chemicalTransactionBlockId={id}`

**Response Structure**: Bao gồm thuộc tính danh sách `transactions` line-item ở phía dưới

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalTransactionBlockId": "TRB_3NA3JLS",
        "transactionType": "EXPORT",
        "referenceDocument": "",
        "createdAt": "2026-03-03T10:19:22.412Z",
        "createdById": "USR-DIR-001",
        "chemicalTransactionBlockStatus": "DRAFT",
        "transactions": [
            {
                "chemicalTransactionId": "TXN_7VX9NT1",
                "chemicalTransactionBlockId": "TRB_3NA3JLS",
                "actionType": "SUPPLEMENTAL",
                "chemicalSkuId": "SKU-CHEM-023",
                "chemicalName": "Toluene 99%",
                "casNumber": "8052-14-8",
                "chemicalInventoryId": "BTL-2603-0050",
                "changeQty": "-100",
                "chemicalTransactionUnit": "ml",
                "analysisId": "",
                "chemicalTransactionNote": "",
                "createdAt": "2026-03-03T10:19:22.426Z",
                "createdById": "USR-DIR-001"
            }
        ],
        "details": []
    },
    "pagination": null,
    "error": null
}
```

### 6.4 Create Transaction Block Full (Tạo phiếu kèm danh sách chi tiết)

**Endpoint**: `POST /v2/chemicaltransactionblocks/createfull`

**Tác dụng**: Tạo Header Phiếu và tự động tạo các bản ghi **Detail** con đi kèm (Maker). Trạng thái block sẽ mặc định là `PENDING_APPROVAL`. Lúc này tồn kho chưa bị trừ.

**Request Body Example**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalTransactionBlock": {
            "transactionType": "EXPORT",
            "referenceDocument": "REQ-LAB-001"
        },
        "details": [
            {
                "actionType": "INITIAL_ISSUE",
                "chemicalSkuId": "SKU-CHEM-023",
                "chemicalInventoryId": "BTL-2603-0050",
                "changeQty": -100,
                "chemicalTransactionBlockDetailNote": "Xuất phục vụ thí nghiệm"
            }
        ]
    },
    "pagination": null,
    "error": null
}
```

**Response Structure**: Trả về object Block vừa tạo kèm mảng `details` đã được đánh ID.

**Response Structure**: Trả về object Block vừa tạo kèm mảng `transactions` đã được đánh ID.

### 6.5 Delete Transaction Block

---

## 7. CHEMICAL TRANSACTION APIs (Chi tiết Log Giao dịch)

### 7.1 Get Transaction List

**Endpoint**: `GET /v2/chemicaltransactions/get/list`

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "chemicalTransactionId": "TXN_7VX9NT1",
            "chemicalTransactionBlockId": "TRB_3NA3JLS",
            "actionType": "SUPPLEMENTAL",
            "chemicalSkuId": "SKU-CHEM-023",
            "chemicalName": "Toluene 99%",
            "casNumber": "8052-14-8",
            "chemicalInventoryId": "BTL-2603-0050",
            "changeQty": -100,
            "chemicalTransactionUnit": "ml",
            "analysisId": "",
            "chemicalTransactionNote": "",
            "createdAt": "2026-03-03T10:19:22.426Z",
            "createdById": "USR-DIR-001",
            "modifiedAt": "2026-03-03T10:19:22.426Z",
            "modifiedById": "USR-DIR-001"
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 94,
        "totalPages": 94
    },
    "error": null
}
```

### 7.2 Get Transaction Detail

**Endpoint**: `GET /v2/chemicaltransactions/get/detail?chemicalTransactionId={id}`

**Response Structure**: Khớp với dữ liệu phẳng bên trên.

### 7.3 Get Transaction Full

**Endpoint**: `GET /v2/chemicaltransactions/get/full?chemicalTransactionId={id}`

**Response Structure**: (Trích xuất đầy đủ Line Item, Object SKU Cha, Phiếu Header và Chai liên kết)

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalTransactionId": "TXN-TRB-2603-0001-01",
        "chemicalTransactionBlockId": "TRB-2603-0001",
        "actionType": "RETURN",
        "chemicalSkuId": "SKU-CHEM-032",
        "chemicalName": "Standard Cd 70%",
        "casNumber": "1745-95-7",
        "chemicalInventoryId": "BTL-2603-0186",
        "changeQty": 29.67,
        "chemicalTransactionUnit": "ml",
        "parameterName": "Kiểm tra dư lượng thuốc trừ sâu",
        "analysisId": "ANL-3980",
        "chemicalTransactionNote": "Hàng mới nhập",
        "createdAt": "2026-03-03T07:15:29.334Z",
        "chemicalSku": {
            "chemicalSkuId": "SKU-CHEM-032",
            "chemicalName": "Standard Cd 70%",
            "chemicalCASNumber": "1745-95-7",
            "chemicalBaseUnit": "ml",
            "chemicalTotalAvailableQty": "9162",
            "chemicalReorderLevel": "160",
            "chemicalHazardClass": "Flammable",
            "createdAt": "2026-03-03T07:15:29.334Z"
        },
        "chemicalTransactionBlock": {
            "chemicalTransactionBlockId": "TRB-2603-0001",
            "transactionType": "IMPORT",
            "referenceDocument": "PO/REQ-6364",
            "createdBy": "EMP-001",
            "createdAt": "2026-01-10T14:13:39.766Z"
        },
        "chemicalInventory": {
            "chemicalInventoryId": "BTL-2603-0186",
            "chemicalSkuId": "SKU-CHEM-032",
            "chemicalName": "Standard Cd 70%",
            "chemicalCASNumber": "1745-95-7",
            "chemicalSupplierId": "SUP-005",
            "lotNumber": "LOT-93071",
            "manufacturerName": "Fisher",
            "manufacturerCountry": "UK",
            "inventoryCOADocumentIds": null,
            "currentAvailableQty": "1042",
            "mfgDate": "2023-05-03T00:00:00.000Z",
            "expDate": "2028-08-01T00:00:00.000Z",
            "openedDate": "2023-08-07T00:00:00.000Z",
            "openedExpDate": "2028-07-02T00:00:00.000Z",
            "chemicalInventoryStatus": "Quarantined",
            "storageBinLocation": "Tủ hóa chất B - Tầng 2",
            "createdAt": "2026-03-03T07:15:29.334Z"
        }
    },
    "pagination": null,
    "error": null
}
```

### 7.4 Create, Update, Delete Transaction

- **Create**: `POST /v2/chemicaltransactions/create`
- **Update**: `POST /v2/chemicaltransactions/update`
- **Delete**: `POST /v2/chemicaltransactions/delete`

---

## 8. CÁC API NGHIỆP VỤ ĐẶC THÙ (BUSINESS LOGIC)

Các Endpoint đặc thù chỉ có sẵn trên Handler nhất định, dùng để tự động chạy Logic thuật toán thay vì Standard CRUD.

### 8.1 Phân bổ hóa chất tự động theo FEFO

Hệ thống sẽ tiến hành trừ `chemicalTotalAvailableQty` theo từng hóa chất vật lý dựa trên expDate (FEFO - Hạn sử dụng trước xuất trước).

- **Endpoint:** `POST /v2/chemicalinventories/allocate`
- **Payload (Body):**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalSkuId": "SKU-CHEM-001",
        "requiredQty": 100,
        "analysisId": "ANA-9992",
        "parameterName": "Phân tích Chì trong nước",
        "allocatedBy": "US-001"
    },
    "pagination": null,
    "error": null
}
```

### 8.2 Trả lại hóa chất tồn dư

Cộng trả lại hóa chất khi kiểm nghiệm không dùng hết để trả về kho bằng `chemicalInventoryId` vật lý lúc đầu nhận được và tự động sinh Log Transaction.

- **Endpoint:** `POST /v2/chemicalinventories/return`
- **Payload (Body):**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalInventoryId": "BTL-2603-0001",
        "returnQty": 20,
        "analysisId": "ANA-9992",
        "parameterName": "Dư trả lại kho",
        "returnedBy": "US-001"
    },
    "pagination": null,
    "error": null
}
```

### 8.3 Cập nhật / Đồng bộ lại tồn kho SKU tổng

Force tính toán và chạy query đếm tổng Sum(currentAvailableQty) của các Kho Hóa Chất Thực tế (`chemicalinventories`) bên trong của SKU này để set lại số dư tổng kho `chemicalTotalAvailableQty`.

- **Endpoint:** `POST /v2/chemicalskus/recalc`
- **Payload (Body):**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalSkuId": "SKU-CHEM-001"
    },
    "pagination": null,
    "error": null
}
```

---

## 9. CHEMICAL TRANSACTION BLOCK DETAIL APIs (Dòng chi tiết Phiếu nháp)

Cung cấp CRUD cho các dòng chi tiết nằm trong Block đang ở trạng thái `DRAFT` hoặc `PENDING_APPROVAL`.

### 9.1 Get Details List

- **Endpoint**: `GET /v2/chemicaltransactionblockdetails/get/list`

### 9.2 Get Detail Snapshot

- **Endpoint**: `GET /v2/chemicaltransactionblockdetails/get/detail?chemicalTransactionBlockDetailId={id}`

---

## 10. CHEMICAL AUDIT BLOCK APIs (Phiếu Kiểm kê)

### 10.1 Get Audit List

- **Endpoint**: `GET /v2/chemicalauditblocks/get/list`

### 10.2 Get Audit Full

- **Endpoint**: `GET /v2/chemicalauditblocks/get/full?chemicalAuditBlockId={id}`
- **Response**: Trả về thông tin Header kèm mảng `details` (danh sách các chai trong phạm vi kiểm kê).

---

## 11. CHEMICAL AUDIT DETAIL APIs (Dòng thực tế kiểm đếm)

### 11.1 Get Audit Details

- **Endpoint**: `GET /v2/chemicalauditdetails/get/list`

### 11.2 Update Audit Detail (Ghi nhận số lượng thực tế)

- **Endpoint**: `POST /v2/chemicalauditdetails/update`
- **Payload Example**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "chemicalAuditDetailId": "ADD_...",
        "actualAvailableQty": 450,
        "actualChemicalInventoryStatus": "InUse",
        "isScanned": true,
        "chemicalAuditDetailNote": "Cân thực tế tại kho"
    },
    "pagination": null,
    "error": null
}
```
