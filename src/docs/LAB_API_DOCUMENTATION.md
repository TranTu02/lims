# LAB MODULE - API DOCUMENTATION

This document provides detailed documentation for the LAB module API endpoints, including request methods, paths, query parameters, and **explicit JSON response structures**.

## 1. Authentication

All API endpoints require a valid JWT token in the `Authorization` header.

**Header Format**:

```http
Authorization: Bearer {authToken}
```

**Login Response Example**:

```json
{
    "token": "SS_7fdde030-eba3-44cd-b1c7-b6f24a4e36e2",
    "identity": "Nguyễn Mai Quỳnh",
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

## 2. INCOMING REQUEST APIs (Yêu cầu tiếp nhận)

### 2.1 Get Incoming Request List

**Endpoint**: `GET /v2/incoming-orders/get/list`

**Response Structure**:

```json
{
    "result": [
        {
            "requestId": "REQ26d0504",
            "requestDate": "2026-01-21T08:00:00.000Z",
            "senderInfo": {
                "senderName": "Grab Driver",
                "senderPhone": "0911222333"
            },
            "requestContent": "Yêu cầu kiểm nghiệm mẫu nước thải công nghiệp",
            "documentIds": null,
            "quoteId": "QTE26d0501",
            "clientId": "CLI26020503",
            "client": null,
            "contactPerson": null,
            "reportRecipient": null,
            "salePersonId": null,
            "salePerson": null,
            "saleCommissionPercent": null,
            "samples": null,
            "totalAmount": "3000000",
            "totalFeeBeforeTax": "0",
            "totalFeeBeforeTaxAndDiscount": null,
            "totalTaxValue": null,
            "totalDiscountValue": null,
            "taxRate": null,
            "discountRate": null,
            "linkedOrderId": null,
            "status": "New",
            "orderUri": null,
            "requestForm": null,
            "receiptId": null,
            "createdAt": "2026-02-05T10:04:15.361Z",
            "createdById": "USR-NJG35FM",
            "modifiedAt": "2026-02-05T10:04:15.361Z",
            "modifiedById": "USR-NJG35FM",
            "deletedAt": null,
            "orderId": "ORD26d0501",
            "incomingStatus": null,
            "orderStatus": null,
            "paymentStatus": null
        }
    ],
    "pagination": {
        "currentPage": 1,
        "itemsPerPage": 1,
        "totalItems": 1,
        "totalPages": 1
    }
}
```

### 2.2 Get Incoming Request Detail

**Endpoint**: `GET /v2/incoming-orders/get/detail?requestId={requestId}`

**Response Structure**:

```json
{
    "entity": {
        "type": "staff"
    },
    "requestId": "REQ26d0504",
    "requestDate": "2026-01-21T08:00:00.000Z",
    "senderInfo": {
        "senderName": "Grab Driver",
        "senderPhone": "0911222333"
    },
    "requestContent": "Yêu cầu kiểm nghiệm mẫu nước thải công nghiệp",
    "documentIds": null,
    "quoteId": "QTE26d0501",
    "clientId": "CLI26020503",
    "client": null,
    "contactPerson": null,
    "reportRecipient": null,
    "salePersonId": null,
    "salePerson": null,
    "saleCommissionPercent": null,
    "samples": null,
    "totalAmount": "3000000",
    "totalFeeBeforeTax": "0",
    "totalFeeBeforeTaxAndDiscount": null,
    "totalTaxValue": null,
    "totalDiscountValue": null,
    "taxRate": null,
    "discountRate": null,
    "linkedOrderId": null,
    "status": "New",
    "orderUri": null,
    "requestForm": null,
    "receiptId": null,
    "createdAt": "2026-02-05T10:04:15.361Z",
    "createdById": "USR-NJG35FM",
    "modifiedAt": "2026-02-05T10:04:15.361Z",
    "modifiedById": "USR-NJG35FM",
    "deletedAt": null,
    "orderId": "ORD26d0501",
    "incomingStatus": null,
    "orderStatus": null,
    "paymentStatus": null,
    "createdBy": {
        "identityId": "USR-NJG35FM",
        "identityName": "Admin Test",
        "alias": null
    },
    "modifiedBy": {
        "identityId": "USR-NJG35FM",
        "identityName": "Admin Test",
        "alias": null
    }
}
```

### 2.3 Create Incoming Request

**Endpoint**: `POST /v2/incoming-orders/create`

**Request Body Example**:

```json
{
    "requestContent": "Yêu cầu kiểm nghiệm mới",
    "senderInfo": {
        "senderName": "Nguyễn Văn A",
        "senderPhone": "0909123456"
    }
}
```

**Response Structure**: `201 Created` - Returns the newly created IncomingRequest object.

### 2.4 Update Incoming Request

**Endpoint**: `POST /v2/incoming-orders/update`

**Request Body Example**:

```json
{
    "requestId": "REQ26d0504",
    "status": "Processing"
}
```

**Response Structure**: `200 OK` - Returns the updated IncomingRequest object.

### 2.5 Delete Incoming Request

**Endpoint**: `POST /v2/incoming-orders/delete`

**Request Body Example**:

```json
{
    "requestId": "REQ26d0504"
}
```

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "id": "REQ26d0504",
        "status": "Deleted"
    },
    "meta": null,
    "error": null
}
```

---

## 3. RECEIPT APIs (Phiếu nhận mẫu)

### 3.1 Get Receipt List

**Endpoint**: `GET /v2/receipts/get/list`

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `itemsPerPage` (number): Items per page (default: 20)
- `search` (string): Optional search text
- `sortColumn` (string): Column to sort by (default: "createdAt")
- `sortDirection` (string): Sort direction "ASC" or "DESC" (default: "DESC")
- `option` (string): "pkey" | "detail" (default) | "full"

**Response Structure**:

```json
{
    "data": [
        {
            "receiptId": "REC26d2403",
            "receiptCode": "...",
            "receiptStatus": "Received",
            "receiptDate": "2026-02-24T00:00:00.000Z",
            "clientId": "CLI26020502",
            "createdAt": "2026-02-24T01:48:05.485Z",
            "createdBy": {
                "identityId": "USR-MGR-011",
                "identityName": "Lý Văn Minh",
                "alias": "IT_LEAD"
            }
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "totalItems": 3655,
        "totalPages": 3655
    }
}
```

### 3.2 Get Receipt Detail

**Endpoint**: `GET /v2/receipts/get/detail?receiptId={receiptId}`

**Response Structure**:

```json
{
    "receiptId": "TNM26d1328",
    "receiptCode": "...",
    "receiptStatus": "Pending",
    "receiptDate": "2026-02-13T08:30:09.916Z",
    "receiptDeadline": "2026-03-09T07:00:00.000Z",
    "orderId": "DH26D0333",
    "clientId": "CLI26020502",
    "client": { ... },
    "contactPerson": { ... },
    "createdAt": "2026-02-13T08:30:09.926Z",
    "createdBy": {
        "identityId": "IDx873e4",
        "identityName": "Duy Thị Kim Huyền",
        "alias": null
    }
}
```

### 3.3 Get Full Receipt (Including Samples & Analyses)

**Endpoint**: `GET /v2/receipts/get/full?receiptId={receiptId}`

**Response Structure**:

```json
{
    "receiptId": "REC26c0601",
    "samples": [ ... ]
}
```

### 3.4 Get Processing Receipts (Worklist)

**Endpoint**: `GET /v2/receipts/get/processing`

**Purpose**: Returns a list of receipts that are currently being processed (Pending, InProgress, Completed) within a specific timeframe (default: 60 days).

**Query Parameters**:

- `page`, `itemsPerPage`, `search`, `sortColumn`, `sortDirection`
- `days` (number): Number of days to look back (default: 60)

**Response Structure**: Similar to `Get Receipt List` but with full nested data for each receipt.

### 3.5 Create Receipt (Standard)

**Endpoint**: `POST /v2/receipts/create`

**Request Body Example**:

```json
{
    "clientId": "CLI26020502",
    "receiptStatus": "Received",
    "receiptDeadline": "2026-03-09T07:00:00.000Z"
}
```

**Response Structure**: `200 OK` - Returns the newly created Receipt object (standard detail).

### 3.6 Create Full Receipt (Atomic)

**Endpoint**: `POST /v2/receipts/create/full`

**Description**: Creates a Receipt along with its Samples and Analyses in a single transaction.

**Request Body Example**:

```json
{
    "clientId": "CLI26020502",
    "receiptStatus": "Received",
    "samples": [
        {
            "sampleTypeId": "ST0032",
            "sampleName": "Mẫu Nước Sinh Hoạt",
            "analyses": [
                {
                    "matrixId": "MX001",
                    "parameterName": "pH"
                }
            ]
        }
    ]
}
```

**Response Structure**: `200 OK` - Returns the complete Receipt object with nested `samples` and `analyses`.

### 3.7 Update Receipt

**Endpoint**: `POST /v2/receipts/update`

**Request Body Example**:

```json
{
    "receiptId": "TNM26d1328",
    "receiptStatus": "Processing"
}
```

**Response Structure**: `200 OK` - Returns the updated Receipt object.

### 3.8 Delete Receipt

**Endpoint**: `POST /v2/receipts/delete`

**Request Body Example**:

```json
{
    "receiptId": "TNM26d1328"
}
```

**Response Structure**:

```json
{
    "success": true,
    "id": "TNM26d1328",
    "status": "Deleted",
    "details": { ... }
}
```

---

## 4. SAMPLE APIs (Mẫu kiểm nghiệm)

### 4.1 Get Sample List

**Endpoint**: `GET /v2/samples/get/list`

**Response Structure**:

```json
{
    "data": [
        {
            "entity": {
                "type": "staff"
            },
            "sampleId": "SAM26d1309",
            "receiptId": "REC26d1309",
            "sampleTypeId": "ST0032",
            "sampleStatus": "Analyzing",
            "sampleStorageLoc": 123,
            "createdAt": "2026-02-13T06:30:04.046Z",
            "createdById": "USR-MGR-011",
            "modifiedAt": "2026-02-13T07:24:48.440Z",
            "modifiedById": "USR-MGR-011",
            "sampleInfo": {
                "items": [
                    {
                        "label": "Color",
                        "value": "Normal"
                    }
                ]
            },
            "sampleReceiptInfo": {
                "items": []
            },
            "createdBy": {
                "identityId": "USR-MGR-011",
                "identityName": "Lý Văn Minh",
                "alias": "IT_LEAD"
            },
            "modifiedBy": {
                "identityId": "USR-MGR-011",
                "identityName": "Lý Văn Minh",
                "alias": "IT_LEAD"
            }
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "totalItems": 59199,
        "totalPages": 59199
    }
}
```

### 3.2 Get Sample Detail

**Endpoint**: `GET /v2/samples/get/{sampleId}`

**Response Structure**:

```json
{
    "entity": {
        "type": "staff"
    },
    "createdById": "IDx873e4",
    "modifiedById": "IDx873e4",
    "sampleInformation": [
        {
            "fname": "Số lô / LOT no.",
            "fvalue": "010126"
        },
        {
            "fname": "Ngày sản xuất / mfg.",
            "fvalue": "280126"
        },
        {
            "fname": "Hạn sử dụng / exp.",
            "fvalue": "280129"
        },
        {
            "fname": "Nơi sản xuất / mfr.",
            "fvalue": "CÔNG TY CỔ PHẦN DƯỢC PHẨM BIKA PHARMA"
        },
        {
            "fname": "Ngày tiếp nhận / receipt date.",
            "fvalue": "13/2/2026"
        },
        {
            "fname": "Ngày thử nghiệm / test date.",
            "fvalue": ""
        },
        {
            "fname": "Mô tả / desc.",
            "fvalue": ""
        }
    ],
    "id": "SP26d1328-01",
    "sampleId": "SP26d1328-01",
    "createdAt": "2026-02-13T08:30:10.163Z",
    "modifiedAt": "2026-02-13T08:30:10.163Z",
    "receiptId": "TNM26d1328",
    "status": 0,
    "sampleName": "Thực phẩm bảo vệ sức khỏe Viên uống Đại tràng Hanaki",
    "matrix": "Thực phẩm bảo vệ sức khỏe",
    "purpose": "Chất lượng",
    "createdBy": {
        "identityId": "IDx873e4",
        "identityName": "Duy Thị Kim Huyền",
        "alias": null
    },
    "modifiedBy": {
        "identityId": "IDx873e4",
        "identityName": "Duy Thị Kim Huyền",
        "alias": null
    }
}
```

### 3.3 Get Processing Samples (Worklist)

**Endpoint**: `GET /v2/samples/get/processing`

**Purpose**: Used for technician worklists.

**Response Structure**:

```json
{
  "data": [
    {
      "id": "SP26c1215-01",
      "sampleId": "SP26c1215-01",
      "createdAt": "2026-01-12T04:09:05.044Z",
      "createdById": "IDx873e4",
      "modifiedAt": "2026-01-22T16:24:53.782Z",
      "modifiedById": "IDxab960",
      "receiptId": "TNM26c1215",
      "clientId": null,
      "sampleInformation": [
        {
          "fname": "Tên mẫu",
          "fvalue": "BỘT TALC"
        },
        {
          "fname": "Số lô",
          "fvalue": "201025"
        },
        {
          "fname": "Ngày sản xuất / mfg.",
          "fvalue": "20/10/25"
        },
        {
          "fname": "Hạn sử dụng / exp.",
          "fvalue": "03 năm"
        },
        {
          "fname": "Ngày tiếp nhận / receipt date.",
          "fvalue": "12/1/2026"
        },
        {
          "fname": "Ngày thử nghiệm / test date.",
          "fvalue": ""
        },
        {
          "fname": "Mô tả / desc.",
          "fvalue": "Mẫu dạng bột, đóng trong túi, trên túi dán tên mẫu"
        }
      ],
      "sampleDescription": "Mẫu dạng bột, đóng trong túi, trên túi dán tên mẫu",
      "sampleVolume": "1",
      "additionalRequest": null,
      "status": 2,
      "sampleName": "BỘT TALC",
      "matrix": "Thực phẩm bảo vệ sức khỏe",
      "purpose": "Chất lượng",
      "handoverAt": "2026-01-12T04:35:05.820Z",
      "_deprecated_receiptUid": null,
      "handoverDetail": null,
      "productType": null,
      "deletedAt": null,
      "emailsReceived": null,
      "sampleStatus": "InLab",
      "sampleStorageLoc": null,
      "analyses": [
        {
          "id": "ANL_MKAN8H3NBAZ",
          "createdAt": "2026-01-12T04:09:05.172Z",
          "createdById": "IDx873e4",
          "modifiedAt": "2026-01-21T14:41:56.955Z",
          "modifiedById": "IDxab960",
          "receiptId": "TNM26c1215",
          "sampleId": "SP26c1215-01",
          "protocolId": null,
          "parameterId": "PMb9de97",
          "technicianId": "IDxfab29",
          "deadline": null,
          "parameterName": "Tổng số vi sinh vật hiếu khí",
          "protocolSource": "IRDOP VS",
          "protocolCode": "\tTCVN 4884-1:2015",
          "resultUnit": "CFU/g",
          "resultValue": "KPH (LOD:10)",
          "lodq": null,
          "matrix": "Thực phẩm bảo vệ sức khỏe",
          "_deprecated_productType": null,
          "_deprecated_parameterUid": null,
          "reviewedById": null,
          "submitLastResultAt": "2026-01-19T07:34:59.680Z",
          "submitLastResultById": "IDxfab29",
          "resultReference": null,
          "scientificField": null,
          "exInfo": null,
          "accreditation": null,
          "_deprecated_sampleUid": "SP26c1215-01",
          "_deprecated_receiptUid": "TNM26c1215",
          "docId": null,
          "oldDisplayStyle": null,
          "technicianIds": [
            "IDxfab29"
          ],
          "technicianAlias": "K09",
          "metadata": null,
          "note": null,
          "displayStyle": null,
          "labTestFileId": "file_xfb6fdd6df74ca762",
          "handover": {},
          "deletedAt": null,
          "analysisStatus": "Testing",
          "analysisId": "ANL_MKAN8H3NBAZ",
          "analysisResultStatus": null,
          "analysisResult": null,
          "technician": {
            "identityId": "IDxfab29",
            "email": "chuthuy186@gmail.com",
            "identityName": "Chu Thị Thủy",
            "alias": "K09",
            "roles": {
              "IT": false,
              "bot": false,
              "admin": false,
              "accountant": false,
              "superAdmin": false,
              "technician": true,
              "collaborator": false,
              "dispatchClerk": false,
              "sampleManager": false,
              "administrative": false,
              "qualityControl": false,
              "customerService": false,
              "marketingCommunications": false,
              "documentManagementSpecialist": false
            },
            "permissions": {},
            "password": "...",
            "identityStatus": "active",
            "createdAt": "2026-01-04T18:34:08.654Z",
            "createdById": "system",
            "modifiedAt": "2026-01-04T18:34:08.654Z",
            "modifiedById": "system",
            "deletedAt": null,
            "roles": [
              "ROLE_TECHNICIAN"
            ],
            "identityPhone": null,
            "identityNID": null,
            "identityPolicies": null,
            "email": null
          },
          "technicians": [
            {
              "identityId": "IDxfab29",
              "email": "chuthuy186@gmail.com",
              "identityName": "Chu Thị Thủy",
              "alias": "K09",
              "roles": { ... },
              "permissions": {},
              "password": "...",
              "identityStatus": "active",
              "createdAt": "2026-01-04T18:34:08.654Z",
              "createdById": "system",
              "modifiedAt": "2026-01-04T18:34:08.654Z",
              "modifiedById": "system",
              "deletedAt": null,
              "roles": [
                "ROLE_TECHNICIAN"
              ],
              "identityPhone": null,
              "identityNID": null,
              "identityPolicies": null,
              "email": null
            }
          ]
        }
      ],
      "reports": []
    }
  ],
  "pagination": {
    "page": 1,
    "itemsPerPage": 1,
    "totalItems": 631,
    "totalPages": 631
  }
}
```

### 4.4 Create Sample

**Endpoint**: `POST /v2/samples/create`

**Request Body Example**:

```json
{
    "receiptId": "REC26d1309",
    "sampleName": "Mẫu Nước Sinh Hoạt",
    "sampleTypeId": "ST0032"
}
```

**Response Structure**: `200 OK` - Returns the newly created Sample object.

### 4.5 Update Sample

**Endpoint**: `POST /v2/samples/update`

**Request Body Example**:

```json
{
    "sampleId": "SAM26d1309",
    "sampleStatus": "Analyzing"
}
```

**Response Structure**: `200 OK` - Returns the updated Sample object.

### 4.6 Delete Sample

**Endpoint**: `POST /v2/samples/delete`

**Request Body Example**:

```json
{
    "sampleId": "SAM26d1309"
}
```

**Response Structure**:

```json
{
    "success": true,
    "id": "SAM26d1309",
    "status": "Deleted",
    "details": true
}
```

---

## 5. ANALYSIS APIs (Chỉ tiêu phân tích)

### 5.1 Get Analysis List

**Endpoint**: `GET /v2/analyses/get/list`

**Response Structure**:

```json
{
    "data": [],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "totalItems": 121787,
        "totalPages": 121787
    }
}
```

### 4.2 Get Analysis Detail

**Endpoint**: `GET /v2/analyses/get/{analysisId}`

**Response Structure**:

```json
{
  "id": "ANL_MKAGN3XI5YJ",
  "createdAt": "2026-01-12T01:04:30.630Z",
  "createdById": "IDx873e4",
  "modifiedAt": "2026-01-22T16:24:37.843Z",
  "modifiedById": "IDxab960",
  "receiptId": "TNM26c1202",
  "sampleId": "SP26c1202-01",
  "protocolId": null,
  "parameterId": null,
  "technicianId": "IDx6da25",
  "deadline": null,
  "parameterName": "Canxi (Ca)/Calcium (Ca)",
  "protocolSource": "IRDOP",
  "protocolCode": "HDPP392-KN",
  "resultUnit": "mg/100g",
  "resultValue": "303,03",
  "lodq": null,
  "matrix": "Thực phẩm",
  "_deprecated_productType": null,
  "_deprecated_parameterUid": null,
  "reviewedById": null,
  "submitLastResultAt": "2026-01-22T04:30:04.132Z",
  "submitLastResultById": "IDxfab29",
  "resultReference": null,
  "scientificField": null,
  "exInfo": null,
  "accreditation": null,
  "_deprecated_sampleUid": "SP26c1202-01",
  "_deprecated_receiptUid": "TNM26c1202",
  "docId": null,
  "oldDisplayStyle": null,
  "technicianIds": [
    "IDx6da25"
  ],
  "technicianAlias": "K08",
  "metadata": null,
  "note": null,
  "displayStyle": null,
  "labTestFileId": "file_x8f4bd6731c107d4e",
  "handover": {},
  "deletedAt": null,
  "analysisStatus": "Testing",
  "analysisId": "ANL_MKAGN3XI5YJ",
  "analysisResultStatus": null,
  "analysisResult": null,
  "technician": {
    "identityId": "IDx6da25",
    "email": "chuthanhtrung2408@gmail.com",
    "identityName": "Chu Thành Trung",
    "alias": "K08",
    "roles": {
      "IT": false,
      "bot": false,
      "admin": false,
      "accountant": false,
      "superAdmin": false,
      "technician": true,
      "collaborator": false,
      "dispatchClerk": false,
      "sampleManager": false,
      "administrative": false,
      "qualityControl": false,
      "customerService": false,
      "marketingCommunications": false,
      "documentManagementSpecialist": false
    },
    "permissions": {},
    "password": "...",
    "identityStatus": "active",
    "createdAt": "2026-01-04T18:34:08.654Z",
    "createdById": "system",
    "modifiedAt": "2026-01-04T18:34:08.654Z",
    "modifiedById": "system",
    "deletedAt": null,
    "roles": [
      "ROLE_TECHNICIAN"
    ],
    "identityPhone": null,
    "identityNID": null,
    "identityPolicies": null,
    "email": null
  },
  "technicians": [
    {
      "identityId": "IDx6da25",
      "email": "chuthanhtrung2408@gmail.com",
      "identityName": "Chu Thành Trung",
      "alias": "K08",
      "roles": { ... },
      "permissions": {},
      "password": "...",
      "identityStatus": "active",
      "createdAt": "2026-01-04T18:34:08.654Z",
      "createdById": "system",
      "modifiedAt": "2026-01-04T18:34:08.654Z",
      "modifiedById": "system",
      "deletedAt": null,
      "roles": [
        "ROLE_TECHNICIAN"
      ],
      "identityPhone": null,
      "identityNID": null,
      "identityPolicies": null,
      "email": null
    }
  ]
}
```

### 4.3 Get Processing Tests (Worklist)

**Endpoint**: `GET /v2/analyses/get/processing`

**Purpose**: Get flat list of analyses for technicians.

**Response Structure**:

```json
{
  "data": [
    {
      "id": "ANL_MKAGN3XI5YJ",
      "createdAt": "2026-01-12T01:04:30.630Z",
      "createdById": "IDx873e4",
      "modifiedAt": "2026-01-22T16:24:37.843Z",
      "modifiedById": "IDxab960",
      "receiptId": "TNM26c1202",
      "sampleId": "SP26c1202-01",
      "protocolId": null,
      "parameterId": null,
      "technicianId": "IDx6da25",
      "deadline": null,
      "parameterName": "Canxi (Ca)/Calcium (Ca)",
      "protocolSource": "IRDOP",
      "protocolCode": "HDPP392-KN",
      "resultUnit": "mg/100g",
      "resultValue": "303,03",
      "lodq": null,
      "matrix": "Thực phẩm",
      "_deprecated_productType": null,
      "_deprecated_parameterUid": null,
      "reviewedById": null,
      "submitLastResultAt": "2026-01-22T04:30:04.132Z",
      "submitLastResultById": "IDxfab29",
      "resultReference": null,
      "scientificField": null,
      "exInfo": null,
      "accreditation": null,
      "_deprecated_sampleUid": "SP26c1202-01",
      "_deprecated_receiptUid": "TNM26c1202",
      "docId": null,
      "oldDisplayStyle": null,
      "technicianIds": [
        "IDx6da25"
      ],
      "technicianAlias": "K08",
      "metadata": null,
      "note": null,
      "displayStyle": null,
      "labTestFileId": "file_x8f4bd6731c107d4e",
      "handover": {},
      "deletedAt": null,
      "analysisStatus": "Testing",
      "analysisId": "ANL_MKAGN3XI5YJ",
      "analysisResultStatus": null,
      "analysisResult": null,
      "technician": {
        "identityId": "IDx6da25",
        "email": "chuthanhtrung2408@gmail.com",
        "identityName": "Chu Thành Trung",
        "alias": "K08",
        "roles": {
          "IT": false,
          "bot": false,
          "admin": false,
          "accountant": false,
          "superAdmin": false,
          "technician": true,
          "collaborator": false,
          "dispatchClerk": false,
          "sampleManager": false,
          "administrative": false,
          "qualityControl": false,
          "customerService": false,
          "marketingCommunications": false,
          "documentManagementSpecialist": false
        },
        "permissions": {},
        "password": "...",
        "identityStatus": "active",
        "createdAt": "2026-01-04T18:34:08.654Z",
        "createdById": "system",
        "modifiedAt": "2026-01-04T18:34:08.654Z",
        "modifiedById": "system",
        "deletedAt": null,
        "roles": [
          "ROLE_TECHNICIAN"
        ],
        "identityPhone": null,
        "identityNID": null,
        "identityPolicies": null,
        "email": null
      },
      "technicians": [
        {
          "identityId": "IDx6da25",
          "email": "chuthanhtrung2408@gmail.com",
          "identityName": "Chu Thành Trung",
          "alias": "K08",
          "roles": { ... },
          "permissions": {},
          "password": "...",
          "identityStatus": "active",
          "createdAt": "2026-01-04T18:34:08.654Z",
          "createdById": "system",
          "modifiedAt": "2026-01-04T18:34:08.654Z",
          "modifiedById": "system",
          "deletedAt": null,
          "roles": [
            "ROLE_TECHNICIAN"
          ],
          "identityPhone": null,
          "identityNID": null,
          "identityPolicies": null,
          "email": null
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "itemsPerPage": 1,
    "totalItems": 9397,
    "totalPages": 9397
  }
}
```

### 4.4 Get Filter Options

**Endpoint**: `GET /v2/analyses/get/filteroptions`

**Response Structure**:

```json
[
    {
        "filterValue": "Testing",
        "count": 9397
    },
    {
        "filterValue": null,
        "count": 112390
    }
]
```

### 5.3 Create Analysis

**Endpoint**: `POST /v2/analyses/create`

**Request Body Example**:

```json
{
    "sampleId": "SAM26d1309",
    "parameterId": "PM000357",
    "technicianId": "USR-STF-033"
}
```

**Response Structure**: `200 OK` - Returns the newly created Analysis object.

### 5.4 Update Analysis

**Endpoint**: `POST /v2/analyses/update`

**Request Body Example**:

```json
{
    "analysisId": "ANL_MKAGN3XI5YJ",
    "analysisStatus": "Verified"
}
```

**Response Structure**: `200 OK` - Returns the updated Analysis object.

### 5.5 Update Analysis Result

**Endpoint**: `POST /v2/analyses/update/result`

**Request Body Example**:

```json
{
    "analysisId": "ANL_MKAGN3XI5YJ",
    "resultValue": "303,03",
    "analysisResultStatus": "Pass"
}
```

**Response Structure**: `200 OK` - Returns the updated Analysis object after specific result processing.

### 5.6 Delete Analysis

**Endpoint**: `POST /v2/analyses/delete`

**Request Body Example**:

```json
{
    "analysisId": "ANL_MKAGN3XI5YJ"
}
```

**Response Structure**:

```json
{
    "success": true,
    "id": "ANL_MKAGN3XI5YJ",
    "status": "Deleted",
    "details": true
}
```

---

## 6. REPORT APIs (Báo cáo kết quả)

### 6.1 Get Report List

**Endpoint**: `GET /v2/reports/get/list`

**Response Structure**:

```json
{
    "data": [],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "totalItems": 0,
        "totalPages": 0
    }
}
```

### 6.2 Get Report Detail

**Endpoint**: `GET /v2/reports/get/{reportId}`

**Response Structure**:

```json
{
    "reportId": "RP26d2401",
    "receiptId": "REC26d2403",
    "sampleId": "SAM26d2405",
    "header": "...",
    "content": "...",
    "footer": "...",
    "reportStatus": "Draft",
    "reportRevision": 1,
    "replacedByReportId": null,
    "createdAt": "2026-02-24T02:00:00.000Z",
    "createdById": "USR-MGR-011"
}
```

### 6.3 Create Report

**Endpoint**: `POST /v2/reports/create`

**Request Body Example**:

```json
{
    "receiptId": "REC26d2403"
}
```

**Response Structure**: `201 Created` - Returns the newly created Report object.

### 6.4 Update Report

**Endpoint**: `POST /v2/reports/update`

**Request Body Example**:

```json
{
    "reportId": "RP26d2401",
    "reportStatus": "Approved"
}
```

**Response Structure**: `200 OK` - Returns the updated Report object.

### 6.5 Delete Report

**Endpoint**: `POST /v2/reports/delete`

**Request Body Example**:

```json
{
    "reportId": "RP26d2401"
}
```

**Response Structure**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "id": "RP26d2401",
        "status": "Deleted"
    },
    "meta": null,
    "error": null
}
```

---

## 5. Error Response Structures

**403 Forbidden**:

```json
{
    "error": "Forbidden",
    "message": "Insufficient permission to READ lab.sample",
    "statusCode": 403
}
```

**404 Not Found**:

```json
{
    "error": "Not Found",
    "message": "Entity not found",
    "statusCode": 404
}
```

**Validation Error**:

```json
{
    "error": "Bad Request",
    "message": "Invalid input syntax for type integer: \"abc\"",
    "statusCode": 400
}
```
