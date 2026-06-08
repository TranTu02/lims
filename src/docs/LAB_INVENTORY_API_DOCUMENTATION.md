# LAB INVENTORY API DOCUMENTATION (EQUIPMENT & LOGS)

_Tài liệu hướng dẫn sử dụng API phân hệ Lab Inventory mới (Quản lý Thiết bị & Nhật ký hoạt động)._

## I. THÔNG TIN CHUNG

- **Schema Database**: `labInventories`
- **Module**: `equipmentEntities.js` / Node-RED Group `LAB INVENTORIES`
- **Base URL**: `https://red.irdop.org/v2/`

---

## II. MA TRẬN API RESOURCE

| Resource                | Endpoint                  | Mô tả                                       |
| :---------------------- | :------------------------ | :------------------------------------------ |
| **Equipments**          | `/v2/equipments`          | Quản lý thông tin thiết bị phòng thí nghiệm |
| **Equipment Logs**      | `/v2/equipmentLogs`       | Nhật ký sử dụng, bảo dưỡng, hiệu chuẩn.    |

---

## III. MA TRẬN PHÂN QUYỀN (POLICIES & ROLES)

### 1. Chính sách Phân quyền & Ràng buộc Nghiệp vụ
- **Equipments (Quản lý Thiết bị)**:
  - **Create / Update / Delete**: Chỉ cho phép người dùng có vai trò `ROLE_SUPER_ADMIN` thực hiện.
  - **Read (List / Detail / Full)**:
    - Quản lý thiết bị (`ROLE_EQUIPMENT_MGR`) hoặc Quản trị viên (`ROLE_SUPER_ADMIN`) có toàn quyền.
    - Kỹ thuật viên (`ROLE_TECHNICIAN`) và Kiểm soát viên (`ROLE_VALIDATOR`) có quyền đọc để phục vụ vận hành.

- **Equipment Logs (Nhật ký Thiết bị)**:
  - **Create (Write) & Read**: Cho phép mọi người dùng thuộc nhóm kỹ thuật (`ROLE_TECHNICIAN`, `ROLE_VALIDATOR`, `ROLE_EQUIPMENT_MGR`, `ROLE_SUPER_ADMIN`) thực hiện.
  - **Update**: **Bị chặn hoàn toàn**. Không cho phép bất kỳ ai (kể cả Admin) chỉnh sửa nhật ký thiết bị để đảm bảo tính minh bạch theo ISO 17025.
  - **Ràng buộc Truy cập (Get List)**: Khi gọi API lấy danh sách nhật ký (`/v2/equipmentLogs/get/list`), hệ thống luôn tự động lọc để người gửi yêu cầu chỉ thấy nhật ký của những thiết bị mà họ được phân công phụ trách (ID của họ nằm trong `identityChargeIds` của thiết bị đó). Ngoại lệ duy nhất là `ROLE_SUPER_ADMIN` sẽ thấy toàn bộ nhật ký.

---

## IV. CHI TIẾT ENDPOINTS

### 1. Equipments (Thiết bị) - `/v2/equipments`

#### **GET /get/list**
Lấy danh sách thiết bị.

- **Query Params**:
  - `page` (number, default: 1)
  - `itemsPerPage` (number, default: 20)
  - `search` (string): Tìm kiếm theo ID thiết bị, tên, hãng sản xuất, model.
- **Response**:
  ```json
  {
      "success": true,
      "statusCode": 200,
      "data": [
          {
              "equipmentId": "EQ_A1B2C3",
              "equipmentName": "Máy sắc ký lỏng HPLC Agilent 1260",
              "equipmentManufactuer": "Agilent Technologies",
              "equipmentModel": "1260 Infinity II",
              "equipmentLastCalibration": "2026-05-15T08:00:00.000Z",
              "identityChargeIds": ["ID_USER_001"],
              "createdAt": "2026-03-24T09:00:00.000Z"
          }
      ],
      "pagination": {
          "page": 1,
          "itemsPerPage": 20,
          "totalItems": 12,
          "totalPages": 1
      },
      "error": null
  }
  ```

#### **GET /get/technicians**
Lấy danh sách nhân viên kỹ thuật có quyền thực hiện thử nghiệm (ROLE_TECHNICIAN) đang hoạt động.

- **Response**:
  ```json
  {
      "success": true,
      "statusCode": 200,
      "data": [
          {
              "identityId": "ID_USER_001",
              "identityName": "Nguyễn Văn A",
              "identityRoles": ["ROLE_TECHNICIAN"]
          }
      ],
      "pagination": null,
      "error": null
  }
  ```

#### **GET /get/detail**
Lấy thông tin chi tiết một thiết bị.

- **Query Params**:
  - `id` hoặc `equipmentId` (bắt buộc)

---

#### **GET /get/full**
Lấy chi tiết thiết bị kèm theo snapshot danh sách các tài liệu liên quan (`documents`), lịch sử nhật ký vận hành (`logs`), và thông tin chi tiết người phụ trách (`availableBy` snapshot).

- **Query Params**:
  - `id` hoặc `equipmentId` (bắt buộc)
- **Response Data Structure**:
  ```json
  {
      "success": true,
      "statusCode": 200,
      "data": {
          "equipmentId": "EQ_A1B2C3",
          "equipmentName": "Máy sắc ký lỏng HPLC Agilent 1260",
          "equipmentManufactuer": "Agilent Technologies",
          "equipmentModel": "1260 Infinity II",
          "equipmentSpecification": "Hệ thống bơm Quaternary, đầu dò DAD, dải bước sóng 190-950nm.",
          "equipmentLastCalibration": "2026-05-15T08:00:00.000Z",
          "equipmentDocumentIds": ["DOC_CALIB_01"],
          "identityChargeIds": ["ID_USER_001"],
          "createdAt": "2026-03-24T09:00:00.000Z",
          "availableBy": [
              {
                  "identityId": "ID_USER_001",
                  "identityName": "Nguyễn Văn A"
              }
          ],
          "documents": [
              {
                  "documentId": "DOC_CALIB_01",
                  "documentTitle": "Giấy chứng nhận hiệu chuẩn HPLC 2026",
                  "fileId": "FL_XYZ123"
              }
          ],
          "logs": [
              {
                  "equipmentLogId": "EL_Z9Y8X7",
                  "equipmentId": "EQ_A1B2C3",
                  "equipmentLogType": "Usage",
                  "equipmentLogDescription": "KTV chạy phân tích mẫu Vitamin C",
                  "equipmentLogLocation": "Phòng Hóa lý 1",
                  "actionTime": "2026-06-05T02:30:00.000Z"
              }
          ]
      },
      "pagination": null,
      "error": null
  }
  ```

#### **POST /create** *(Yêu cầu quyền ROLE_SUPER_ADMIN)*
Khai báo/Tạo mới thiết bị.

#### **POST /update** *(Yêu cầu quyền ROLE_SUPER_ADMIN)*
Cập nhật thông tin thiết bị.

#### **POST /delete** *(Yêu cầu quyền ROLE_SUPER_ADMIN)*
Xóa thiết bị (Soft Delete).

---

### 2. Equipment Logs (Nhật ký Thiết bị) - `/v2/equipmentLogs`

#### **GET /get/list** *(Chỉ dành cho KTV phụ trách hoặc Admin)*
Lấy danh sách nhật ký hoạt động thiết bị. Lọc tự động dựa trên `identityId` người gửi yêu cầu.

- **Query Params**:
  - `equipmentId`: Lọc nhật ký của thiết bị cụ thể.
  - `equipmentLogType`: `Usage`, `Maintenance`, `Calibration`, `Incident`.

#### **GET /get/detail** *(Chỉ dành cho KTV phụ trách hoặc Admin)*
Lấy chi tiết bản ghi nhật ký.

#### **POST /create** *(Yêu cầu role TECHNICIAN hoặc cao hơn)*
Tạo nhật ký hoạt động mới cho thiết bị.

- **Request Body**:
  - `equipmentId` (bắt buộc, string)
  - `equipmentLogType` (bắt buộc, string)
  - `equipmentLogDescription` (string)
  - `equipmentLogLocation` (string)
  - `equipmentLogData` (jsonb)
  - `commonKeys` (text[])
  - `actionTime` (timestamp)

#### **POST /update** *(BỊ CẤM)*
- Luôn trả về mã lỗi **403 Forbidden** kèm thông báo `"Updates to equipment logs are not allowed."`.

---

## V. QUY TẮC MÃ ID (NAMING CONVENTION)

- **Equipment**: `EQ_[RANDOM_6_CAPS]` (Ví dụ: `EQ_HPL126`).
- **Equipment Log**: `EL_[RANDOM_6_CAPS]` (Ví dụ: `EL_Z9Y8X7`).

---
_Cập nhật lần cuối: 2026-06-06_
