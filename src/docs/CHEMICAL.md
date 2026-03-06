Để đáp ứng yêu cầu của bạn, tôi đã chuẩn hóa lại toàn bộ **Tên Bảng (Số nhiều, camelCase, mang đậm tính chất kho hóa chất)**, **Khóa chính (PK: `<tên_bảng_số_ít>Id`)**, **Bảng nối (dùng `_`)**, đồng thời bổ sung toàn bộ các cột chi tiết cho Nhà cung cấp, Tồn kho (COA, Hãng SX, Trạng thái khắt khe) và làm "phẳng" hoàn toàn bảng Lịch sử giao dịch để **in phiếu xuất/nhập kho trực tiếp (O(1) query)**.

Dưới đây là **Bản Thiết Kế Cơ Sở Dữ Liệu Hoàn Chỉnh (Database Schema Final Version)** cho LIMS - Chemical Inventory.

---

# PHẦN 1: TỪ ĐIỂN DỮ LIỆU & QUY TẮC ĐẶT TÊN

- **Tên bảng:** Số nhiều, `camelCase` (VD: `chemicalSkus`, `chemicalInventories`).
- **Khóa chính (PK):** Dạng `<tên_bảng_số_ít>Id` (VD: `chemicalSkuId`, `chemicalInventoryId`).
- **Khóa ngoại (FK):** Trỏ trực tiếp đến PK của bảng liên kết.
- **Bảng nối (Join Table):** Kết nối bằng dấu gạch dưới `_` (VD: `chemicalSku_chemicalSupplier`).

---

# PHẦN 2: CHI TIẾT CÁC BẢNG (TABLE SCHEMA)

## MODULE 1: INVENTORY MASTER DATA (Danh mục Kho Hóa Chất)

### 1. Bảng `chemicalSkus` (Danh mục Hóa chất Master)

_Chứa thông tin lõi của hóa chất (SKU), không phụ thuộc vào Hãng hay Nhà cung cấp._

| Column Name                 | Type      | Key    | Description                                                  |
| :-------------------------- | :-------- | :----- | :----------------------------------------------------------- |
| `chemicalSkuId`             | `text`    | **PK** | Mã gốc hóa chất (VD: `CHEM-HNO3`).                           |
| `chemicalName`              | `text`    |        | Tên gọi hóa chất (VD: `Axit Nitric 65%`).                    |
| `chemicalCASNumber`         | `text`    |        | Số CAS.                                                      |
| `chemicalBaseUnit`          | `text`    |        | Đơn vị lưu kho cơ bản (VD: `ml`, `g`).                       |
| `chemicalTotalAvailableQty` | `numeric` |        | Tổng tồn kho khả dụng hiện tại (Tự động cộng dồn từ các lọ). |
| `chemicalReorderLevel`      | `numeric` |        | Mức tồn kho tối thiểu để cảnh báo Mua hàng (PR).             |
| `chemicalHazardClass`       | `text`    |        | Phân loại độc hại (VD: `Flammable`, `Toxic`, `Corrosive`).   |

### 2. Bảng `chemicalSuppliers` (Danh mục Nhà cung cấp)

_Quản lý hồ sơ, thông tin liên hệ và năng lực của Nhà cung cấp (Audit GLP/ISO)._

| Column Name                 | Type      | Key    | Description                                                                                                                   |
| :-------------------------- | :-------- | :----- | :---------------------------------------------------------------------------------------------------------------------------- |
| `chemicalSupplierId`        | `text`    | **PK** | Mã Nhà cung cấp (VD: `SUP-001`).                                                                                              |
| `supplierName`              | `text`    |        | Tên pháp nhân nhà cung cấp.                                                                                                   |
| `supplierTaxCode`           | `text`    |        | Mã số thuế.                                                                                                                   |
| `supplierAddress`           | `text`    |        | Địa chỉ trụ sở / kho xuất hàng.                                                                                               |
| `supplierContactPerson`     | `JSONB[]` |        | Tên người đại diện kinh doanh. `[{"contactName": "John Doe", "contactPhone": "0123456789", "contactEmail": "EMAIL_ADDRESS"}]` |
| `supplierStatus`            | `text`    |        | `Active` (Hoạt động), `Inactive` (Ngưng), `Blacklisted` (Cấm mua do vi phạm).                                                 |
| `supplierEvaluationScore`   | `numeric` |        | Điểm đánh giá chất lượng NCC định kỳ (0 - 100).                                                                               |
| `supplierIsoCertifications` | `jsonb`   |        | Mảng chứng chỉ: `["ISO 9001:2015", "ISO 17034"]`.                                                                             |

### 3. Bảng `chemicalSku_chemicalSupplier` (Bảng nối: Ai bán Hóa chất gì)

_Map giữa SKU và NCC, kèm theo quy cách đóng gói và mã Catalog của hãng._

| Column Name                      | Type      | Key    | Description                                             |
| :------------------------------- | :-------- | :----- | :------------------------------------------------------ |
| `chemicalSku_chemicalSupplierId` | `text`    | **PK** | ID bản ghi.                                             |
| `chemicalSkuId`                  | `text`    | **FK** | Tham chiếu `chemicalSkus`.                              |
| `chemicalSupplierId`             | `text`    | **FK** | Tham chiếu `chemicalSuppliers`.                         |
| `catalogNumber`                  | `text`    |        | Mã Catalog của hãng (VD: `1.00456.1000`).               |
| `brandManufacturer`              | `text`    |        | Hãng sản xuất (VD: `Merck`, `Sigma Aldrich`, `Xilong`). |
| `packagingSize`                  | `numeric` |        | Quy cách đóng gói (VD: `500` hoặc `1000`).              |
| `leadTimeDays`                   | `int`     |        | Thời gian giao hàng dự kiến (Tính từ lúc đặt PO).       |

---

## MODULE 2: WAREHOUSE OPERATIONS (Vận hành Tồn kho vật lý)

### 4. Bảng `chemicalInventories` (Tồn kho thực tế - Từng chai/lọ)

_Quản lý vòng đời khắt khe của từng chai hóa chất từ lúc nhập kho đến lúc tiêu hủy._

| Column Name               | Type      | Key    | Description                                                                                                                                                 |
| :------------------------ | :-------- | :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chemicalInventoryId`     | `text`    | **PK** | Mã Barcode/QR duy nhất dán trên chai (VD: `BTL-2603-001`).                                                                                                  |
| `chemicalSkuId`           | `text`    | **FK** | Mã SKU hóa chất.                                                                                                                                            |
| `chemicalName`            | `text`    |        | **[Snapshot]** Tên hóa chất tại thời điểm nhập (Giảm join).                                                                                                 |
| `chemicalCASNumber`       | `text`    |        | **[Snapshot]** Số CAS hóa chất tại thời điểm nhập.                                                                                                          |
| `chemicalSupplierId`      | `text`    | **FK** | Mua từ Nhà cung cấp nào.                                                                                                                                    |
| `lotNumber`               | `text`    |        | Số Lô (Lot/Batch) in trên nhãn chai.                                                                                                                        |
| `manufacturerName`        | `text`    |        | Hãng sản xuất trực tiếp của chai này.                                                                                                                       |
| `manufacturerCountry`     | `text`    |        | Nước sản xuất (VD: `Germany`, `China`).                                                                                                                     |
| `inventoryCOADocumentIds` | `text[]`  |        | Mảng chứa các ID/URL file chứng nhận COA của lô này.                                                                                                        |
| `currentAvailableQty`     | `numeric` |        | Số lượng khả dụng hiện tại (Thể tích/Khối lượng còn lại).                                                                                                   |
| `mfgDate`                 | `date`    |        | Ngày sản xuất (Manufacturing Date).                                                                                                                         |
| `expDate`                 | `date`    |        | Ngày hết hạn in trên nhãn (Sử dụng cho thuật toán FEFO).                                                                                                    |
| `openedDate`              | `date`    |        | Ngày mở nắp chai lần đầu.                                                                                                                                   |
| `openedExpDate`           | `date`    |        | Hạn sử dụng sau khi mở nắp (VD: Mở ra chỉ được dùng trong 6 tháng).                                                                                         |
| `chemicalInventoryStatus` | `text`    |        | Trạng thái: `Quarantined` (Đang chờ test đầu vào), `New` (Chưa bóc tem), `InUse` (Đang dùng), `Empty` (Hết), `Expired` (Hết hạn), `Disposed` (Đã tiêu hủy). |
| `storageBinLocation`      | `text`    |        | Vị trí lưu trữ thực tế (VD: `Tủ hóa chất A - Tầng 2`).                                                                                                      |

### 5. Bảng `chemicalTransactionBlocks` (Phiếu Giao Dịch - Header)

_Chứa thông tin chung của 1 lần thao tác tại kho (1 Phiếu in ra)._

| Column Name                      | Type        | Key    | Description                                                                      |
| :------------------------------- | :---------- | :----- | :------------------------------------------------------------------------------- |
| `chemicalTransactionBlockId`     | `text`      | **PK** | Mã Phiếu (VD: `TRB_2603_01`).                                                    |
| `transactionType`                | `text`      |        | `IMPORT` (Nhập), `EXPORT` (Xuất), `ADJUSTMENT` (Điều chỉnh).                     |
| `chemicalTransactionBlockStatus` | `text`      |        | **[MỚI]** Trạng thái Phiếu: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`. |
| `referenceDocument`              | `text`      |        | Số Yêu cầu / PO tham chiếu.                                                      |
| `createdBy`                      | `text`      |        | Người tạo phiếu.                                                                 |
| `createdAt`                      | `timestamp` |        | Thời gian tạo.                                                                   |
| `approvedBy`                     | `text`      |        | **[MỚI]** Người duyệt phiếu.                                                     |
| `approvedAt`                     | `timestamp` |        | **[MỚI]** Thời gian duyệt.                                                       |

### 6. Bảng `chemicalTransactionBlockDetails` (Chi tiết Yêu cầu - BẢNG TẠM CHỜ DUYỆT)

_Lưu dữ liệu mà thuật toán gợi ý hoặc KTV xin xuất/nhập, nhưng CHƯA TÁC ĐỘNG VÀO KHO._

| Column Name                          | Type      | Key    | Description                                  |
| :----------------------------------- | :-------- | :----- | :------------------------------------------- |
| `chemicalTransactionBlockDetailId`   | `text`    | **PK** | Mã dòng chi tiết tạm.                        |
| `chemicalTransactionBlockId`         | `text`    | **FK** | Thuộc Phiếu nào.                             |
| `actionType`                         | `text`    |        | `INITIAL_ISSUE`, `SUPPLEMENTAL`, `RETURN`... |
| `chemicalSkuId`                      | `text`    | **FK** | Mã SKU.                                      |
| `chemicalName`                       | `text`    |        | Tên Hóa chất.                                |
| `casNumber`                          | `text`    |        | Số CAS.                                      |
| `chemicalInventoryId`                | `text`    | **FK** | **Dự kiến** bốc chai/lọ nào.                 |
| `changeQty`                          | `numeric` |        | **Dự kiến** thay đổi bao nhiêu.              |
| `chemicalTransactionBlockDetailUnit` | `text`    |        | Đơn vị tính.                                 |
| `parameterName`                      | `text`    |        | Xuất ra cho Phép thử nào.                    |
| `analysisId`                         | `text`    | **FK** | Phục vụ mã chỉ tiêu thực hiện nào.           |
| `chemicalTransactionBlockDetailNote` | `text`    |        | Ghi chú.                                     |

### 7. Bảng `chemicalTransactions` (Lịch sử giao dịch chính thức - LEDGER)

_Chỉ sinh ra dữ liệu khi Phiếu ở trạng thái APPROVED. Đây là Sổ cái không thể xóa sửa._

| Column Name                  | Type      | Key    | Description                                                                                                                         |
| :--------------------------- | :-------- | :----- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `chemicalTransactionId`      | `text`    | **PK** | Mã dòng giao dịch (VD: `TXN_99901`).                                                                                                |
| `chemicalTransactionBlockId` | `text`    | **FK** | Thuộc Phiếu Nhập/Xuất nào (`chemicalTransactionBlocks`).                                                                            |
| `actionType`                 | `text`    |        | Loại hành động: `INITIAL_ISSUE` (Cấp mới), `SUPPLEMENTAL` (Xin thêm), `RETURN` (Trả lại), `WASTE` (Đổ bỏ), `IMPORT_NEW` (Nhập mới). |
| `chemicalSkuId`              | `text`    | **FK** | **[Dữ liệu Phiếu]** Mã SKU Hóa chất.                                                                                                |
| `chemicalName`               | `text`    |        | **[Dữ liệu Phiếu - Snapshot]** Tên Hóa chất.                                                                                        |
| `casNumber`                  | `text`    |        | **[Dữ liệu Phiếu - Snapshot]** Số CAS.                                                                                              |
| `chemicalInventoryId`        | `text`    | **FK** | **[Dữ liệu Phiếu]** Mã Vật tư kho (Chai/Lọ bị tác động).                                                                            |
| `changeQty`                  | `numeric` |        | **[Dữ liệu Phiếu]** Số lượng thay đổi (Âm = Xuất/Đổ bỏ, Dương = Nhập/Trả lại).                                                      |
| `chemicalTransactionUnit`    | `text`    |        | **[Snapshot]** Đơn vị tính (`ml`, `g`).                                                                                             |
| `parameterName`              | `text`    |        | **[Snapshot]** Xuất ra cho Phép thử / Phương pháp nào. (Để trống nếu là Phiếu Nhập).                                                |
| `analysisId`                 | `text`    | **FK** | **[Dữ liệu Phiếu]** Mã chỉ tiêu thực hiện liên kết (`analyses`). (Tách dòng rõ ràng 1-1).                                           |
| `chemicalTransactionNote`    | `text`    |        | Ghi chú (VD: "Xuất bù do KTV làm đổ", "Nhập hàng theo PO").                                                                         |

---

## MODULE 3: INVENTORY AUDIT (Kiểm kê kho)

### 8. Bảng `chemicalAuditBlocks` (Phiếu Kiểm Kê - Header)

| Column Name                  | Type        | Key    | Description                                                                                             |
| :--------------------------- | :---------- | :----- | :------------------------------------------------------------------------------------------------------ |
| `chemicalAuditBlockId`       | `text`      | **PK** | Mã phiếu kiểm kê (VD: `AUD_2603_01`).                                                                   |
| `auditName`                  | `text`      |        | Tên kỳ kiểm kê (VD: `Kiểm kê kho hóa chất Q1/2026`).                                                    |
| `auditScope`                 | `text`      |        | Phạm vi kiểm kê: `ALL`, `LOCATION`, `HAZARD_CLASS`, `SKU`.                                              |
| `auditScopeValue`            | `text`      |        | Giá trị tương ứng với Scope (VD: Chọn Location `Tủ A`).                                                 |
| `chemicalAuditBlockStatus`   | `text`      |        | **[Chuẩn hóa]** Trạng thái Phiếu: `DRAFT`, `IN_PROGRESS`, `PENDING_APPROVAL`, `COMPLETED`, `CANCELLED`. |
| `chemicalTransactionBlockId` | `text`      | **FK** | **[Chuẩn hóa]** Tham chiếu đến mã Phiếu giao dịch tự động sinh ra khi duyệt chênh lệch.                 |
| `assignedTo`                 | `text`      |        | User ID của nhân viên được giao đi kiểm kê.                                                             |
| `createdBy`                  | `text`      |        | Người tạo phiếu.                                                                                        |
| `createdAt`                  | `timestamp` |        | Thời gian tạo (Lúc này hệ thống sẽ snapshot dữ liệu).                                                   |
| `approvedBy`                 | `text`      |        | Người quản lý duyệt kết quả kiểm kê.                                                                    |
| `approvedAt`                 | `timestamp` |        | Thời gian duyệt.                                                                                        |

### 9. Bảng `chemicalAuditDetails` (Chi tiết Kiểm Kê)

| Column Name                     | Type      | Key    | Description                                                                                                 |
| :------------------------------ | :-------- | :----- | :---------------------------------------------------------------------------------------------------------- |
| `chemicalAuditDetailId`         | `text`    | **PK** | Mã dòng chi tiết kiểm kê.                                                                                   |
| `chemicalAuditBlockId`          | `text`    | **FK** | Thuộc phiếu kiểm kê nào.                                                                                    |
| `chemicalSkuId`                 | `text`    | **FK** | Mã gốc hóa chất (Tham chiếu `chemicalSkus`).                                                                |
| `chemicalInventoryId`           | `text`    | **FK** | Mã Barcode của chai/lọ cụ thể (Tham chiếu `chemicalInventories`).                                           |
| `systemAvailableQty`            | `numeric` |        | **[Chuẩn hóa]** Số lượng trên hệ thống lúc bắt đầu kiểm kê (Lấy từ `currentAvailableQty`).                  |
| `systemChemicalInventoryStatus` | `text`    |        | **[Snapshot]** Trạng thái trên hệ thống (Lấy từ `chemicalInventoryStatus`).                                 |
| `actualAvailableQty`            | `numeric` |        | **[Chuẩn hóa]** Số lượng thực tế đếm/cân được ở kho.                                                        |
| `actualChemicalInventoryStatus` | `text`    |        | **[Chuẩn hóa]** Trạng thái thực tế khi KTV ghi nhận (`InUse`, `Disposed`...).                               |
| `varianceQty`                   | `numeric` |        | **Độ lệch** (`actualAvailableQty - systemAvailableQty`). >0 là Thừa, <0 là Thiếu, =0 là Khớp.               |
| `isScanned`                     | `boolean` |        | `true` nếu KTV đã quét mã vạch này bằng máy. Quản lý việc chai có trên hệ thống nhưng tìm không thấy ở kho. |
| `chemicalAuditDetailNote`       | `text`    |        | Ghi chú/Giải trình cho độ lệch (VD: "Bay hơi", "Đổ vỡ", "Hàng mượn chưa nhập hệ thống").                    |

---

## MODULE 4: LIMS CONFIG & OPERATIONS (Cấu hình & Thực thi Test)

### 10. Bảng `sampleTypes`, `parameters`, `protocols`, `matrices`

_(Giữ nguyên logic thiết kế ban đầu của bạn, chuẩn hóa lại tên)_

- **`sampleTypes`** (PK: `sampleTypeId`, Tên: `sampleTypeName`, ...)
- **`parameters`** (PK: `parameterId`, Tên: `parameterName`, ...)
- **`protocols`** (PK: `protocolId`, Mã: `protocolCode`, ...)
- **`matrices`** (PK: `matrixId` - Hub trung tâm kết nối).

### 11. Bảng `matrixChemicals` (Định mức BOM)

| Column Name        | Type      | Key    | Description                                |
| :----------------- | :-------- | :----- | :----------------------------------------- |
| `matrixChemicalId` | `text`    | **PK** | ID định mức.                               |
| `matrixId`         | `text`    | **FK** | Tham chiếu cấu hình Phép thử.              |
| `chemicalSkuId`    | `text`    | **FK** | Mã hóa chất cần tiêu hao (`chemicalSkus`). |
| `consumedQty`      | `numeric` |        | Số lượng tiêu hao tiêu chuẩn (BOM).        |
| `unit`             | `text`    |        | Đơn vị định mức.                           |

### 12. Bảng `analyses` (Phiếu thực thi Chỉ tiêu / Audit JSONB)

_Nơi lưu kết quả và Track trực tiếp lượng hóa chất KTV đã sử dụng mà không cần join với bảng Transactions._

| Column Name       | Type    | Key    | Description                                                                                                                                 |
| :---------------- | :------ | :----- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `analysisId`      | `text`  | **PK** | ID bài Test thực tế (VD: `ANL-2026-001`).                                                                                                   |
| `matrixId`        | `text`  | **FK** | Link tới `matrices`.                                                                                                                        |
| `analysisStatus`  | `text`  |        | Trạng thái: `Pending`, `HandedOver`, `Testing`, `Approved`.                                                                                 |
| `consumablesUsed` | `jsonb` |        | **[Audit Trail Kép]**: Mảng lưu vết lịch sử dùng hóa chất (Copy từ `chemicalTransactions` sang dạng JSON để hiển thị siêu tốc trên UI Lab). |
| `analysisResult`  | `text`  |        | Kết quả test đo được.                                                                                                                       |

---

### TỔNG KẾT LUỒNG DỮ LIỆU "XUẤT KHO IN PHIẾU" CÓ HAI PHẦN: CHI TIẾT VÀ TỔNG HỢP

Trên giao diện và nghiệp vụ in thông tin phiếu xuất/nhập, dữ liệu được quy hoạch thành 2 phần rõ rệt:

1. **Phần Chi Tiết (Details / Line Items)**
    - **Quan hệ:** `chemicalInventoryId` (1) : (1) `analysisId`.
    - Mật độ: Một chai/lọ hóa chất (`chemicalInventoryId`) có thể xuất hiện nhiều lần (thành nhiều dòng detail) nếu nó được xuất bù/cấp phát để chạy nhiều mã phân tích (`analysisId`) khác nhau.

2. **Phần Tổng Hợp (Summary)**
    - **Quan hệ:** `chemicalInventoryId` (unique) (1) : (n) `analysisId`.
    - Mỗi chai/lọ (`chemicalInventoryId`) chỉ xuất hiện 1 lần (`GROUP BY chemicalInventoryId`).
    - Số lượng giao dịch được cộng gộp (`SUM(changeQty)`) và mã phép thử được nối thành một mảng text/đoạn chuỗi (VD: "ANL-101, ANL-102") để in nhãn hoặc đối chiếu tổng quát cực nhanh.

**Ví dụ:** Yêu cầu xuất kho cho Bài Test Sắt (`ANL-101`) cần 15ml Axit và Bài Test Kẽm (`ANL-102`) cần 3ml Axit. Kho xuất cho cả 2 test từ cùng chai `BTL-A` (5ml và 3ml), riêng bài Sắt xuất bù thêm từ `BTL-B` 10ml.

Bảng `chemicalTransactions` sẽ ghi nhận (Phần chi tiết):

| chemicalTransactionId | actionType    | chemicalSkuId | chemicalInventoryId | changeQty | parameterName | analysisId |
| :-------------------- | :------------ | :------------ | :------------------ | :-------- | :------------ | :--------- |
| TXN-01                | INITIAL_ISSUE | ACID-01       | BTL-A               | -5        | Phân tích Sắt | ANL-101    |
| TXN-02                | INITIAL_ISSUE | ACID-01       | BTL-A               | -3        | Phân tích Kẽm | ANL-102    |
| TXN-03                | INITIAL_ISSUE | ACID-01       | BTL-B               | -10       | Phân tích Sắt | ANL-101    |

Phần in/hiển thị Phiếu Tổng hợp sẽ tự map (`GROUP BY`):

| chemicalInventoryId | chemicalSkuId | Các chỉ tiêu / Analyses | Tổng lượng giao dịch (changeQty) |
| :------------------ | :------------ | :---------------------- | :------------------------------- |
| BTL-A               | ACID-01       | ANL-101, ANL-102        | -8                               |
| BTL-B               | ACID-01       | ANL-101                 | -10                              |

**Ưu điểm cốt lõi của Database Schema và UI Workflow này:**

1. **Zero-Join cho Report:** In Phiếu Xuất, Phiếu Nhập không cần dùng lệnh JOIN phức tạp (Giảm tải DB tối đa).
2. **GLP/17025 Compliance:** Quản lý được COA, Ngày mở nắp, Hãng sản xuất thực tế trên từng lọ nhỏ.
3. **Flexible Routing:** Hành động trả lại, xin thêm, đổ bỏ rác thải được phân loại tường minh qua `actionType`. Không bị lẫn lộn giữa luồng kiểm kê và luồng tiêu hao phòng Lab.
