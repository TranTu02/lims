# TÀI LIỆU QUY CHUẨN API BACKEND (CORE API RULES)

---

## I. NGUYÊN TẮC CỐT LÕI

1. **HTTP Methods:** Chỉ sử dụng **GET** (Lấy dữ liệu) và **POST** (Thay đổi dữ liệu: Tạo/Sửa/Xóa).

2. **Naming Convention:**
    - **URL Resource:** kebab-case (gạch nối), số nhiều. (VD: sample-types).
    - **Database/Code:** camelCase, số nhiều. (VD: sampleTypes).

---

## II. CẤU TRÚC URL

Cấu trúc định tuyến:

code Code

downloadcontent_copy

expand_less
/v2 / <resource> /: <action> /: <option>

---

## III. MA TRẬN HÀNH ĐỘNG CHI TIẾT

### 1. Hành động: GET (Lấy dữ liệu)

**Method: GET**

Phân chia rõ ràng giữa việc lấy dữ liệu phẳng (flat) và dữ liệu lồng nhau (nested).

| URL Pattern              | Query Params                 | Output Format               | Mô tả                                                                                    |
| ------------------------ | ---------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| /v2/:resource/get/list   | Standard Params (Xem mục IV) | Array [] + Meta             | Lấy danh sách phân trang (Table View). Chỉ trả về dữ liệu của bảng đó, hạn chế join sâu. |
| /v2/:resource/get/detail | <PK>=...                     | Object {}                   | Lấy chi tiết **một** bản ghi đơn lẻ (Flat Data). Dùng cho Form Edit đơn giản.            |
| /v2/:resource/get/full   | <PK>=...                     | Nested Object {...children} | Lấy chi tiết bản ghi gốc **kèm theo** toàn bộ các object liên quan qua khóa ngoại (FK).  |

**Ví dụ phân biệt detail vs full (Resource: receipts):**

- **GET** /v2/receipts/get/detail?receiptId=REC-01:
  code JSON
  downloadcontent_copy
  expand_less

        {
          "success": true,
          "statusCode": 200,
          "data": { "receiptId": "REC-01", "senderName": "Nguyen Van A", "createdAt": "..." },
          "pagination": null,
          "error": null
        }

- **GET** /v2/receipts/get/full?receiptId=REC-01:
  code JSON
  downloadcontent_copy
  expand_less

        {
          "success": true,
          "statusCode": 200,
          "data": {
            "receiptId": "REC-01",
            "senderName": "Nguyen Van A",
            "samples": [  // Join bảng samples
              {
                "sampleId": "SAM-01",
                "sampleType": "Mau Mau",
                "analyses": [ // Join bảng analyses
                   { "testCode": "GLU", "result": 5.5 }
                ]
              }
            ]
          },
          "pagination": null,
          "error": null
        }

---

### 2. Hành động: CREATE / UPDATE / DELETE

**Method: POST**

| URL Pattern               | Body Payload                   | Mô tả                                 |
| ------------------------- | ------------------------------ | ------------------------------------- |
| /v2/:resource/create      | { ...data }                    | Tạo đơn lẻ.                           |
| /v2/:resource/create/bulk | [ {...}, {...} ]               | Tạo hàng loạt.                        |
| /v2/:resource/create/full | { ...parent, children: [...] } | Tạo transactional (Cha + Con + Cháu). |
| /v2/:resource/update      | { <PK>, ...changes }           | Cập nhật (bao gồm cả duyệt/hủy/sửa).  |
| /v2/:resource/delete      | { <PK> }                       | Xóa mềm (Soft delete).                |

---

## IV. CÁC THAM SỐ QUERY TIÊU CHUẨN (STANDARD QUERY PARAMS)

Áp dụng bắt buộc cho API /v2/:resource/get/list. Backend phải parse các tham số này để xử lý query DB.

| Tham số (Key) | Kiểu (Type) | Mặc định | Mô tả                                                                                  |
| ------------- | ----------- | -------- | -------------------------------------------------------------------------------------- |
| page          | number      | 1        | Trang hiện tại cần lấy (Bắt đầu từ 1).                                                 |
| itemsPerPage  | number      | 10       | Số lượng bản ghi trên một trang.                                                       |
| sortColumn    | string      | null     | Tên cột cần sắp xếp (VD: createdAt, sampleCode). Nếu null -> dùng default sort của DB. |
| sortDirection | string      | DESC     | Hướng sắp xếp: ASC (Tăng dần) hoặc DESC (Giảm dần).                                    |
| search        | string      | null     | Từ khóa tìm kiếm chung (Backend tự quyết định map vào cột nào, thường là name/code).   |
| `<column>[]`  | array       | []       | Lọc theo danh sách giá trị mảng. VD: `technicianId[]=TECH-002&technicianGroupId[]=GRP` |

**Ví dụ Request:**  
GET `/v2/samples/get/list?page=1&itemsPerPage=20&sortColumn=receivedAt&sortDirection=DESC&search=Nguyen&sampleStatus[]=Received&sampleStatus[]=InLab`

---

## V. CẤU TRÚC RESPONSE (CHUẨN HÓA)

code JSON

downloadcontent_copy

expand_less
{
"success": true,
"statusCode": 200,
"data": { ... }, // Object (detail/full) hoặc Array (list)
"pagination": { // Phải có khi gọi /get/list, các trường hợp khác là null
"page": 1,
"itemsPerPage": 20,
"total": 150, // Tổng số bản ghi tìm thấy
"totalPages": 8
},
"error": null // Khi success = true
}

---

## VI. CHECKLIST CHO BACKEND DEV

1. **Mapping Resource:** Đảm bảo kebab-case trên URL map đúng vào Model trong code.

2. **Full Fetching:** Với API /get/full, cần tối ưu query (sử dụng Eager Loading hoặc Join thông minh) để tránh lỗi N+1 query.

3. **Pagination:** Luôn luôn áp dụng phân trang cho /get/list. Không bao giờ trả về Select All nếu không có limit, trừ khi là bảng danh mục nhỏ (Status/Category).

4. **Filter Security:** Các tham số sortColumn phải được kiểm tra (whitelist) để tránh SQL Injection (không cho phép user sort theo cột không tồn tại).

    ***

    # GLOBAL API DOCUMENTATION - LIMS PLATFORM V2.3

    **Version:** 2.3  
    **Base URL:** <domain>/v2  
    **Date:** 22/01/2026  
    **Formats:** JSON  
    **Auth:** Bearer Token (JWT)

    ***

    ## MỤC LỤC
    1. **Quy tắc chung & Common Objects**
    2. **Lab Operations** (Receipts, Samples, Analyses)
    3. **CRM Module** (Clients, Orders, Quotes)
    4. **Library Configuration** (Matrices, Parameters, Protocols, SampleTypes, ParameterGroups)
    5. **Assets & Inventory** (Equipment, Inventory Items)
    6. **Documents & Identity** (Files, Users)

    ***
    1. QUY TẮC CHUNG & COMMON OBJECTS

    ***

    ### Query Params Tiêu Chuẩn (Cho /get/list)

    | Param         | Type   | Default   | Description      |
    | ------------- | ------ | --------- | ---------------- |
    | page          | number | 1         | Trang hiện tại   |
    | itemsPerPage  | number | 10        | Số dòng/trang    |
    | sortColumn    | string | createdAt | Tên cột sort     |
    | sortDirection | string | DESC      | ASC / DESC       |
    | search        | string | null      | Từ khóa tìm kiếm |

    ### Common Response Objects (Identity Expansion)

    Mọi trường ...Id tham chiếu đến User (VD: createdById, technicianId) trong DB sẽ được API trả về dạng Object mở rộng:

    code JSON

    downloadcontent_copy

    expand_less
    // Database: "createdById": "US-001"
    // API Response:
    "createdBy": {
    "identityId": "US-001",
    "identityName": "Nguyễn Văn A",
    "alias": "Quản lý mẫu"
    }

    ***
    2. LAB OPERATIONS (schema: lab)

    ***

    ### 2.1. Receipts (Phiếu tiếp nhận)

    Tuân thủ mẫu Template đã cung cấp.
    - **List:** GET /v2/receipts/get/list
    - **Detail:** GET /v2/receipts/get/detail?receiptId=...
    - **Full Nested:** GET /v2/receipts/get/full?receiptId=... (Trả về Receipt -> Samples -> Analyses)
    - **Create:** POST /v2/receipts/create (Tạo phiếu header)
    - **Create Full:** POST /v2/receipts/create/full (Tạo Phiếu + Mẫu + Chỉ tiêu 1 lần)
    - **Update:** POST /v2/receipts/update
    - **Delete:** POST /v2/receipts/delete

    ### 2.2. Samples (Mẫu thử nghiệm)

    Quản lý vật thể mẫu vật lý.

    **URL Resource:** samples

    #### GET Methods
    - **List:** /v2/samples/get/list
        - Filter: ?receiptId=REC-01, ?status=Analyzing

    - **Full:** /v2/samples/get/full?sampleId=SAM-001
        - Return: Sample Object + analyses (Array).

    **Response Example (Full):**

    code JSON

    downloadcontent_copy

    expand_less
    {
    "sampleId": "SAM-001",
    "sampleCode": "NT2601-01",
    "sampleStatus": "Analyzing",
    "physicalState": "Liquid",
    "sampleClientInfo": "Mẫu nước thải đầu vào",
    "sampleInfo": [{ "label": "Màu", "value": "Đen" }],
    "receiptId": "REC-001",
    "analyses": [
    {
    "analysisId": "ANA-01",
    "parameterName": "pH",
    "analysisResult": "7.2",
    "analysisStatus": "Done"
    }
    ],
    "createdAt": "..."
    }

    #### POST Methods
    - **Create:** /v2/samples/create
        - Input: { "receiptId": "REC-01", "sampleTypeId": "ST-01", "sampleName": "...", "sampleVolume": "1L" }

    - **Update:** /v2/samples/update
        - Input: { "sampleId": "SAM-001", "sampleStatus": "Stored", "sampleStorageLoc": "Kho Lạnh 1" }

    ### 2.3. Analyses (Chỉ tiêu / Phép thử)

    Quản lý kết quả phân tích cụ thể.

    **URL Resource:** analyses

    #### GET Methods
    - **List:** /v2/analyses/get/list
        - Use Case: Danh sách công việc cho kỹ thuật viên (?technicianId=US-01&status=Testing).

    #### POST Methods
    - **Update Result (Nhập kết quả):** /v2/analyses/update
        - Dùng endpoint update chuẩn để nhập kết quả.

    code JSON

    downloadcontent_copy

    expand_less
    {
    "analysisId": "ANA-001",
    "analysisResult": "0.54",
    "analysisResultStatus": "Pass",
    "analysisStatus": "Review", // Chuyển trạng thái chờ duyệt
    "analysisCompletedAt": "2026-01-22T10:00:00Z",
    "technicianId": "US-09"
    }
    - **Assign Technician (Phân công):** /v2/analyses/update
        - Payload: { "analysisId": "...", "technicianId": "US-09", "technicianIds": ["US-09", "US-10"] }

    ***
    3. CRM MODULE (schema: crm)

    ***

    ### 3.1. Clients (Khách hàng)

    **URL Resource:** clients

    #### GET Methods
    - **List:** /v2/clients/get/list
    - **Detail:** /v2/clients/get/detail?clientId=CLI-001

    **Response Example:**

    code JSON

    downloadcontent_copy

    expand_less
    {
    "clientId": "CLI-001",
    "clientName": "Công ty Môi Trường Xanh",
    "legalId": "0102030405",
    "invoiceInfo": {
    "taxName": "Công ty MTX",
    "taxCode": "0102030405",
    "taxAddress": "..."
    },
    "clientContacts": [
    { "contactName": "Mr. An", "contactPhone": "0909..." }
    ],
    "totalOrderAmount": 150000000
    }

    #### POST Methods
    - **Create:** /v2/clients/create
    - **Update:** /v2/clients/update

    ### 3.2. Orders (Đơn hàng)

    **URL Resource:** orders
    - **Get Full:** /v2/orders/get/full?orderId=ORD-001
        - Trả về: Order -> Samples (Snapshot cấu trúc OrderSample) -> Analyses (Snapshot giá).

    - **Create Full (Tạo đơn hàng):** /v2/orders/create/full

    **Payload Create Full:**

    code JSON

    downloadcontent_copy

    expand_less
    {
    "clientId": "CLI-001",
    "salePersonId": "SALE-05",
    "client": { ... }, // Snapshot info
    "samples": [
    {
    "sampleName": "Nước thải",
    "sampleTypeId": "ST-01",
    "analyses": [
    {
    "matrixId": "MAT-PH",
    "feeBeforeTax": 50000,
    "taxRate": 10,
    "feeAfterTax": 55000
    }
    ]
    }
    ],
    "totalAmount": 55000
    }

    ### 3.3. Quotes (Báo giá)

    Cấu trúc tương tự **Orders**.
    - **URL:** /v2/quotes
    - **Action:** create/full để tạo báo giá kèm danh sách chỉ tiêu.
    - **Update:** update trạng thái (quoteStatus: Sent -> Approved).

    ***
    4. LIBRARY CONFIGURATION (schema: library)

    ***

    Nhóm này chứa các bảng danh mục (Lookup tables). Tất cả đều hỗ trợ get/list (cho dropdown), create, update, delete.

    ### 4.1. Matrices (Ma trận giá & Phương pháp)

    Đây là bảng quan trọng nhất để config giá.

    **URL Resource:** matrices

    **Create/Update Payload:**

    code JSON

    downloadcontent_copy

    expand_less
    {
    "matrixId": "MAT-NEW-01", // Hoặc để trống nếu auto-gen
    "sampleTypeId": "ST-01",
    "parameterName": "Hàm lượng Chì (Pb)",
    "protocolCode": "SMEWW 3125 B:2017",
    "feeBeforeTax": 300000,
    "taxRate": 8,
    "feeAfterTax": 324000,
    "LOD": "0.001 mg/L",
    "thresholdLimit": "QCVN 01-1:2018/BYT"
    }

    ### 4.2. Parameters (Danh mục chỉ tiêu)

    **URL:** /v2/parameters
    - GET /get/list: Lấy danh sách tên chỉ tiêu để mapping.

    ### 4.3. Protocols (Danh mục phương pháp)

    **URL:** /v2/protocols
    - GET /get/list: Danh sách SOP/TCVN.

    ### 4.4. Sample Types (Loại mẫu)

    **URL:** /v2/sample-types
    - GET /get/list: Dropdown loại mẫu (Nước thải, Thực phẩm...).

    ### 4.5. Parameter Groups (Gói chỉ tiêu)

    **URL:** /v2/parameter-groups
    - **Create Full:** Tạo gói combo (Gồm header và danh sách matrixIds).

    code JSON

    downloadcontent_copy

    expand_less
    {
    "groupName": "Gói kiểm nghiệm nước ăn uống 109",
    "sampleTypeId": "ST-NUOC-SINH-HOAT",
    "matrixIds": ["MAT-01", "MAT-02", "MAT-05"],
    "feeAfterTax": 1500000
    }

    ***
    5. ASSETS & INVENTORY (schema: lab)

    ***

    ### 5.1. Equipment (Thiết bị)

    **URL Resource:** equipment (Số ít theo tiếng Anh, nhưng API resource nên để số nhiều nếu theo rule -> equipments hoặc giữ nguyên equipment nếu coi là danh từ không đếm được. Chọn equipment theo tên bảng DB).
    - **Get List:** /v2/equipment/get/list
    - **Update Log:** /v2/equipment/update -> Cập nhật equipmentLog JSONB khi bảo trì.

    ### 5.2. Inventory Items (Kho)

    **URL Resource:** inventory-items
    - **Get List:** /v2/inventory-items/get/list
    - **Create:** /v2/inventory-items/create
    - **Update Stock:** /v2/inventory-items/update
        - Payload: { "itemId": "CHEM-01", "itemStockQty": 950 }

    ***
    6. DOCUMENTS & IDENTITY

    ***

    ### 6.1. Files (Quản lý File vật lý)

    **URL Resource:** files
    - **Upload:** (Thường dùng Multipart form, nhưng metadata quản lý qua API này).
    - **Get Detail:** /v2/files/get/detail?fileId=... -> Lấy presigned URL trong trường uris.

    ### 6.2. Identities (Users) (schema: identity)

    **URL Resource:** identities
    - **List:** /v2/identities/get/list
        - Use case: Lấy danh sách kỹ thuật viên (role->technician: true) để assign task.

    - **Create:** /v2/identities/create
        - Tạo user mới kèm roles và permissions JSONB.

    ***

    ## TỔNG HỢP MÃ LỖI (ERROR CODES)

    Response chuẩn khi có lỗi:

    code JSON

    downloadcontent_copy

    expand_less
    {
    "success": false,
    "statusCode": 400,
    "data": null,
    "pagination": null,
    "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Không tìm thấy bản ghi với ID REC-999",
    "details": null
    }
    }
    - 400: Bad Request (Validation failed).
    - 401: Unauthorized (Token invalid).
    - 403: Forbidden (Không có quyền truy cập resource).
    - 404: Not Found.
    - 500: Internal Server Error.
