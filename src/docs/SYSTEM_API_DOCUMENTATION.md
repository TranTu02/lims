# SYSTEM API DOCUMENTATION

**Version:** 2.3  
**Base URL:** `<domain>/v2`  
**Formats:** JSON  
**Auth:** Bearer Token (JWT)

Module `SYSTEM` cung cấp các API để truy cập nhật ký sự kiện nghiệp vụ và quản trị rủi ro của hệ thống, tuân thủ nguyên tắc thiết kế API của hệ thống LIMS.

---

## 1. Business Events (Sự kiện nghiệp vụ)

Quản lý và truy vấn các cột mốc lịch sử, sự kiện của các thực thể trong hệ thống.

**URL Resource:** `business-events`

### 1.1. Lấy danh sách sự kiện
**Method:** `GET`  
**Endpoint:** `/v2/business-events/get/list`

**Query Parameters Tiêu chuẩn:**

| Param | Type | Default | Mô tả |
| :--- | :--- | :--- | :--- |
| `page` | number | 1 | Trang hiện tại. |
| `itemsPerPage` | number | 10 | Số bản ghi trên mỗi trang. |
| `sortColumn` | string | `createdAt` | Tên cột hiển thị sắp xếp. |
| `sortDirection` | string | `DESC` | `ASC` hoặc `DESC`. |
| `search` | string | null | Từ khóa tìm kiếm trên `eventId`. |
| `entityType` | string | null | Lọc theo loại thực thể (`Analyses`, `Samples`, ...). |
| `entityId` | string | null | Lọc theo ID của thực thể. |
| `eventStatus` | string | null | Lọc theo trạng thái sự kiện. |

**Response (Success 200):**

```json
{
    "success": true,
    "statusCode": 200,
    "data": [
        {
            "eventId": "EVT-0001",
            "entityType": "Analyses",
            "entityId": "ANS-2603-01",
            "eventStatus": "DataEntered",
            "eventNote": "KTV đã nhập kết quả sơ bộ",
            "involvedIds": [
                "USR-001",
                "USR-002"
            ],
            "createdAt": "2026-03-26T10:00:00.000Z",
            "createdBy": "USR-001"
        }
    ],
    "pagination": null,
    "error": null
}
```

### 1.2. Xem chi tiết sự kiện

**Method:** `GET`  
**Endpoint:** `/v2/business-events/get/detail?eventId=EVT-0001`

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `eventId` | string | ID của sự kiện cần lấy chi tiết. |

**Response (Success 200):**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "eventId": "EVT-0001",
        "entityType": "Analyses",
        "entityId": "ANS-2603-01",
        "eventStatus": "DataEntered",
        "eventNote": "KTV đã nhập kết quả sơ bộ",
        "eventData": {
            "result": "5.0",
            "unit": "mg/L",
            "technician": "Nguyen Van A"
        },
        "involvedIds": [
            "USR-001",
            "USR-002"
        ],
        "createdAt": "2026-03-26T10:00:00.000Z",
        "createdBy": "USR-001"
    },
    "pagination": null,
    "error": null
}
```

### 1.3. Khởi tạo một Business Event

**Method:** `POST`
**Endpoint:** `/v2/business-events/create`

**Body Payload:**

```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "entityType": "Analyses",
        "entityId": "ANS-2603-01",
        "eventStatus": "Approved",
        "eventNote": "QA đã duyệt",
        "eventData": {
            "approvedBy": "QA Manager"
        },
        "involvedIds": [
            "USR-001",
            "USR-002"
        ]
    },
    "pagination": null,
    "error": null
}
```

### 1.4. Cập nhật một Business Event
**Method:** `POST`  
**Endpoint:** `/v2/business-events/update`

**Body Payload:**
```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "eventId": "EVT-0001",
        "eventNote": "KTV đã nhập kết quả sơ bộ (đã điều chỉnh)"
    },
    "pagination": null,
    "error": null
}
```

### 1.5. Xóa (Soft Delete) một Business Event
**Method:** `POST`  
**Endpoint:** `/v2/business-events/delete`

**Body Payload:**
```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "eventId": "EVT-0001"
    },
    "pagination": null,
    "error": null
}
```

---

## 2. Risk Register (Sổ tay rủi ro)

Quản trị các rủi ro đã được nhận diện trong hệ thống (Tuân thủ ISO 17025).

**URL Resource:** `risk-registers`

### 2.1. Lấy danh sách rủi ro
**Method:** `GET`  
**Endpoint:** `/v2/risk-registers/get/list`

### 2.2. Lấy chi tiết rủi ro
**Method:** `GET`  
**Endpoint:** `/v2/risk-registers/get/detail?riskId=RSK-001`

### 2.3. Tạo rủi ro mới
**Method:** `POST`  
**Endpoint:** `/v2/risk-registers/create`

**Body:**
```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "riskTitle": "Thiếu hóa chất chuẩn chuẩn",
        "riskDescription": "Hóa chất chuẩn cho chỉ tiêu Pb sắp hết hạn",
        "riskLevel": "Medium"
    },
    "pagination": null,
    "error": null
}
```

### 2.4. Cập nhật rủi ro

**Method:** `POST`  
**Endpoint:** `/v2/risk-registers/update`

**Body:**
```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "riskId": "RSK-001",
        "riskStatus": "Mitigated",
        "mitigationPlan": "Đã mua bổ sung và cập nhật quy trình bảo quản"
    },
    "pagination": null,
    "error": null
}
```

### 2.5. Xóa rủi ro

**Method:** `POST`  
**Endpoint:** `/v2/risk-registers/delete`

**Body Payload:**
```json
{
    "success": true,
    "statusCode": 200,
    "data": {
        "riskId": "RSK-001"
    },
    "pagination": null,
    "error": null
}
```

---

## 3. Mã lỗi đặc thù (System Errors)

Dựa trên cấu trúc trả về chuẩn nếu có lỗi từ hệ thống:

```json
{
  "success": false,
  "statusCode": 400,
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Missing eventId in body params for detail",
    "details": null
  }
}
```

| HTTP Status | Trường hợp |
| :--- | :--- |
| `400` | Gửi thiếu ID (khi GET detail / POST update/delete), hoặc thiếu các thông tin bắt buộc khi thực hiện create (e.g. `entityType`). |
| `401` | Lỗi chứng thực (Token invalid / expired). |
| `403` | Lỗi phân quyền (User thiếu quyền Read/Write). |
| `404` | Không tìm thấy thực thể để get/update/delete. |
