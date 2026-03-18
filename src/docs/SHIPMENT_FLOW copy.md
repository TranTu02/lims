# LUỒNG HOẠT ĐỘNG MODULE LOGISTICS (QUẢN LÝ GIAO NHẬN)

Tài liệu này mô tả chi tiết các luồng xử lý dữ liệu và logic nghiệp vụ trong Module Logistics, tập trung vào Quản lý Vận đơn (`Shipment`).

---

## 1. Tổng quan Kiến trúc

### A. Cấu trúc Module

```
BLACK/LOGISTICS/
├── 1_logisticsEntities.js    # Base class LogisticsEntity + Shipment entity
├── 2_ShipmentOrder.js             # Business logic (createOrder, cancel, VTP integration)
├── 3_logistics_api_handler.js # API routes handler
└── TEST_LOGISTICS.js          # Comprehensive test suite
```

### B. Database Schema

**Bảng**: `service.ShipmentOrder`  
**Primary Key**: `shipmentId` (text)

| Field                        | Type      | Description                                  |
| ---------------------------- | --------- | -------------------------------------------- |
| `shipmentId`                 | text      | ID vận đơn (Custom: `ship_XXXXXXXX`)         |
| `sender`                     | jsonb     | Thông tin người gửi                          |
| `receiver`                   | jsonb     | Thông tin người nhận                         |
| `product`                    | jsonb     | Thông tin hàng hóa                           |
| `order`                      | jsonb     | Thông tin đơn VTP                            |
| `items`                      | jsonb[]   | Danh sách chi tiết hàng hóa                  |
| `commonKeys`                 | text[]    | Mã tham chiếu (receiptCode, orderId...)      |
| `receiptIds`                 | text[]    | **Danh sách ID phiếu tiếp nhận**             |
| `status`                     | text      | `CREATED`, `PICKUP`, `DELIVERED`, `CANCELED` |
| `trackingNumber`             | text      | Mã vận đơn VTP (NULL nếu Pickup)             |
| `shipmentDate`               | timestamp | Ngày gửi                                     |
| `deliveryDate`               | timestamp | Ngày giao                                    |
| `fee`                        | integer   | Cước phí                                     |
| `note`                       | text      | Ghi chú                                      |
| `appUID`                     | text      | ID ứng dụng (map VTP credentials)            |
| `_deprecated_trackingNumber` | text      | Mã nội bộ Pickup (`TTYYYYMMDDHHMM`)          |

---

## 2. Quản lý Vận đơn (`Shipment`)

**File nguồn**: `BLACK/LOGISTICS/2_ShipmentOrder.js`  
**Kế thừa từ**: `LogisticsEntity` (`BLACK/LOGISTICS/1_logisticsEntities.js`)

### A. Tạo Vận đơn (`createOrder`)

Hàm `Shipment.createOrder` là điểm truy cập chính để tạo vận đơn, hỗ trợ **3 kịch bản**:

#### Kịch bản 1: Khách tự lấy (Direct Pickup)

**Trigger**: `mode: "pickup"` hoặc `order.service: "PICKUP"`

**Luồng xử lý**:

1. Sinh mã nội bộ: `TT + YYYYMMDD + HHMM` (VD: `TT20260114103000`)
2. Tạo Shipment record:
    - `trackingNumber`: `null`
    - `_deprecated_trackingNumber`: Mã nội bộ
    - `status`: `"PICKUP"`
    - `fee`: `0`
3. Cập nhật Receipts (nếu có `receiptIds`):
    - Set `trackingNumber` = mã nội bộ
    - Append `shipmentId` vào `shipmentIds[]`
    - Set `receiptDeliveryMethod` = `'Pickup'`

**Ví dụ Request**:

```json
{
    "mode": "pickup",
    "receiptIds": ["TNM26c0904"],
    "sender": { "name": "Lab IRDOP" },
    "receiver": { "name": "Khách hàng A" },
    "product": { "name": "Phiếu phân tích", "quantity": 1 }
}
```

#### Kịch bản 2: Gửi kèm vận đơn cũ (Attach to Existing)

**Trigger**: `mode: "attach"` + (`existingShipmentId` hoặc `existingTrackingNumber`)

**Luồng xử lý**:

1. Tìm Shipment gốc trong DB
2. Nếu không tìm thấy → Error `404`
3. Fetch Receipt codes từ `receiptIds` mới
4. Merge vào Shipment gốc:
    - `commonKeys` = [...old, ...newCodes]
    - `receiptIds` = [...old, ...newIds]
5. Cập nhật Receipts mới:
    - Set `trackingNumber` = tracking của Shipment gốc
    - Append `shipmentId` vào `shipmentIds[]`

**Ví dụ Request**:

```json
{
    "mode": "attach",
    "existingTrackingNumber": "133246295248",
    "receiptIds": ["TNM26c0905", "TNM26c0906"]
}
```

#### Kịch bản 3: Tạo đơn ViettelPost mới (Standard VTP)

**Trigger**: Không có `mode` đặc biệt, có đầy đủ thông tin `sender`, `receiver`, `product`, `order`

**Luồng xử lý**:

1. Validate input (`VTP_Helper.validateOptions`)
2. Login VTP API → Get token
3. Map payload → Call VTP `/v2/order/createOrder`
4. Nhận `ORDER_NUMBER` + `MONEY_TOTAL` từ VTP
5. Tạo Shipment record:
    - `trackingNumber`: `ORDER_NUMBER`
    - `status`: `"CREATED"`
    - `fee`: `MONEY_TOTAL`
6. Cập nhật Receipts (nếu có):
    - Set `trackingNumber` = VTP tracking
    - Append `shipmentId` vào `shipmentIds[]`
    - Set `receiptDeliveryMethod` = `'Post'`

**Ví dụ Request**:

```json
{
    "sender": {
        "name": "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN",
        "address": "12 Phùng Khoang 2",
        "phone": "0868872578",
        "email": "kiemnghiem@irdop.org",
        "province_id": 1,
        "district_id": 25,
        "wards_id": 497
    },
    "receiver": {
        "name": "Công ty Biogreen",
        "address": "H01, L23 An phú villa",
        "phone": "0973278896",
        "email": "lientt.biogreen@gmail.com"
    },
    "product": {
        "name": "12 x PPT tiếp nhận",
        "description": "Phiếu phân tích",
        "quantity": 1,
        "weight": 100,
        "type": "HH"
    },
    "order": {
        "payment": 3,
        "service": "VCN",
        "note": "Gửi phiếu phân tích"
    },
    "receiptIds": ["TNM26c0904"]
}
```

---

### B. Hủy Vận đơn (`cancelViettelOrder`)

**Input**: `trackingNumber`, `note` (optional), `authToken`

**Luồng xử lý**:

1. Kiểm tra loại vận đơn:
    - **Nếu `trackingNumber` bắt đầu bằng `"TT"`** → Vận đơn nội bộ (Pickup)
        - Chỉ update DB: `status = "CANCELED"`
    - **Nếu là VTP tracking** → Gọi VTP API
        - Call `/v2/order/UpdateOrder` với `TYPE: 4`
        - Nếu thành công → Update DB: `status = "CANCELED"`

**Ví dụ Request**:

```json
{
    "trackingNumber": "133246295248",
    "note": "Khách hủy đơn"
}
```

---

### C. Lấy danh sách Vận đơn (`getList`)

**Method**: `Shipment.getList({ authToken, page, itemsPerPage, filter, searchTerm })`

**Luồng xử lý**:

1. Xác thực & phân quyền: `READ` trên `service.ShipmentOrder`
2. Build SQL query:
    - WHERE: `deletedAt IS NULL`
    - Filter: Simple equality (VD: `status = 'CREATED'`)
    - Search: `CAST(shipmentId AS TEXT) ILIKE '%search%'`
3. Query IDs → Fetch details via `getById` (parallel)
4. Return: `{ data: [...], pagination: {...} }`

**Query Parameters**:

- `page`: Trang hiện tại (default: 1)
- `itemsPerPage`: Số item/trang (default: 20)
- `searchTerm`: Tìm kiếm theo `shipmentId`
- `status`: Filter theo trạng thái (VD: `CREATED`, `PICKUP`)

---

### D. Chi tiết Vận đơn đầy đủ (`getFullById`)

**Method**: `Shipment.getFullById({ id, authToken })`

**Luồng xử lý**:

1. Gọi `getById` → Lấy Shipment cơ bản
2. Nếu không tìm thấy → Return `null`
3. **Build Receipt snapshots**:
    - Lấy `receiptIds` từ Shipment
    - Parallel call `Receipt.getById` cho từng ID
    - Filter `null` results
4. Gắn vào `shipment.receipts = [...]`
5. Return shipment đầy đủ

**Response Structure**:

```json
{
  "shipmentId": "ship_6f8db7",
  "trackingNumber": "133246295248",
  "status": "CREATED",
  "sender": {...},
  "receiver": {...},
  "product": {...},
  "receipts": [
    {
      "receiptId": "TNM26c0904",
      "receiptCode": null,
      "client": {...},
      "contactPerson": {...},
      "status": "Đã gửi kết quả"
    }
  ]
}
```

---

## 3. ViettelPost Integration

### A. VTP_Helper

**Methods**:

- `getConfig(appUID)`: Lấy credentials từ `env.VIETTELPOST_CRED`
- `getToken(appUID)`: Login VTP API → Cache token
- `getHeaders(token)`: Return `{ token }`
- `validateOptions(options)`: Validate sender/receiver/product/order

### B. VTP API Endpoints

| Endpoint                | Method | Purpose               |
| ----------------------- | ------ | --------------------- |
| `/v2/user/Login`        | POST   | Lấy token             |
| `/v2/order/createOrder` | POST   | Tạo vận đơn           |
| `/v2/order/UpdateOrder` | POST   | Hủy vận đơn (TYPE: 4) |

---

## 4. API Handler (`3_logistics_api_handler.js`)

Tuân thủ chặt chẽ `DOCUMENTATION/API_RULE.md`.

### Routing Table

| Action   | HTTP Method | Option   | Endpoint                          | Mô tả                           |
| -------- | ----------- | -------- | --------------------------------- | ------------------------------- |
| `get`    | GET         | `list`   | `/v2/ShipmentOrder/get/list`          | Danh sách phân trang            |
| `get`    | GET         | `detail` | `/v2/ShipmentOrder/get/detail?id=...` | Chi tiết 1 record               |
| `get`    | GET         | `full`   | `/v2/ShipmentOrder/get/full?id=...`   | Chi tiết + Receipt snapshots    |
| `create` | POST        | -        | `/v2/ShipmentOrder/create`            | Tạo vận đơn (gọi `createOrder`) |
| `update` | POST        | -        | `/v2/ShipmentOrder/update`            | Cập nhật / Hủy đơn              |
| `delete` | POST        | -        | `/v2/ShipmentOrder/delete`            | Xóa mềm                         |

### Auth Token Extraction

```javascript
const authHeader = msg.req.headers["authorization"] || "";
const authToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader || msg.req.cookies["sid"];
```

---

## 5. Trạng thái Vận đơn (Status)

| Status      | Mô tả                        |
| ----------- | ---------------------------- |
| `CREATED`   | Vừa tạo đơn VTP, chưa gửi    |
| `PICKUP`    | Khách tự lấy (không qua VTP) |
| `DELIVERED` | Đã giao hàng                 |
| `CANCELED`  | Đã hủy                       |

---

## 6. Ví dụ Data Flow

### Tạo vận đơn VTP + Cập nhật Receipt

```
1. Frontend → POST /v2/ShipmentOrder/create
   Body: { sender, receiver, product, order, receiptIds: ["TNM26c0904"] }

2. API Handler → Shipment.createOrder()

3. Shipment.createOrder() → VTP_Helper.getToken()
   → Call VTP API /v2/order/createOrder
   → Nhận ORDER_NUMBER: "133246295248"

4. Tạo Shipment record trong DB:
   {
     shipmentId: "ship_6f8db7",
     trackingNumber: "133246295248",
     status: "CREATED",
     fee: 11000,
     receiptIds: ["TNM26c0904"]
   }

5. Cập nhật Receipt TNM26c0904:
   UPDATE lab.receipt SET
     trackingNumber = '133246295248',
     shipmentIds = array_append(shipmentIds, 'ship_6f8db7'),
     receiptDeliveryMethod = 'Post'
   WHERE receiptId = 'TNM26c0904'

6. Return Shipment object
```

---

## 7. Error Handling

| Error Code | Message                      | Cause                  |
| ---------- | ---------------------------- | ---------------------- |
| 400        | Missing shipmentId           | Thiếu ID trong request |
| 401        | Auth required                | Thiếu token            |
| 404        | Shipment not found           | ID không tồn tại       |
| 500        | ViettelPost Login Failed     | VTP credentials sai    |
| 500        | ViettelPost CreateAPI Failed | VTP API error          |

---

## 8. Testing

**File**: `BLACK/LOGISTICS/TEST_LOGISTICS.js`

**Test Cases**:

- ✅ GET LIST (pagination)
- ✅ GET DETAIL (single record)
- ✅ GET FULL (with Receipt snapshots)
- ✅ SEARCH (by shipmentId)
- ⚠️ FILTER (by status) — Cần sửa tên cột từ `shipmentStatus` → `status`

**Run Test**:

```
GET /v2/test/logistics
→ Download: api_test_logistics_[timestamp].txt
```
