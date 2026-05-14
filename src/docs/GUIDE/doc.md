# PHẦN 1: PHÂN TÍCH NGHIỆP VỤ (BUSINESS ANALYSIS)

## 1.1. DANH MỤC VỊ TRÍ VÀ HỆ THỐNG PHÂN QUYỀN (RBAC)

Hệ thống sử dụng mô hình phân quyền dựa trên vai trò (Role-Based Access Control) để kiểm soát chặt chẽ phạm vi tiếp cận dữ liệu.

### 1.1.1. Nhóm Lãnh đạo & Quản lý Thượng tầng

| Chức vụ                | System Role Key     | Quyền hạn cốt lõi                                                                                         |
| ---------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| **Giám đốc Lab**       | `ROLE_DIRECTOR`     | Ký duyệt báo cáo/hợp đồng lớn. Xem Dashboard tổng thể. Không sửa kết quả kỹ thuật.                        |
| **Quản lý Kỹ thuật**   | `ROLE_TECH_MANAGER` | Phê duyệt phương pháp, cấu hình Thư viện (`library.protocols`, `library.matrices`). Xử lý sự cố kỹ thuật. |
| **Quản lý Chất lượng** | `ROLE_QA_MANAGER`   | Quản lý tuân thủ, hồ sơ NC (`qa.nc`), rủi ro (`system.risks`). Truy cập `audit_logs` toàn hệ thống.       |

### 1.1.2. Khối Vận hành Kỹ thuật & Sản xuất dữ liệu

| Chức vụ                 | System Role Key         | Quyền hạn cốt lõi                                                                    |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| **Trưởng bộ phận**      | `ROLE_SECTION_HEAD`     | Phân công mẫu cho KTV (`Assigning`). Duyệt sơ bộ kết quả phòng ban.                  |
| **Kiểm soát viên (QC)** | `ROLE_VALIDATOR`        | Soát xét dữ liệu thô (Raw data). Quyền **Trả lại (Reject)** kết quả yêu cầu làm lại. |
| **KTV Chính/KTV**       | `ROLE_TECHNICIAN`       | **Nhập liệu kết quả**, thực hiện phép thử. **Bị giới hạn bởi chính sách "Mẫu mù"**.  |
| **Nhân viên IPC/R&D**   | `ROLE_IPC` / `ROLE_RND` | Lấy mẫu hiện trường, thử nghiệm nhanh, phát triển phương pháp mới (Sandbox).         |

### 1.1.3. Khối Quản lý Mẫu, Hậu cần & Kinh doanh

| Chức vụ                | System Role Key                       | Quyền hạn cốt lõi                                                       |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| **Nhân viên nhận mẫu** | `ROLE_RECEPTIONIST`                   | Tiếp nhận hồ sơ, mã hóa mẫu (TNM, SP), in Barcode/QR. Số hóa hồ sơ.     |
| **Thủ kho mẫu/Vật tư** | `ROLE_SAMPLE_CUSTODIAN`               | Quản lý kho lưu/hủy mẫu. Quản lý hóa chất đến từng vật chứa nhỏ nhất.   |
| **Kinh doanh/Kế toán** | `ROLE_SALES_EXEC` / `ROLE_ACCOUNTANT` | Quản lý báo giá, đơn hàng. Xác nhận thanh toán, xuất hóa đơn tài chính. |

---

## 1.2. QUY TRÌNH NGHIỆP VỤ & LUỒNG XỬ LÝ (WORKFLOWS)

### 1.2.1. Tiếp nhận Khách hàng & Kinh doanh

- **Bước 1:** Khách hàng mới -> Kiểm tra MST -> Thêm vào `crm.clients`.
- **Bước 2:** `SALES` tạo Báo giá/Đơn hàng -> Gửi khách.
- **Bước 3:** Khách chốt -> Hệ thống xuất Form "Phiếu gửi mẫu" cho khách điền và ký xác nhận.
- **Bước 4 (Kế toán):** Kiểm tra biến động số dư -> Khớp mã đơn hàng -> Cập nhật trạng thái `Paid` -> Xuất hóa đơn.

### 1.2.2. Tiếp nhận & Mã hóa mẫu (Gatekeeping)

- **Điều kiện:** Chỉ tiếp nhận khi có đủ: Đơn hàng + Phiếu gửi mẫu ký (bản mềm/cứng) + Mẫu thực tế + Xác nhận thanh toán.
- **Xử lý ngoại lệ 1:** Hồ sơ thiếu/Mẫu sai quy chuẩn -> Chuyển trạng thái `Pending` -> Thông báo `CS/Sales` liên hệ khách.
- **Xử lý ngoại lệ 2:** Phát sinh vấn đề thông tin mẫu khi đang nhập liệu -> Liên hệ bộ phận Kỹ thuật xử lý.
- **Mã hóa:** Hệ thống tự động sinh mã quản lý nội bộ để triển khai bước tiếp theo.

### 1.2.3. Bàn giao & Thực hiện Thử nghiệm

- **Bàn giao:** Phân tách mẫu (Aliquot) theo chỉ tiêu -> Xuất biên bản bàn giao -> Lưu hồ sơ gốc tại vị trí quy định.
- **Chuẩn bị:** `TECHNICIAN` mở Nhật ký thử nghiệm (e-Logbook) theo mẫu quy định.
- **Thực hiện:** Ghi chép dữ liệu thô, thiết bị, hóa chất (lô/hạn). Báo cáo ngay các sự không phù hợp (NC).

### 1.2.4. Kiểm soát, Xuất kết quả & Xử lý NC

- **Kiểm soát:** `VALIDATOR` đối chiếu Nhật ký và kết quả.
- **Xử lý ngoại lệ 3:** Phát hiện sai lệch -> Phối hợp bộ phận liên quan đưa ra phương án (Thử lại/Hủy mẫu).
- **Trả kết quả:** Yêu cầu đủ hồ sơ/kết quả -> Xuất Phiếu kết quả -> Ký số/Đóng dấu -> Gửi khách (Email/Chuyển phát).

---

## 1.3. QUY TẮC ĐẢM BẢO CHẤT LƯỢNG & BẢO MẬT (QUY TẮC VÀNG)

Đây là 2 tính năng "xương sống" để nắn chỉnh lại phần mềm theo tiêu chuẩn ISO 17025.

### 1.3.1. Tính năng "Mẫu mù" (Blind Sample Policy)

Nhằm đảm bảo tính khách quan tối đa trong phân tích kỹ thuật:

- **Đối tượng áp dụng:** `ROLE_TECHNICIAN`, `ROLE_SENIOR_ANALYST`.
- **Cơ chế:** Khi KTV truy cập vào danh sách mẫu được phân công hoặc màn hình nhập kết quả:
- **ẨN:** Tên khách hàng, Địa chỉ, Tên thương mại của sản phẩm (nếu cần bảo mật).
- **HIỂN THỊ:** Chỉ nhìn thấy **Mã mẫu nội bộ (Sample ID)**, Loại mẫu, Chỉ tiêu cần thực hiện và Phương pháp thử.

- **Mục đích:** KTV không biết mẫu này của khách hàng nào để tránh việc can thiệp kết quả vì lý do cá nhân hoặc kinh tế.

### 1.3.2. Vết kiểm toán (Audit Trail System)

Đảm bảo tính toàn vẹn và không thể chối bỏ của dữ liệu (Data Integrity).

- **Phạm vi:** Áp dụng cho mọi hành động thay đổi dữ liệu, đặc biệt là **Kết quả phép thử (`resultValue`)** và **Trạng thái đơn hàng (`status`)**.
- **Thông tin bắt buộc ghi lại (Logs):**

1. **Who:** Người thực hiện thay đổi (Username/Role).
2. **When:** Thời gian chính xác (Timestamp).
3. **Where:** Vị trí/Module thực hiện.
4. **Old Value:** Giá trị cũ trước khi sửa.
5. **New Value:** Giá trị mới sau khi sửa.
6. **Reason:** Lý do thay đổi (Bắt buộc nhập qua Popup nếu sửa kết quả đã lưu).

- **Quy định:** `Audit logs` chỉ được phép **Xem (`Read-only`)** bởi `ROLE_QA_MANAGER` và `ROLE_SUPER_ADMIN`, tuyệt đối không có chức năng Sửa/Xóa log.

---

**Đối chiếu Quy chuẩn tham khảo:**

- **ISO/IEC 17025:2017:** Mục 7.5 (Ghi chép kỹ thuật) và Mục 7.11 (Quản lý dữ liệu và kiểm soát thông tin).
- **ISO 27001:** Kiểm soát truy cập và Bảo mật thông tin khách hàng.

---

# PHẦN 2: THIẾT KẾ DỮ LIỆU & CÁC LUỒNG XỬ LÝ (TECHNICAL DESIGN)

## 2.1. CHIẾN LƯỢC LƯU TRỮ & KIẾN TRÚC DB

Hệ thống sử dụng **PostgreSQL 16+** với mô hình **Multi-tenancy (Schema-per-Tenant)** để đảm bảo tính cô lập dữ liệu cho mô hình SaaS.

- **Quy tắc định danh:** Table (số nhiều, `camelCase`), Column (`camelCase`), Foreign Key (`tableName` số ít + `Id`).
- **Dữ liệu bất biến (Snapshots):** Sử dụng các cột `jsonb` để lưu Snapshot thông tin Khách hàng, Giá và Phương pháp tại thời điểm tạo Đơn hàng/Phiếu nhận để tránh sai lệch dữ liệu khi danh mục Master Data thay đổi.
- **Kiểm soát xóa:** Áp dụng **Soft Delete** (`deletedAt`) cho toàn bộ bảng nghiệp vụ.

## 2.2. CHI TIẾT CÁC LUỒNG XỬ LÝ DỮ LIỆU (DETAILED DATA FLOWS)

### 2.2.1. Luồng Giai đoạn 1: Thương mại & Khởi tạo (Commercial Flow)

- **Bước 1 (CRM):** Khách hàng mới -> Kiểm tra MST qua API -> INSERT `crm.clients`.
- **Bước 2 (Quote):** Sales chọn chỉ tiêu từ `library.matrices` -> Hệ thống thực hiện Snapshot giá/phương pháp vào cột `samples` (jsonb) của `crm.quotes`.
- **Bước 3 (Order):** Approved Quote -> INSERT `crm.orders`.
- **Bước 4 (Finance):** Bank Data đẩy vào `crm.transactions` -> Kế toán gạch nợ -> Cập nhật `crm.orders.paymentStatus = 'Paid'`.

### 2.2.2. Luồng Giai đoạn 2: Tiếp nhận & Mã hóa (Pre-Analytical Flow)

- **Hành động:** `RECEPTIONIST` kích hoạt lệnh "Tạo hồ sơ tiếp nhận" từ một `orderId` đã thanh toán.
- **Atomic Database Transaction:** Hệ thống thực hiện INSERT đồng thời vào 3 bảng để đảm bảo toàn vẹn:

1. `lab.receipts`: Sinh mã `receiptCode` (Ví dụ: TNM26A23001).
2. `lab.samples`: Sinh mã `sampleId` (Ví dụ: SP26A23001-001). Thực hiện **Data Masking** nếu `isBlindCoded = true`.
3. `lab.analyses`: Copy dữ liệu chỉ tiêu từ Đơn hàng sang từng dòng phép thử.

- **Side Effect:** Trigger sinh vận đơn `service.shipments` (nếu khách yêu cầu gửi mẫu qua bưu điện).

### 2.2.3. Luồng Giai đoạn 3: Phân công & Quản lý Vật tư (Resource Flow)

- **Assign:** `SECTION_HEAD` cập nhật `technicianId` trong `lab.analyses`.
- **BOM Logic:** Hệ thống tính toán lượng hóa chất cần thiết dựa trên `library.matrices.chemicals`.
- **Inventory Trace:** 1. KTV tạo phiếu `chemicalTransactionBlocks` (Type: `EXPORT`).

2.  Approved -> INSERT `chemicalTransactions` (Sổ cái) -> UPDATE `currentAvailableQty` trong `chemicalInventories`.
3.  Ghi nhận mã lô hóa chất (`lotNumber`) vào `lab.analyses.consumablesUsed`.

### 2.2.4. Luồng Giai đoạn 4: Thử nghiệm & Audit Trail (Analytical Flow)

- **Traceability:** KTV quét QR thiết bị -> INSERT `inventory.assetActivityLogs` (Type: `Usage`, commonKeys: `analysisId`).
- **Data Entry:** KTV nhập kết quả vào `resultValue`.
- **Audit Trail Trigger:** \* Nếu `resultValue` bị sửa đổi sau lần `Save` đầu tiên: Hệ thống bắt buộc yêu cầu "Reason" (Lý do) -> Tự động Push vào mảng `resultHistory` (jsonb[]).
- Cấu trúc lưu vết: `{oldValue, newValue, changedById, reason, timestamp}`.

### 2.2.5. Luồng Giai đoạn 5: Soát xét & Trả kết quả (Post-Analytical Flow)

- **QC Review:** `VALIDATOR` kiểm tra dữ liệu gốc -> UPDATE `analysisStatus` = `Approved` (hoặc `ReTest` kèm `retestReason`).
- **Report Generation (The Document Pattern):**

1. Gọi hàm `Receipt.exportReport()`.
2. Lấy dữ liệu `Approved` -> Render HTML -> Chuyển PDF (Playwright).
3. Upload S3 -> Trả về `fileId` từ `document.files`.
4. INSERT `document.documents` (Type: `AnalysisReport`, refId: `receiptId`).

- **Digital Sign:** Lãnh đạo ký số -> Update `reportStatus = 'Reported'`. Hệ thống tự động gửi email cho khách dựa trên `EMAIL_NOTIFICATION_FLOW`.

### 2.2.6. Luồng Giai đoạn 6: Hậu mãi & Lưu trữ (Management Flow)

- **Complaint:** Phát sinh khiếu nại -> INSERT `crm.complaints` -> Nếu cần thử lại, hệ thống sinh Analysis mới liên kết với `complaintId`.
- **Retention:** Hệ thống tự động tính `sampleRetentionDate` (Ngày hủy dự kiến) dựa trên chính sách của từng loại mẫu.
- **Disposal:** Đến hạn -> `ROLE_SAMPLE_CUSTODIAN` xác nhận hủy -> UPDATE `sampleStatus = 'Disposed'` và lưu biên bản hủy vào `document.documents`.

## 2.3. QUY CHUẨN API & CẤU TRÚC DỮ LIỆU JSONB

### 2.3.1. Quy chuẩn API Backend

- **Endpoint:** `/v2/:resource/:action/:option`.
- **Methods:** `GET` (List/Detail/Full), `POST` (Create/Update/Delete).
- **Pagination:** Bắt buộc cho mọi API `/get/list`.

### 2.3.2. Cấu trúc JSONB Trọng yếu

- **`resultHistory`:** Dùng cho thanh tra ISO để giải trình mọi thay đổi số liệu.
- **`commonKeys` (GIN Index):** Dùng để truy vết đa chiều (Ví dụ: Tìm nhanh tất cả các mẫu đã dùng chai Axit lô X).
- **`matrixSnapshot`:** Lưu cấu hình Kỹ thuật + Giá tại thời điểm tiếp nhận để "đóng băng" hồ sơ.

---

# PHẦN 3: XÂY DỰNG - PHÁT TRIỂN PHẦN MỀM (DEVELOPMENT)

## 3.1. KIẾN TRÚC CODEBASE & LỚP ĐỐI TƯỢNG (OBJECT-ORIENTED DESIGN)

Hệ thống được phát triển theo mô hình **Entity-Component-System**, sử dụng tính kế thừa để tối ưu hóa việc quản lý dữ liệu.

### 3.1.1. Cấu trúc thừa kế Class (Inheritance Tree)

- **`BaseEntity` (Core):** Cung cấp các phương thức CRUD cơ bản, xác thực Token (`getEntity`), kiểm tra quyền (`checkPermit`) và lọc dữ liệu đầu ra (`filterDataResponse`).
- **`LibraryEntity` (Extends Base):** Chuyên trách dữ liệu danh mục (`matrices`, `protocols`). Tự động sinh ID theo Prefix (VD: `MAT-`, `PRO-`) và đồng bộ Cache hệ thống.
- **`LabEntity` (Extends Base):** Quản lý các giao dịch nghiệp vụ có trạng thái phức tạp (`receipts`, `samples`, `analyses`). Tích hợp logic **Atomic Database Transaction** để đảm bảo dữ liệu đồng nhất.
- **`DocumentEntity` (Extends Base):** Quản lý tài liệu và file vật lý. Lưu ý cập nhật 14/04/2026: Lớp `Report` đã chuyển về đây để thừa hưởng hạ tầng lưu trữ S3/MinIO.

### 3.1.2. Phân tách lớp lưu trữ File & Document

- **Physical Layer (`document.files`):** Quản lý file vật lý trên S3. Không chứa logic nghiệp vụ. Chỉ trả về Presigned URL để bảo mật đường dẫn.
- **Business Layer (`document.documents`):** Lưu trữ Metadata. Sử dụng `refType` (VD: `AnalysisReport`, `In-Process-Control`) và `refId` để liên kết đa hướng với các Module khác.

---

## 3.2. LOGIC XỬ LÝ NGHIỆP VỤ LÕI (CORE LOGIC)

### 3.2.1. Module Identity & Phân quyền PBAC

- **Cơ chế Role Inheritance:** Thiết lập logic kế thừa: `ROLE_DIRECTOR` > `ROLE_TECH_MANAGER` > `ROLE_SECTION_HEAD` > `ROLE_TECHNICIAN`.
- **Policy-Based Access Control (PBAC):** Sử dụng Middleware để flat-map toàn bộ Roles của User thành danh sách `Policy Codes` (VD: `POL_TEST_EXECUTE`). Hệ thống kiểm tra Policy Code trước khi thực thi hàm.
- **Customer Auth:** Luồng đăng nhập không mật khẩu cho khách hàng qua Portal sử dụng `clientId` + **Email OTP**.

### 3.2.2. Module Lab - Vận hành & Phê duyệt

- **Tạo hồ sơ Transactional:** Khi `Receipt.createFull()` được gọi, hệ thống phải thực hiện lock Row `orders` tương ứng để tránh duplicate, sau đó INSERT đồng thời vào 3 bảng Lab.
- **Luồng Export Report (Playwright):** 1. Nhận cấu trúc HTML từ UI.

2. Sử dụng thư viện **Playwright** để render PDF phía Server.
3. Tự động upload lên S3 và sinh bản ghi trong `document.documents`.
4. Cập nhật `receiptStatus = 'Reported'`.

### 3.2.3. Module Inventory - FEFO & Truy xuất nguồn gốc

- **Logic Xuất kho (Picking):** Áp dụng quy tắc FEFO (First Expired, First Out). Hệ thống tự động gợi ý `chemicalInventoryId` có ngày hết hạn gần nhất hoặc đã mở nắp (`openedDate`).
- **Preparation (Pha chế):** Khi tạo một `prepared_solution`, hệ thống yêu cầu link tới `parentInventoryIds`. Trừ tồn kho hóa chất gốc tương ứng và sinh mã Barcode mới cho lọ dung dịch đã pha.

---

## 3.3. TÍCH HỢP HỆ THỐNG NGOẠI VI & TỰ ĐỘNG HÓA

### 3.3.1. Google OAuth & Email Automation

- **Google Service Account:** Sử dụng OAuth 2.0 để quản lý nhiều tài khoản (botfather, cskh, kiemnghiem).
- **Reception Email Flow:** Tự động lấy `receiptId` -> Regex infer ra thông tin contact -> Render bảng HTML chi tiết mẫu -> Gửi mail xác nhận ngay khi mẫu nhập kho.
- **Result Email Flow:** Duyệt danh sách `fileIds` -> Truy vấn `commonKeys` để lấy mã TNM/SP liên quan -> Gửi thông báo kèm link tải báo cáo.

### 3.3.2. Logistics Integration (Viettel Post)

- **Shipment Creation:** Khi `receiptDeliveryMethod = 'Post'`, hệ thống gọi API Viettel Post để tạo vận đơn.
- **Tracking:** Lưu `shipmentTrackingNumber` vào bảng `service.shipments` và đồng bộ trạng thái vận đơn về Dashboard CSKH.

---

## 3.4. QUẢN TRỊ HỆ THỐNG & GIÁM SÁT (SYSTEM MONITORING)

### 3.4.1. Business Events & Timeline

- Sử dụng bảng `system.businessEvents` như một **Event Bus**. Mọi thay đổi trạng thái quan trọng (Paid, DataEntered, Reported) đều phải phát ra một Event.
- Frontend sử dụng dữ liệu này để vẽ Timeline cho khách hàng theo dõi tiến độ mẫu theo thời gian thực.

### 3.4.2. Asset Traceability (Truy vết thiết bị)

- Mỗi khi KTV thao tác nhập liệu, hệ thống tự động sinh bản ghi vào `assetActivityLogs`.
- Sử dụng trường `commonKeys[]` (VD: `["analysisId:ANL001", "receiptId:TNM002"]`) kết hợp với **GIN Index** để hỗ trợ QA truy xuất cực nhanh: "Thiết bị này đã dùng cho những mẫu nào?".

---

## 3.5. QUY ĐỊNH KỸ THUẬT CHO LẬP TRÌNH VIÊN (DEVELOPER GUIDELINES)

1. **Enum Usage:** Tuyệt đối không hardcode giá trị String. Mọi dropdown/trạng thái phải gọi API `/v2/enum/get/list`.
2. **Snapshot Pattern:** Khi lưu Đơn hàng/Báo giá, phải copy toàn bộ object Khách hàng/Giá vào cột JSONB. Không được chỉ lưu ID tham chiếu.
3. **Audit Trail:** Mọi hàm `UPDATE` trên các trường kết quả kỹ thuật phải kiểm tra sự thay đổi. Nếu có thay đổi, bắt buộc push dữ liệu cũ vào mảng `resultHistory`.
4. **Soft Delete:** Cấm sử dụng lệnh `DELETE` vật lý trên DB. Luôn sử dụng `update({ deletedAt: NOW() })`.

---
