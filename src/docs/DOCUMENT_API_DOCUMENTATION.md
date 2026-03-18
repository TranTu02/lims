# DOCUMENT & FILE MODULE — API DOCUMENTATION

Tài liệu API cho module quản lý tài liệu (Document) và file vật lý (File) trên hệ thống LIMS-IRDOP.

**Base URL:** `/v2`  
**Auth:** `Authorization: Bearer {token}`  
**Schemas:** `document.copy` (Document), `document.files` (File)

---

## 1. Authentication

Tất cả API endpoint yêu cầu JWT token trong header `Authorization`.

```http
Authorization: Bearer SS_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Login Response:**

```json
{
    "token": "SS_f58e9d0a-a74f-4a7c-a64a-8b7979c54e27",
    "identity": "Nguyễn Mai Quỳnh",
    "roles": ["ROLE_SUPER_ADMIN", "ROLE_DOC_CONTROLLER", "..."]
}
```

---

## 2. FILE APIs (`document.files`)

Quản lý file vật lý trên S3/MinIO. File entity không chứa thông tin nghiệp vụ, chỉ lưu trữ binary + metadata kỹ thuật.

### 2.1. Get File List

**Endpoint:** `GET /v2/files/get/list`

**Query Parameters:**

| Param           | Type   | Default   | Mô tả            |
| :-------------- | :----- | :-------- | :--------------- |
| `page`          | number | 1         | Trang hiện tại   |
| `itemsPerPage`  | number | 10        | Số dòng/trang    |
| `sortColumn`    | string | createdAt | Cột sắp xếp      |
| `sortDirection` | string | DESC      | ASC / DESC       |
| `search`        | string | null      | Từ khóa tìm kiếm |

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "fileId": "file_4770027e65514f6c",
            "fileName": "1C26TYY_00001123.pdf",
            "mimeType": "application/pdf",
            "fileSize": 480676,
            "uris": [
                "s3://irdop/file_4770027e65514f6c_1C26TYY_00001123.pdf"
            ],
            "fileStatus": "Synced",
            "commonKeys": [
                "D26dTKHZ9P613",
                "DH26C0836"
            ],
            "fileTags": [
                "Hóa đơn",
                "HOA_DON"
            ],
            "opaiFile": null,
            "createdById": "IDxab960",
            "createdAt": "2026-02-14T02:17:57.652Z",
            "deletedAt": null
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 33275,
        "totalPages": 33275
    },
    "error": null
}
```

### 2.2. Get File Detail

**Endpoint:** `GET /v2/files/get/detail?id={fileId}`

**Query Parameters:**

| Param              | Type   | Required | Mô tả       |
| :----------------- | :----- | :------- | :---------- |
| `id` hoặc `fileId` | string | ✅       | ID của file |

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "fileId": "file_4770027e65514f6c",
        "fileName": "1C26TYY_00001123.pdf",
        "mimeType": "application/pdf",
        "fileSize": 480676,
        "uris": [
            "s3://irdop/file_4770027e65514f6c_1C26TYY_00001123.pdf"
        ],
        "fileStatus": "Synced",
        "commonKeys": [
            "D26dTKHZ9P613",
            "DH26C0836"
        ],
        "fileTags": [
            "Hóa đơn",
            "HOA_DON"
        ],
        "createdById": "IDxab960",
        "createdAt": "2026-02-14T02:17:57.652Z"
    },
    "pagination": null,
    "error": null
}
```

### 2.3. Get File Presigned URL (S3 Download Link)

**Endpoint:** `GET /v2/files/get/url?id={fileId}`

Sinh URL có chữ ký để download trực tiếp từ S3. URL có thời hạn (mặc định 1 giờ).

**Query Parameters:**

| Param              | Type   | Required | Mô tả                              |
| :----------------- | :----- | :------- | :--------------------------------- |
| `id` hoặc `fileId` | string | ✅       | ID của file                        |
| `expiresIn`        | number | ❌       | Thời hạn URL (giây), mặc định 3600 |

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "url": "https://s3.irdop.org/irdop/file_4770027e65514f6c_1C26TYY_00001123.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Signature=...",
        "expiresIn": 3600,
        "fileId": "file_x4770027e65514f6c"
    },
    "pagination": null,
    "error": null
}
```

> **Lưu ý:** Frontend nên dùng `window.open(url)` hoặc `<a href={url}>` để download trực tiếp từ S3.

### 2.4. Upload File

**Endpoint:** `POST /v2/files/upload`

Upload file binary lên S3 và tạo bản ghi `document.files`.

**Content-Type:** `multipart/form-data`

| Field        | Type        | Required | Mô tả                                   |
| :----------- | :---------- | :------- | :-------------------------------------- |
| `file`       | Binary      | ✅       | File cần upload                         |
| `commonKeys` | JSON String | ❌       | Array các keys (ví dụ: '["ORDER_001"]') |
| `fileTags`   | JSON String | ❌       | Array các tag phân loại                 |

**Hoặc JSON body (base64):**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "buffer": "<base64-encoded-file-content>",
        "fileName": "report.pdf",
        "mimeType": "application/pdf",
        "commonKeys": [
            "ORDER_001"
        ],
        "fileTags": [
            "Report"
        ]
    },
    "pagination": null,
    "error": null
}
```

**Response:** Trả về File record mới.

### 2.5. Delete File

**Endpoint:** `POST /v2/files/delete`

Xóa file từ S3 và soft-delete bản ghi trong DB.

**Body:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "fileId": "file_4770027e65514f6c"
    },
    "pagination": null,
    "error": null
}
```

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "id": "file_4770027e65514f6c",
        "status": "Deleted",
        "details": {
            "status": "deleted_from_s3_only"
        }
    },
    "pagination": null,
    "error": null
}
```

---

## 3. DOCUMENT APIs (`document.documents`)

Quản lý tài liệu nghiệp vụ. Mỗi Document liên kết với một File thông qua `fileId`.

### 3.1. Get Document List

**Endpoint:** `GET /v2/documents/get/list`

**Query Parameters:**

| Param           | Type   | Default   | Mô tả                                  |
| :-------------- | :----- | :-------- | :------------------------------------- |
| `page`          | number | 1         | Trang hiện tại                         |
| `itemsPerPage`  | number | 10        | Số dòng/trang                          |
| `sortColumn`    | string | createdAt | Cột sắp xếp                            |
| `sortDirection` | string | DESC      | ASC / DESC                             |
| `search`        | string | null      | Từ khóa tìm kiếm                       |
| `refType`       | string | null      | Lọc theo loại tham chiếu (VD: `Order`) |
| `refId`         | string | null      | Lọc theo ID tham chiếu                 |

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "documentId": "D26dTKHZ9P613",
            "createdAt": "2026-02-14T02:17:57.657Z",
            "modifiedAt": "2026-02-14T02:17:57.657Z",
            "createdById": "IDxab960",
            "fileId": "file_4770027e65514f6c",
            "refId": "DH26C0836",
            "refType": "Order",
            "jsonContent": {
                "documentDate": "2026-02-14",
                "documentTitle": "HÓA ĐƠN GIÁ TRỊ GIA TĂNG",
                "invoiceTotalPayable": "1097250",
                "invoiceTotalBeforeTax": "1045000",
                "items": [
                    {
                        "taxRate": "0.05",
                        "quantity": "1",
                        "taxAmount": "52250",
                        "unitPrice": "1045000",
                        "totalPrice": "1045000",
                        "description": "Kiểm nghiệm mẫu DH26C0836",
                        "unitMeasure": "Gói"
                    }
                ],
                "orderIds": [
                    "DH26C0836"
                ],
                "buyerInfo": {
                    "name": "CÔNG TY CỔ PHẦN DƯỢC PHẨM TRUNG ƯƠNG VIHECO",
                    "address": "Khu công nghiệp Quang Minh mở rộng...",
                    "taxCode": "0107606668"
                },
                "sellerInfo": {
                    "name": "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN",
                    "address": "176 Phùng Khoang...",
                    "taxCode": "0107149919"
                }
            },
            "deletedAt": null
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 24846,
        "totalPages": 24846
    },
    "error": null
}
```

**Ví dụ Filter:**

- Lọc theo loại tham chiếu: `GET /v2/documents/get/list?refType=Order`
- Lọc theo ID tham chiếu: `GET /v2/documents/get/list?refId=DH26C0836`

### 3.2. Get Document Detail

**Endpoint:** `GET /v2/documents/get/detail?id={documentId}`

Lấy thông tin chi tiết **một** bản ghi Document (flat data, không kèm File).

**Query Parameters:**

| Param                  | Type   | Required | Mô tả           |
| :--------------------- | :----- | :------- | :-------------- |
| `id` hoặc `documentId` | string | ✅       | ID của Document |

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "documentId": "D26dTKHZ9P613",
        "createdAt": "2026-02-14T02:17:57.657Z",
        "modifiedAt": "2026-02-14T02:17:57.657Z",
        "createdById": "IDxab960",
        "fileId": "file_4770027e65514f6c",
        "refId": "DH26C0836",
        "refType": "Order",
        "jsonContent": {
            "documentDate": "2026-02-14",
            "documentTitle": "HÓA ĐƠN GIÁ TRỊ GIA TĂNG",
            "invoiceTotalPayable": "1097250",
            "invoiceTotalBeforeTax": "1045000"
        }
    },
    "pagination": null,
    "error": null
}
```

### 3.3. Get Document Full (Nested — with File)

**Endpoint:** `GET /v2/documents/get/full?id={documentId}`

Lấy chi tiết Document **kèm theo** object File liên kết (nested). Dùng khi cần hiển thị cả metadata kỹ thuật (bucket, kích thước, URI...).

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "documentId": "D26dTKHZ9P613",
        "createdAt": "2026-02-14T02:17:57.657Z",
        "modifiedAt": "2026-02-14T02:17:57.657Z",
        "createdById": "IDxab960",
        "fileId": "file_4770027e65514f6c",
        "refId": "DH26C0836",
        "refType": "Order",
        "jsonContent": {
            "documentDate": "2026-02-14",
            "documentTitle": "HÓA ĐƠN GIÁ TRỊ GIA TĂNG"
        },
        "file": {
            "fileId": "file_4770027e65514f6c",
            "fileName": "1C26TYY_00001123.pdf",
            "mimeType": "application/pdf",
            "fileSize": 480676,
            "uris": [
                "s3://irdop/file_4770027e65514f6c_1C26TYY_00001123.pdf"
            ],
            "fileStatus": "Synced",
            "commonKeys": [
                "D26dTKHZ9P613",
                "DH26C0836"
            ],
            "fileTags": [
                "Hóa đơn",
                "HOA_DON"
            ],
            "createdById": "IDxab960",
            "createdAt": "2026-02-14T02:17:57.652Z"
        }
    },
    "pagination": null,
    "error": null
}
```

### 3.4. Get Document Download URL

**Endpoint:** `GET /v2/documents/get/url?id={documentId}`

Lấy S3 presigned download URL thông qua Document → File chain.

**Query Parameters:**

| Param                  | Type   | Required | Mô tả                              |
| :--------------------- | :----- | :------- | :--------------------------------- |
| `id` hoặc `documentId` | string | ✅       | ID của Document                    |
| `expiresIn`            | number | ❌       | Thời hạn URL (giây), mặc định 3600 |

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "url": "https://s3.irdop.org/irdop/file_4770027e65514f6c_1C26TYY_00001123.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Signature=...",
        "expiresIn": 3600,
        "documentId": "D26dTKHZ9P613",
        "fileId": "file_4770027e65514f6c"
    },
    "pagination": null,
    "error": null
}
```

### 3.5. Create Document (with File Upload)

**Endpoint:** `POST /v2/documents/create`

Tạo Document mới từ file upload (multipart) hoặc từ `fileId` có sẵn.

**Option A — Multipart Upload:**

```http
Content-Type: multipart/form-data

file: <binary>
refType: Order
refId: DH26C0001
jsonContent: {"documentTitle": "Hóa đơn #001"}
```

**Option B — Từ fileId có sẵn:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "fileId": "file_4770027e65514f6c",
        "refType": "Analysis",
        "refId": "SP26d1001-01",
        "jsonContent": {
            "documentTitle": "Biên bản thử nghiệm",
            "documentDate": "2026-02-14"
        }
    },
    "pagination": null,
    "error": null
}
```

**Response:** Trả về Document record mới tạo.

### 3.6. Update Document

**Endpoint:** `POST /v2/documents/update`

Cập nhật nội dung `jsonContent`.

**Body:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "documentId": "D26dTKHZ9P613",
        "jsonContent": {
            "documentTitle": "HÓA ĐƠN GIÁ TRỊ GIA TĂNG (Đã cập nhật)"
        }
    },
    "pagination": null,
    "error": null
}
```

### 3.7. Delete Document

**Endpoint:** `POST /v2/documents/delete`

Soft-delete bản ghi Document (set `deletedAt`).

**Body:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "documentId": "D26dTKHZ9P613"
    },
    "pagination": null,
    "error": null
}
```

**Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "documentId": "D26dTKHZ9P613",
        "status": "Deleted"
    },
    "pagination": null,
    "error": null
}
```

---

## 4. RefType Codes (Loại Tham Chiếu)

Danh sách các `refType` phổ biến:

| Type       | Tham chiếu tới bảng |
| :--------- | :------------------ |
| `Order`    | `crm.orders`        |
| `Analysis` | `lab.analyses`      |
| `Receipt`  | `lab.receipts`      |
| `Client`   | `crm.clients`       |

---

## 5. Error Codes

| Status | Code                  | Mô tả                          |
| :----- | :-------------------- | :----------------------------- |
| 400    | Bad Request           | Missing params, invalid action |
| 401    | Unauthorized          | Token invalid hoặc thiếu       |
| 403    | Forbidden             | Không có quyền truy cập        |
| 404    | Not Found             | Document/File không tìm thấy   |
| 500    | Internal Server Error | Lỗi hệ thống                   |

**Error Response:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "code": 404
    },
    "pagination": null,
    "error": null
}
```

---

## 6. Tổng Hợp Endpoints

### File API (`/v2/files`)

| Method | Endpoint                      | Mô tả                      |
| :----- | :---------------------------- | :------------------------- |
| GET    | `/v2/files/get/list`          | Danh sách files phân trang |
| GET    | `/v2/files/get/detail?id=...` | Chi tiết 1 file            |
| GET    | `/v2/files/get/url?id=...`    | S3 presigned download URL  |
| POST   | `/v2/files/upload`            | Upload file mới lên S3     |
| POST   | `/v2/files/delete`            | Xóa file                   |

### Document API (`/v2/documents`)

| Method | Endpoint                          | Mô tả                             |
| :----- | :-------------------------------- | :-------------------------------- |
| GET    | `/v2/documents/get/list`          | Danh sách documents phân trang    |
| GET    | `/v2/documents/get/detail?id=...` | Chi tiết 1 document (flat)        |
| GET    | `/v2/documents/get/full?id=...`   | Chi tiết document + file (nested) |
| GET    | `/v2/documents/get/url?id=...`    | S3 download URL qua Document      |
| POST   | `/v2/documents/create`            | Tạo document (upload hoặc fileId) |
| POST   | `/v2/documents/update`            | Cập nhật document metadata        |
| POST   | `/v2/documents/delete`            | Xóa mềm document                  |
