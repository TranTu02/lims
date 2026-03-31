# TỔNG QUAN TÁI CẤU TRÚC PHÂN HỆ LAB INVENTORY (V2)

## 1. MỤC TIÊU CẢI TIẾN

Phân hệ quản lý vật tư và thiết bị được tái cấu trúc từ mô hình quản lý thực thể đơn lẻ (Single Entity) sang mô hình **SKU - Inventory Tiered Model** nhằm:

- **Tách biệt dữ liệu danh mục (Master Data)**: Quản lý thông tin dùng chung của dòng máy, hãng sản xuất, model tại bảng SKU.
- **Quản lý thực thể vật lý (Instances)**: Theo dõi từng con máy (Serial, Asset Tag) hoặc từng lô vật tư tiêu hao (Số lượng, Vị trí).
- **Hỗ trợ đa dạng vật tư**: Quản lý thống nhất Thiết bị (Equipment), Dụng cụ (Tools) và Vật tư tiêu hao (Consumables/Materials).
- **Tăng cường khả năng truy vết (Traceability)**: Log chi tiết lịch sử cho từng thiết bị cụ thể.

---

## 2. CẤU TRÚC DATABASE (SCHEMA: `labInventories`)

### 2.1. Bảng `labSkus` (Danh mục Master)

Chứa thông tin cấu hình và thông số kỹ thuật chung.
- **`labSkuId`**: Mã SKU (Tiền tố: `SKU_`).
- **`labSkuType`**: Phân loại (`Equipment`, `Tool`, `Material`).
- **Trường thông tin**: `labSkuName`, `labSkuManufacturer`, `labSkuModel`, `labSkuSpecifications` (JSONB).

### 2.2. Bảng `labInventories` (Kho bãi & Thực thể)
Liên kết tới SKU và chứa thông tin định danh riêng biệt.
- **`labInventoryId`**: ID thực thể (Tiền tố: `INV_`).
- **`labSkuId`**: Foreign Key liên kết tới danh mục.
- **Đặc thù thiết bị**: `labInventorySerial`, `labInventoryCode` (Asset Card), `labInventoryStatus`.
- **Đặc thù vật tư**: `labInventoryQty` (Số lượng), `labInventoryExpiryDate`.
- **Bảo trì/Hiệu chuẩn**: `lastCalibrationDate`, `nextCalibrationDate`, `warrantyExpiryDate`.

### 2.3. Bảng `assetActivityLogs` (Sổ cái truy vết)
Sử dụng mô hình đa hình (Polymorphic) để ghi nhật ký.
- **`assetId`**: Link tới `labInventoryId`.
- **`assetTable`**: Cố định là `labInventories`.
- **`commonKeys`**: Chuỗi các key truy vết chéo (ví dụ: `["analysisId:...", "receiptId:..."]`).

---

## 3. LOGIC XỬ LÝ BACKEND (UNIT: `BLACK/LAB INVENTORIES/`)

### 3.1. Cơ chế Snapshot (`getFullById`)
Khi gọi dữ liệu chi tiết ở mức "Full", hệ thống thực hiện:
1. Truy vấn thông tin thực thể từ `labInventories`.
2. Tự động Snapshot thông tin Danh mục từ bảng `labSkus`.
3. Tự động Snapshot thông tin Tài liệu (HDSD, Kiểm định) từ bảng `documents`.
4. Tổng hợp toàn bộ nhật ký hoạt động (`activityLogs`) từ bảng logs.

### 3.2. Tìm kiếm đa cột (Multi-column Search)
Đã triển khai thuộc tính `static get searchColumns()` trong các lớp thực thể:
- Cho phép tìm kiếm cùng lúc trên: `ID`, `Name`, `Manufacturer`, `Model`, `Serial`...
- Câu lệnh SQL động sử dụng `OR` để quét trên danh sách cột cấu hình.

### 3.3. Bảo toàn dữ liệu (Audit & Null Handling)
- **Audit Columns**: Luôn trả về `createdAt`, `createdById`, `modifiedAt`, `modifiedById` trong API Detail.
- **Null Safety**: Phương thức `toDetail` đảm bảo trả về đầy đủ các cột (ngay cả khi giá trị là `null`) để client đồng bộ giao diện.

---

## 4. HỆ THỐNG API V2

| Endpoint | Method | Chức năng | Option chính |
| :--- | :--- | :--- | :--- |
| `/v2/lab-skus` | GET/POST | Quản lý danh mục | `list`, `detail` |
| `/v2/lab-inventories` | GET | Tra cứu kho | `list`, `detail`, `full` |
| `/v2/lab-inventories` | POST | Khai báo máy/Nhập kho | `create`, `update` |
| `/v2/asset-activity-logs` | POST | Ghi nhật ký sử dụng | `create` |

---

## 5. QUY CHUẨN ĐẶT MÃ (NAMING CONVENTION)

1. **ID Prefix**:
   - SKU: `SKU_` (Ví dụ: `SKU_ABC123`)
   - Inventory: `INV_` (Ví dụ: `INV_EQ001`)
   - Logs: `LOG_` (Ví dụ: `LOG_XY123`)
2. **ID Length**: Sử dụng `RANDOM_SAFE_CAPS(6)` cho tính duy nhất cao.

---
_Tài liệu này đóng vai trò là hướng dẫn kỹ thuật chính cho Phân hệ Lab Inventory kể từ phiên bản 2.0._
