# SHIPMENT API DOCUMENTATION

**Module**: Logistics (Quản lý Giao nhận)  
**Version**: 2.0  
**Base URL**: `/v2/ShipmentOrder`  
**Generated**: 2026-02-14

---

## Table of Contents

1. [Authentication](#authentication)
2. [Shipment Endpoints](#shipment-endpoints)
    - [GET LIST](#get-list)
    - [GET DETAIL](#get-detail)
    - [GET FULL](#get-full)
    - [CREATE](#create)
    - [UPDATE](#update)
    - [DELETE](#delete)
3. [Data Models](#data-models)
4. [Status Codes](#status-codes)
5. [Error Codes](#error-codes)

---

## Authentication

All endpoints require authentication via JWT token.

**Methods**:

1. **Bearer Token** (Recommended):

    ```
    Authorization: Bearer SS_3d25187a-efbf-481a-b632-2589e3ef7439
    ```

2. **Cookie**:
    ```
    Cookie: sid=SS_3d25187a-efbf-481a-b632-2589e3ef7439
    ```

**Login Endpoint**: `POST /v2/identity/login`

---

## Shipment Endpoints

### GET LIST

Lấy danh sách vận đơn với phân trang và tìm kiếm.

**Endpoint**: `GET /v2/ShipmentOrder/get/list`

**Query Parameters**:

| Parameter       | Type    | Required | Default     | Description                |
| --------------- | ------- | -------- | ----------- | -------------------------- |
| `page`          | integer | No       | 1           | Trang hiện tại             |
| `itemsPerPage`  | integer | No       | 20          | Số item/trang              |
| `searchTerm`    | string  | No       | -           | Tìm kiếm theo `shipmentId` |
| `status`        | string  | No       | -           | Filter theo trạng thái     |
| `sortColumn`    | string  | No       | `createdAt` | Cột sắp xếp                |
| `sortDirection` | string  | No       | `DESC`      | `ASC` hoặc `DESC`          |

**Example Request**:

```http
GET /v2/ShipmentOrder/get/list?page=1&itemsPerPage=1&searchTerm=ship
Authorization: Bearer SS_3d25187a-efbf-481a-b632-2589e3ef7439
```

**Example Response**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "shipmentId": "ship_6f8db7",
            "shipmentCarrier": "ViettelPost",
            "shipmentSender": {
                "name": "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN",
                "email": "kiemnghiem@irdop.org",
                "phone": "0868872578",
                "address": "12 Phùng Khoang 2",
                "wards_id": "497",
                "district_id": "25",
                "province_id": "1"
            },
            "shipmentReceiver": {
                "name": "Công ty cổ phần hóa dược và công nghệ sinh học Biogreen - Chi nhánh Bắc Giang",
                "email": "lientt.biogreen@gmail.com",
                "phone": "0973278896",
                "address": "H01, L23 An phú villa, KĐT Dương Nội",
                "wards_id": "597",
                "district_id": "30",
                "province_id": "1"
            },
            "shipmentProduct": {
                "name": "12 x PPT tiếp nhận TNM26c0904",
                "type": "HH",
                "weight": 100,
                "quantity": 1,
                "description": "Phiếu phân tích"
            },
            "shipmentOrder": {
                "note": "Gửi phiếu phân tích",
                "payment": 3,
                "service": "VCN",
                "voucher": "",
                "serviceAddress": ""
            },
            "shipmentItems": [
                {
                    "name": "12 x PPT tiếp nhận TNM26c0904",
                    "type": "HH",
                    "weight": 100,
                    "quantity": 1
                }
            ],
            "shipmentReferenceIds": [
                "SP26c0904-01",
                "SP26c0904-02",
                "TNM26c0904"
            ],
            "shipmentReceiptIds": [
                "TNM26c0904"
            ],
            "shipmentStatus": "CREATED",
            "shipmentTrackingNumber": "133246295248",
            "shipmentDate": null,
            "shipmentDeliveryDate": null,
            "shipmentFee": 11000,
            "shipmentNote": "Gửi phiếu phân tích",
            "appUID": "LIMS-IRDOP-PRD",
            "_deprecated_trackingNumber": null,
            "createdAt": "2026-01-23T03:16:10.392Z",
            "createdById": "IDx1c5fa",
            "modifiedAt": null,
            "modifiedById": null,
            "deletedAt": null
        }

    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 1,
        "total": 1,
        "totalPages": 1
    },
    "error": null
}
```

---

### GET DETAIL

Lấy chi tiết 1 vận đơn (không bao gồm Receipt snapshots).

**Endpoint**: `GET /v2/ShipmentOrder/get/detail`

**Query Parameters**:

| Parameter              | Type   | Required | Description |
| ---------------------- | ------ | -------- | ----------- |
| `id` hoặc `shipmentId` | string | Yes      | ID vận đơn  |

**Example Request**:

```http
GET /v2/ShipmentOrder/get/detail?id=ship_6f8db7
Authorization: Bearer SS_3d25187a-efbf-481a-b632-2589e3ef7439
```

**Example Response**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentId": "ship_6f8db7",
        "shipmentCarrier": "ViettelPost",
        "shipmentItems": [
            {
                "name": "12 x PPT tiếp nhận TNM26c0904",
                "type": "HH",
                "weight": 100,
                "quantity": 1,
                "description": "Phiếu phân tích"
            }
        ],
        "shipmentReferenceIds": [
            "SP26c0904-01",
            "SP26c0904-02",
            "TNM26c0904"
        ],
        "shipmentTrackingNumber": "133246295248",
        "shipmentNote": "Gửi phiếu phân tích",
        "appUID": "LIMS-IRDOP-PRD",
        "shipmentReceiptIds": [
            "TNM26c0904"
        ],
        "shipmentSender": {
            "name": "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN",
            "email": "kiemnghiem@irdop.org",
            "phone": "0868872578",
            "address": "12 Phùng Khoang 2"
        },
        "shipmentReceiver": {
            "name": "Công ty cổ phần hóa dược và công nghệ sinh học Biogreen",
            "email": "lientt.biogreen@gmail.com",
            "phone": "0973278896",
            "address": "H01, L23 An phú villa, KĐT Dương Nội"
        },
        "shipmentProduct": {
            "name": "12 x PPT tiếp nhận TNM26c0904",
            "type": "HH",
            "weight": 100,
            "quantity": 1
        },
        "shipmentOrder": {
            "note": "Gửi phiếu phân tích",
            "payment": 3,
            "service": "VCN",
            "voucher": "",
            "serviceAddress": ""
        },
        "shipmentStatus": "CREATED",
        "shipmentFee": 11000,
        "createdAt": "2026-01-23T03:16:10.392Z",
        "createdById": "IDx1c5fa"
    },
    "pagination": null,
    "error": null
}
```

---

### GET FULL

Lấy chi tiết vận đơn kèm **Receipt snapshots** (danh sách phiếu tiếp nhận liên kết).

**Endpoint**: `GET /v2/ShipmentOrder/get/full`

**Query Parameters**:

| Parameter              | Type   | Required | Description |
| ---------------------- | ------ | -------- | ----------- |
| `id` hoặc `shipmentId` | string | Yes      | ID vận đơn  |

**Example Request**:

```http
GET /v2/ShipmentOrder/get/full?id=ship_6f8db7
Authorization: Bearer SS_3d25187a-efbf-481a-b632-2589e3ef7439
```

**Example Response**:

```json
{
  "shipmentId": "ship_6f8db7",
  "trackingNumber": "133246295248",
  "status": "CREATED",
  "fee": 11000,
  "sender": {...},
  "receiver": {...},
  "product": {...},
  "order": {...},
  "items": [...],
  "commonKeys": [...],
  "receiptIds": ["TNM26c0904"],
  "receipts": [
    {
      "receiptId": "TNM26c0904",
      "receiptDate": "2026-01-09T03:19:12.292Z",
      "client": {
        "clientId": "CLx293a7be",
        "clientName": "Công ty Cổ phần hoá dược và công nghệ sinh học Biogreen - Chi nhánh Bắc Giang",
        "legalId": "0106388230-001",
        "clientAddress": "Tổ Dân Phố Chẽ, Xã Yên Thế, Tỉnh Bắc Ninh"
      },
      "contactPerson": {
        "name": "Thân Thị Liên",
        "email": "lientt.biogreen@gmail.com",
        "phone": "0973.278.896"
      },
      "reportRecipient": {
        "name": "Công ty cổ phần hóa dược và công nghệ sinh học Biogreen",
        "email": "lientt.biogreen@gmail.com",
        "address": "H01-L23 An phú villa, KĐT Dương Nội, p Dương Nội, Hà Đông, Hà Nội."
      },
      "orderId": "DH0006239",
      "salePerson": "Trần Thị Vân (vantt)",
      "totalFeeBeforeTax": 6864000,
      "status": "Đã gửi kết quả",
      "deadline": "2026-01-22T07:00:00.000Z",
      "_deprecated_trackingNumber": "133246295248",
      "createdAt": "2026-01-09T03:19:12.302Z",
      "createdById": "IDx873e4"
    }
  ],
  "createdAt": "2026-01-23T03:16:10.392Z",
  "createdById": "IDx1c5fa"
}
```

**Note**: Field `receipts` chứa snapshot đầy đủ của các phiếu tiếp nhận tại thời điểm query.

---

### CREATE

Tạo vận đơn mới. Hỗ trợ 3 kịch bản:

1. **Pickup** (Khách tự lấy)
2. **Attach** (Gửi kèm vận đơn cũ)
3. **VTP** (Tạo đơn ViettelPost mới)

**Endpoint**: `POST /v2/ShipmentOrder/create`

**Content-Type**: `application/json`

---

#### Scenario 1: Pickup (Khách tự lấy)

**Request Body**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "mode": "pickup",
        "shipmentReceiptIds": [
            "TNM26c0904"
        ],
        "shipmentSender": {
            "name": "Lab IRDOP"
        },
        "shipmentReceiver": {
            "name": "Khách hàng A"
        },
        "shipmentProduct": {
            "name": "Phiếu phân tích",
            "quantity": 1
        },
        "shipmentOrder": {
            "note": "Khách tự lấy"
        }
    },
    "pagination": null,
    "error": null
}
```

**Response**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentId": "ship_ABC12345",
        "shipmentCarrier": "Self-Pickup",
        "shipmentStatus": "PICKUP",
        "shipmentTrackingNumber": null,
        "_deprecated_trackingNumber": "TT20260114103000",
        "shipmentFee": 0,
        "shipmentReceiptIds": [
            "TNM26c0904"
        ],
        "createdAt": "2026-01-14T03:30:00.000Z"
    },
    "pagination": null,
    "error": null
}
```

---

#### Scenario 2: Attach (Gửi kèm vận đơn cũ)

**Request Body**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "mode": "attach",
        "existingTrackingNumber": "133246295248",
        "shipmentReceiptIds": [
            "TNM26c0905",
            "TNM26c0906"
        ]
    },
    "pagination": null,
    "error": null
}
```

**Response**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentId": "ship_6f8db7",
        "shipmentTrackingNumber": "133246295248",
        "shipmentStatus": "CREATED",
        "shipmentReferenceIds": [
            "SP26c0904-01",
            "TNM26c0904",
            "TNM26c0905",
            "TNM26c0906"
        ],
        "shipmentReceiptIds": [
            "TNM26c0904",
            "TNM26c0905",
            "TNM26c0906"
        ],
        "modifiedAt": "2026-01-14T03:35:00.000Z"
    },
    "pagination": null,
    "error": null
}
```

---

#### Scenario 3: VTP (Tạo đơn ViettelPost)

**Request Body**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentSender": {
            "name": "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN",
            "address": "12 Phùng Khoang 2",
            "phone": "0868872578",
            "email": "kiemnghiem@irdop.org",
            "province_id": 1,
            "district_id": 25,
            "wards_id": 497
        },
        "shipmentReceiver": {
            "name": "Công ty Biogreen",
            "address": "H01, L23 An phú villa, KĐT Dương Nội",
            "phone": "0973278896",
            "email": "lientt.biogreen@gmail.com",
            "province_id": 1,
            "district_id": 30,
            "wards_id": 597
        },
        "shipmentProduct": {
            "name": "12 x PPT tiếp nhận TNM26c0904",
            "description": "Phiếu phân tích",
            "quantity": 1,
            "weight": 100,
            "type": "HH"
        },
        "shipmentOrder": {
            "payment": 3,
            "service": "VCN",
            "note": "Gửi phiếu phân tích",
            "serviceAddress": "",
            "voucher": ""
        },
        "shipmentReceiptIds": [
            "TNM26c0904"
        ],
        "appUID": "LIMS-IRDOP-PRD"
    },
    "pagination": null,
    "error": null
}
```

**Response**:

```json
{
  "shipmentId": "ship_6f8db7",
  "trackingNumber": "133246295248",
  "status": "CREATED",
  "fee": 11000,
  "sender": {...},
  "receiver": {...},
  "product": {...},
  "order": {...},
  "receiptIds": ["TNM26c0904"],
  "createdAt": "2026-01-23T03:16:10.392Z",
  "createdById": "IDx1c5fa"
}
```

---

### UPDATE

Cập nhật vận đơn hoặc **hủy vận đơn** (nếu `status: "CANCELED"`).

**Endpoint**: `POST /v2/ShipmentOrder/update`

**Content-Type**: `application/json`

---

#### Standard Update

**Request Body**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentId": "ship_6f8db7",
        "note": "Cập nhật ghi chú mới",
        "status": "DELIVERED"
    },
    "pagination": null,
    "error": null
}
```

**Response**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentId": "ship_6f8db7",
        "shipmentStatus": "DELIVERED",
        "shipmentNote": "Cập nhật ghi chú mới",
        "modifiedAt": "2026-01-14T04:00:00.000Z",
        "modifiedById": "IDx1c5fa"
    },
    "pagination": null,
    "error": null
}
```

---

#### Cancel Shipment

**Request Body**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "trackingNumber": "133246295248",
        "status": "CANCELED",
        "note": "Khách hủy đơn"
    },
    "pagination": null,
    "error": null
}
```

**Response**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentId": "ship_6f8db7",
        "shipmentTrackingNumber": "133246295248",
        "shipmentStatus": "CANCELED",
        "shipmentNote": "Khách hủy đơn",
        "modifiedAt": "2026-01-14T04:05:00.000Z"
    },
    "pagination": null,
    "error": null
}
```

**Note**: Nếu `trackingNumber` bắt đầu bằng `"TT"` (Pickup), chỉ update DB. Nếu là VTP tracking, sẽ gọi VTP API để hủy đơn.

---

### DELETE

Xóa mềm vận đơn (soft delete).

**Endpoint**: `POST /v2/ShipmentOrder/delete`

**Content-Type**: `application/json`

**Request Body**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "shipmentId": "ship_6f8db7"
    },
    "pagination": null,
    "error": null
}
```

**Response**:

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "id": "ship_6f8db7",
        "status": "Deleted"
    },
    "pagination": null,
    "error": null
}
```

**Note**: Record vẫn tồn tại trong DB với `deletedAt` được set.

---

## Data Models

### Shipment Object

| Field                        | Type      | Description                       |
| ---------------------------- | --------- | --------------------------------- |
| `shipmentId`                 | string    | ID vận đơn (PK)                   |
| `sender`                     | object    | Thông tin người gửi               |
| `receiver`                   | object    | Thông tin người nhận              |
| `product`                    | object    | Thông tin hàng hóa                |
| `order`                      | object    | Thông tin đơn VTP                 |
| `items`                      | array     | Danh sách chi tiết hàng hóa       |
| `commonKeys`                 | string[]  | Mã tham chiếu                     |
| `receiptIds`                 | string[]  | Danh sách ID phiếu tiếp nhận      |
| `status`                     | string    | Trạng thái vận đơn                |
| `trackingNumber`             | string    | Mã vận đơn VTP (NULL nếu Pickup)  |
| `shipmentDate`               | timestamp | Ngày gửi                          |
| `deliveryDate`               | timestamp | Ngày giao                         |
| `fee`                        | integer   | Cước phí (VND)                    |
| `note`                       | string    | Ghi chú                           |
| `appUID`                     | string    | ID ứng dụng                       |
| `_deprecated_trackingNumber` | string    | Mã nội bộ Pickup                  |
| `createdAt`                  | timestamp | Thời điểm tạo                     |
| `createdById`                | string    | ID người tạo                      |
| `modifiedAt`                 | timestamp | Thời điểm cập nhật                |
| `modifiedById`               | string    | ID người cập nhật                 |
| `deletedAt`                  | timestamp | Thời điểm xóa (NULL nếu chưa xóa) |

### Sender / Receiver Object

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "name": "string",
        "address": "string",
        "phone": "string",
        "email": "string",
        "province_id": "integer",
        "district_id": "integer",
        "wards_id": "integer"
    },
    "pagination": null,
    "error": null
}
```

### Product Object

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "name": "string",
        "description": "string",
        "quantity": "integer",
        "weight": "integer (grams)",
        "type": "string (HH: Hàng hóa)"
    },
    "pagination": null,
    "error": null
}
```

### Order Object

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "payment": "integer (1-4: Phương thức thanh toán)",
        "service": "string (VCN, VTK, VBE...)",
        "serviceAddress": "string",
        "voucher": "string",
        "note": "string"
    },
    "pagination": null,
    "error": null
}
```

---

## Status Codes

### Shipment Status

| Status      | Description                  |
| ----------- | ---------------------------- |
| `CREATED`   | Vừa tạo đơn VTP, chưa gửi    |
| `PICKUP`    | Khách tự lấy (không qua VTP) |
| `DELIVERED` | Đã giao hàng                 |
| `CANCELED`  | Đã hủy                       |

### VTP Payment Methods

| Code | Description               |
| ---- | ------------------------- |
| 1    | Người gửi trả             |
| 2    | Người nhận trả            |
| 3    | Người gửi trả, thu hộ COD |
| 4    | Miễn phí                  |

### VTP Service Types

| Code  | Description               |
| ----- | ------------------------- |
| `VCN` | Viettel Chuyển phát nhanh |
| `VTK` | Viettel Tiết kiệm         |
| `VBE` | Viettel Bưu kiện          |

---

## Error Codes

| HTTP Status | Error Code | Message                                   | Description                           |
| ----------- | ---------- | ----------------------------------------- | ------------------------------------- |
| 400         | 400        | Missing shipmentId in query params        | Thiếu ID trong request                |
| 400         | 400        | Missing shipmentId in body                | Thiếu ID trong body                   |
| 400         | 400        | Tracking Number required for cancellation | Thiếu tracking number khi hủy         |
| 400         | 400        | Sender object is required                 | Thiếu thông tin người gửi             |
| 400         | 400        | Receiver object is required               | Thiếu thông tin người nhận            |
| 401         | 401        | Auth required                             | Thiếu hoặc sai token                  |
| 403         | 403        | Permission denied                         | Không có quyền truy cập               |
| 404         | 404        | Shipment not found                        | Không tìm thấy vận đơn                |
| 404         | 404        | Existing shipment not found to attach     | Không tìm thấy vận đơn gốc để gửi kèm |
| 500         | 500        | ViettelPost Login Failed                  | Lỗi đăng nhập VTP                     |
| 500         | 500        | ViettelPost CreateAPI Failed              | Lỗi tạo đơn VTP                       |
| 500         | 500        | ViettelPost CancelAPI Failed              | Lỗi hủy đơn VTP                       |

---

## Notes

1. **VTP Credentials**: Cần cấu hình `VIETTELPOST_CRED` trong environment variables với format:

    ```json
    {
        "LIMS-IRDOP-PRD": {
            "username": "...",
            "password": "...",
            "CUS_ID": 123,
            "GROUPADDRESS_ID": 456
        }
    }
    ```

2. **Receipt Updates**: Khi tạo vận đơn với `receiptIds`, các phiếu tiếp nhận sẽ tự động được cập nhật:
    - `trackingNumber` = Mã vận đơn
    - `shipmentIds` = Append shipmentId mới
    - `receiptDeliveryMethod` = `'Pickup'` hoặc `'Post'`

3. **Search**: Tìm kiếm theo `shipmentId` sử dụng `ILIKE` (case-insensitive).

4. **Pagination**: Default `itemsPerPage = 20`, max không giới hạn (cân nhắc performance).

5. **Permissions**: Tất cả endpoints yêu cầu quyền `READ`/`WRITE`/`DELETE` trên bảng `service.ShipmentOrder`.

---

**End of Documentation**
