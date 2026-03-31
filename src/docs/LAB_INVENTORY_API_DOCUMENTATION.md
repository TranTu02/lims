# LAB INVENTORY API DOCUMENTATION (GENERAL INVENTORY)

_Tài liệu hướng dẫn sử dụng API phân hệ Lab Inventory (Equipment & Tools)._

## I. THÔNG TIN CHUNG

- **Schema Database**: `labInventories`
- **Module**: `labInventoryEntities.js`
- **Base URL**: `https://red.irdop.org/v2/`
- **Phương thức Auth**: Bearer Token / SID Cookie.

---

## II. MA TRẬN API RESOURCE

| Resource                | Endpoint                  | Mô tả                                       |
| :---------------------- | :------------------------ | :------------------------------------------ |
| **Lab Inventory**       | `/v2/lab-inventories`     | Quản lý thiết bị máy móc (Equipment).       |
| **Lab Tool**            | `/v2/lab-tools`           | Quản lý dụng cụ thủy tinh (Glassware/Tools).|
| **Asset Activity Log**  | `/v2/asset-activity-logs` | Nhật ký hoạt động & truy vết tài sản.       |

---

## III. CHI TIẾT ENDPOINTS

### 1. Lab Inventory (Equipment) - `/v2/lab-inventories`

#### **GET /get/list**
Lấy danh sách thiết bị có phân trang và lọc dữ liệu.

- **Query Params**:
  - `page`: Trang hiện tại (mặc định 1).
  - `itemsPerPage`: Số dòng mỗi trang (mặc định 20).
  - `search`: Tìm kiếm theo ID hoặc Tên.
  - `labInventoryStatus[]`: Lọc theo trạng thái (`Ready`, `InUse`, `Maintenance`, `Faulty`).
  - `labInventoryLocation`: Lọc theo vị trí.
  - `sortBy`: `createdAt`, `labInventoryName`, `labInventoryNextCalibrationDate`.
  
- **Response**:
```json
{
    "success": true,
    "data": [
        {
            "labInventoryId": "EQ_A1B2C3",
            "labInventoryName": "Máy HPLC Agilent 1260",
            "labInventoryCode": "TSC-001",
            "labInventoryStatus": "Ready",
            "labInventoryNextCalibrationDate": "2026-12-31",
            "labInventoryLocation": "Phòng Hóa Lý"
        }
    ],
    "pagination": { "page": 1, "totalPages": 1, "totalItems": 15 }
}
```

#### **GET /get/full**

Lấy đầy đủ thông tin thiết bị kèm theo snapshot các tài liệu đính kèm.

- **Query Params**:
  - `labInventoryId`: ID thiết bị.

---

#### **POST /create**

Tạo mới thiết bị.

- **Request Body**:
  - `labInventoryName` (bắt buộc): Tên thiết bị.
  - `labInventoryCode`: Mã quản lý tài sản.
  - `labInventoryStatus`: Mặc định `Ready`.
  - `labInventoryLocation`: Vị trí đặt.
  - `labInventorySpecifications`: `{ "power": "220V", "weight": "30kg" }`.
  - `labInventoryDocumentIds`: `["DOC_001", "DOC_002"]`.
  - `labInventoryManufacturer`: Hãng sản xuất.
  - `labInventoryModel`: Model thiết bị.
  - `labInventorySerial`: Số serial.
  - `labInventoryImportDate`: Ngày nhập.
  - `labInventoryWarrantyExpiryDate`: Ngày hết hạn bảo hành.
  - `labInventoryNotes`: Ghi chú thêm.

---

### 2. Lab Tool - `/v2/lab-tools`

#### **GET /get/list**
Lấy danh sách dụng cụ thí nghiệm.

- **Query Params**:
  - `labToolType[]`: Lọc theo loại (`Volumetric`, `Pipette`...).
  - `labToolStatus[]`: Lọc theo trạng thái (`Ready`, `Broken`, `Lost`).
  - `requiresCalibration`: `true`/`false`.

#### **POST /create**
Tạo mới dụng cụ thí nghiệm.

- **Request Body**:
  - `labToolName` (bắt buộc): Tên dụng cụ.
  - `labToolCode`: Mã quản lý.
  - `labToolSpecifications`: `{ "capacity": "50ml", "tolerance": "±0.01" }`.

---

### 3. Asset Activity Log - `/v2/asset-activity-logs`

#### **POST /create**
Ghi nhật ký sử dụng/hiệu chuẩn/bảo trì cho tài sản.

- **Request Body**:
  - `assetId` (bắt buộc): `labInventoryId` hoặc `labToolId`.
  - `assetTable` (bắt buộc): `labInventories` hoặc `labTools`.
  - `logType` (bắt buộc): `Usage`, `Maintenance`, `Calibration`, `Incident`.
  - `logDescription`: Nội dung chi tiết.
  - `logLocation`: Vị trí thực hiện (Phòng Lab A, Tầng 3...).
  - `logData`: `{ "temperature": 25, "humidity": 60 }`.
  - `commonKeys`: `["analysisId:ANA-001", "receiptId:REC-999"]`.
  - `actionTime`: Thời gian thực hiện (mặc định NOW).

#### **GET /get/list (TRUY VẾT CHI TIẾT)**
Tra cứu lịch sử truy vết chéo.

- **Query Params**:
  - `commonKeys[]`: Lọc chéo tất cả log liên quan đến một phân tích.
    - `?commonKeys[]=analysisId:ANA-001`
  - `assetId`: Xem lịch sử của một tài sản cụ thể.

---

## IV. QUY TẮC MÃ ID (NAMING CONVENTION)

- **Equipment**: `EQ_[RANDOM_6_CAPS]` (Ví dụ: `EQ_HPL001`).
- **Lab Tool**: `TOOL_[RANDOM_6_CAPS]` (Ví dụ: `TOOL_PIP012`).
- **Activity Log**: `LOG_[RANDOM_6_CAPS]` (Ví dụ: `LOG_Z9Y8X7`).

---
_Cập nhật lần cuối: 2026-03-23_
