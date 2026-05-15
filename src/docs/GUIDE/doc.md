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

# PHẦN 4: TÀI LIỆU HƯỚNG DẪN SỬ DỤNG 

## I. Phân hệ Quản lý Khách hàng và Kinh doanh (CRM)

### 1. Đăng nhập hệ thống

* **Bước 1:** Truy cập vào địa chỉ URL của hệ thống LIMS-CRM.
* **Bước 2:** Tại màn hình đăng nhập, nhập chính xác **Email** và **Mật khẩu** tài khoản nội bộ.
* **Bước 3:** Click nút **[Đăng nhập]**. Hệ thống sẽ chuyển hướng bạn đến trang Dashboard chính.

### 2. Quản lý Khách hàng (CLIENTS)

#### 2.1. Thêm mới khách hàng

* **Bước 1:** Từ Sidebar (thanh menu bên trái), chọn **[Bán hàng (CRM)]** -> **[Khách hàng]**.
* **Bước 2:** Click nút **[+ Thêm khách hàng]** ở góc trên bên phải màn hình.
* **Bước 3:** Tại Modal nhập liệu:
* Nhập **Mã số thuế** của công ty khách hàng.
* Click vào nút **[Kính lúp]** (tra cứu). Hệ thống tự động lấy dữ liệu và điền các trường: **Tên đơn vị**, **Địa chỉ**, **Tên viết tắt**.
* Nhập bổ sung **Số điện thoại** và **Email** của đơn vị.
* Tại mục **Người liên hệ**: Click **[+ Thêm người liên hệ]** để điền Tên, Chức vụ và SĐT của người đại diện làm việc trực tiếp.


* **Bước 4:** Click nút **[Lưu]** để hoàn tất thêm vào danh mục.

#### 2.2. Chỉnh sửa thông tin khách hàng

* **Bước 1:** Tại danh sách khách hàng, tìm khách hàng cần cập nhật.
* **Bước 2:** Click vào **Icon cây bút (Edit)** ở hàng tương ứng.
* **Bước 3:** Thay đổi các thông tin cần thiết trong Modal hiện ra.
* **Bước 4:** Click nút **[Lưu thay đổi]**.

### 3. Quản lý Báo giá (QUOTES)

#### 3.1. Lập báo giá mới

* **Bước 1:** Chọn **[Bán hàng (CRM)]** -> **[Báo giá]**. Click nút **[+ Tạo báo giá]**.
* **Bước 2:** Tại giao diện lập báo giá:
* Chọn **Khách hàng** từ danh sách thả xuống (có thể gõ tìm kiếm theo tên/MST).
* Tại phần **Danh sách mẫu & chỉ tiêu**: Click **[+ Thêm mẫu mới]**.
* Nhập **Tên mẫu** (Ví dụ: Nước thải sau xử lý) và chọn **Loại nền mẫu** phù hợp.
* Click nút **[+ Thêm chỉ tiêu]**: Gõ tìm kiếm các chỉ tiêu kỹ thuật. Hệ thống tự động hiển thị: **Phương pháp thử**, **Đơn giá**, **Thuế suất** và **TAT** (Thời gian trả kết quả) dựa trên cấu hình ma trận giá.


* **Bước 3:** Kiểm tra tổng tiền ở phía dưới giao diện. Nhập **% Chiết khấu** (nếu có thỏa thuận).
* **Bước 4:** Click nút **[Lưu báo giá]**.

#### 3.2. Xuất Báo giá PDF

* **Bước 1:** Tại danh sách báo giá, click vào hàng tương ứng của báo giá muốn xuất.
* **Bước 2:** Click vào nút có **Biểu tượng file PDF (Xuất báo giá PDF)**.
* **Bước 3:** Hệ thống hiển thị Modal xem trước (Preview).
* **Bước 4:** Click nút **[Tải xuống]** hoặc icon Download trên trình xem để lưu file PDF về máy tính.

#### 3.3. Tạo Đơn hàng nhanh từ Báo giá

* **Bước 1:** Ngay tại giao diện chi tiết hoặc UI danh sách của Báo giá, tìm và click nút **[Chuyển thành Đơn hàng]**.
* **Bước 2:** Click **[Xác nhận]** tại Modal thông báo.
* **Bước 3:** Hệ thống tự động tạo một Đơn hàng mới, kế thừa toàn bộ thông tin khách hàng, danh sách mẫu và giá từ báo giá gốc.
* **Bước 4:** Màn hình chuyển sang giao diện **Chi tiết Đơn hàng** để tiếp tục quy trình xử lý.

### 4. Quản lý Đơn hàng & Cổng khai báo dành cho khách hàng

#### 4.1. Gửi link Phiếu gửi mẫu cho khách hàng

* **Bước 1:** Tại giao diện **Chi tiết đơn hàng**, tìm trường **"Link phiếu gửi mẫu"**.
* **Bước 2:** Click nút **[Copy Link]** (đường dẫn chứa mã token định danh).
* **Bước 3:** Nhân viên kinh doanh gửi link này cho khách hàng (qua Zalo, Email...).

#### 4.2. Khách hàng cập nhật thông tin và In phiếu (Thực hiện trên Link công khai)

* **Bước 1:** Khách hàng click vào link nhận được để mở giao diện cập nhật.
* **Bước 2:** Khách hàng nhập chi tiết thông tin mẫu thực tế: **Ký hiệu mẫu**, **Mô tả tình trạng**, **Khối lượng**, **Yêu cầu bảo quản**.
* **Bước 3:** Click nút **[Lưu phiếu gửi mẫu]**. Hệ thống ghi nhận dữ liệu vào LIMS.
* **Bước 4:** Click nút **[In phiếu gửi mẫu]** (hoặc Xuất PDF).
* **Bước 5:** File PDF Phiếu gửi mẫu tự động tải xuống. Khách hàng in ra, ký tên/đóng dấu và gửi kèm cùng mẫu thử tới phòng Lab.


## II. Phân hệ Quản lý tiếp nhận và xử lý mẫu (RECEIVING & SAMPLE PROCESSING)

### 1. Đăng nhập hệ thống

* **Bước 1:** Truy cập vào địa chỉ URL của hệ thống LIMS.
* **Bước 2:** Tại màn hình đăng nhập, nhập chính xác **Email** và **Mật khẩu** tài khoản nội bộ.
* **Bước 3:** Click nút **[Đăng nhập]**. Hệ thống sẽ chuyển hướng bạn đến trang Dashboard chính.

### 2. Xử lý yêu cầu và Tạo Phiếu tiếp nhận (RECEIPT CREATION)

**Mục đích:** Hoàn thiện thông tin kỹ thuật của mẫu và sinh mã định danh chính thức (TNM, SP) để đưa vào phòng Lab.

#### 2.1. Kiểm soát và Cập nhật thông tin yêu cầu

* **Bước 1:** Tại tab **[Yêu cầu tiếp nhận]**, tìm yêu cầu vừa được tạo từ đơn hàng.
* **Bước 2:** Click vào bản ghi yêu cầu để mở giao diện chi tiết:
* Kiểm tra sự khớp lệch giữa hồ sơ khách hàng gửi (Phiếu gửi mẫu) và mẫu vật lý thực tế.
* Nhập các thông tin kỹ thuật bổ sung cho từng mẫu: **Trạng thái vật lý** (Rắn/Lỏng), **Khối lượng/Thể tích**, **Điều kiện bảo quản**.


* **Bước 3 (Xử lý ngoại lệ):** Nếu phát hiện mẫu không đạt quy chuẩn hoặc thiếu hồ sơ:
* Đánh dấu trạng thái **[Chờ bổ sung thông tin]**.
* Hệ thống sẽ dừng quy trình và thông báo cho bộ phận Sales/CSKH.



#### 2.2. Tạo Phiếu tiếp nhận chính thức (Create Full Receipt)

* **Bước 1:** Sau khi thông tin đã chuẩn xác, click nút **[Tạo hồ sơ tiếp nhận]** ở góc dưới màn hình.
* **Bước 2:** Hệ thống thực hiện lệnh **Atomic Transaction**:
* Tự động sinh mã Hồ sơ: **TNM[Năm][Tháng][Ngày][Số thứ tự]** (VD: TNM26A23001).
* Tự động sinh mã Mẫu: **SP...** (VD: SP26A23001-001).
* Tự động Copy toàn bộ chỉ tiêu từ Đơn hàng sang bảng Phân tích (`analyses`).


* **Bước 3:** Chuyển trạng thái hồ sơ sang **[Đã tiếp nhận]** và đẩy dữ liệu sang tab **[Đang xử lý]**.

---

## 3. Mã hóa mẫu và In tem nhãn (CODING & LABELING)

### 3.1. In tem mã vạch (Barcode/QR)

* **Bước 1:** Tại giao diện hồ sơ đã tiếp nhận, chọn nút **[In tem mẫu]**.
* **Bước 2:** Hệ thống hiển thị Modal tùy chọn in:
* Chọn khổ giấy in (mặc định là giấy chịu hóa chất/nước).
* Chọn danh sách các mẫu cần in tem.


* **Bước 3:** Click **[Xác nhận In]**. Máy in tem nhãn sẽ xuất ra tem chứa: Mã vạch (Barcode), Mã SP, Tên mẫu và Ngày nhận.
* **Bước 4:** Thực hiện dán tem trực tiếp lên vật chứa mẫu.

### 3.2. Chụp ảnh lưu vết tiếp nhận

* **Bước 1:** Click nút **[Chụp ảnh mẫu]** (hoặc Upload ảnh).
* **Bước 2:** Thực hiện chụp ảnh tình trạng niêm phong, nhãn gốc của khách hàng để làm bằng chứng pháp lý.
* **Bước 3:** Ảnh được tự động lưu vào bảng `document.files` và gắn link trực tiếp vào mẫu (`sampleId`).

---

## 4. Gửi Email thông báo tiếp nhận (ACKNOWLEDGMENT)

**Mục đích:** Xác nhận chính thức với khách hàng về danh sách mẫu và phương pháp thử sẽ thực hiện.

* **Bước 1:** Click nút **[Gửi Email tiếp nhận]** (Icon thư).
* **Bước 2:** Hệ thống tự động lấy Email từ thông tin liên hệ và render nội dung theo Template HTML chuẩn.
* **Bước 3:** Kiểm tra nội dung email bao gồm: **Bảng danh sách mẫu**, **Tình trạng mẫu khi nhận**, **Ảnh chụp đính kèm** và file PDF **Phiếu tiếp nhận mẫu**.
* **Bước 4:** Click **[Gửi]**. Hệ thống cập nhật trạng thái hồ sơ sang **[Chờ bàn giao phòng Lab]**.

---

**Lưu ý quan trọng:** * Mọi thay đổi thông tin hành chính của hồ sơ sau bước này phải được ghi nhật ký trong mảng `resultHistory` (Audit Trail).

* Nếu `isBlindCoded = true`, toàn bộ thông tin định danh khách hàng sẽ bị ẩn đối với Kỹ thuật viên khi bàn giao mẫu.

---

# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG: MODULE QUẢN LÝ KHO HÓA CHẤT (LIMS)

## 1. Tổng quan Giao diện

Từ menu bên trái (Sidebar), chọn **[Kho hóa chất]** dưới phân hệ **Kho & Thiết bị**.
Giao diện chính bao gồm các tab chức năng:

* **Quản lý lô/chai:** Danh sách chi tiết từng vật chứa hóa chất trong kho.
* **Danh mục hóa chất:** Quản lý mã SKU và thông tin gốc.
* **Phiếu Xuất/Nhập kho:** Quản lý các lệnh điều chuyển vật tư lớn.
* **Lịch sử tương tác:** Nhật ký sử dụng của toàn bộ nhân viên.

---

## 2. Quy trình Nhập Lô Hóa chất Mới (Inbound)

Thực hiện khi có hóa chất mới về kho từ nhà cung cấp.

* 
**Bước 1:** Tại tab **[Quản lý lô/chai]**, click nút **[+ Nhập lô mới]** ở góc trên bên phải.


* **Bước 2: Nhập thông tin định danh:**
* **Mã SKU:** Chọn loại hóa chất tương ứng (Ví dụ: SKU_HNO3). Hệ thống sẽ tự động hiển thị tên hóa chất và số CAS.


* **Số lô (Lot):** Nhập số lô in trên bao bì của nhà sản xuất.


* **Bước 3: Nhập dữ liệu kỹ thuật:**
* 
**Trạng thái:** Mặc định là `Pending` (Chờ kiểm tra) hoặc `In-Use`.


* **Số lượng ban đầu:** Nhập khối lượng/thể tích (Ví dụ: 500ml).
* 
**Ngày hết hạn:** Chọn từ lịch để hệ thống tự động tính ngày cảnh báo sớm.




* **Bước 4: Upload tài liệu COA/MSDS:**
* Click vào khu vực đính kèm để upload file PDF/Ảnh của Giấy chứng nhận phân tích (COA).


* Chọn đúng **Phân loại tài liệu** là `CHEMICAL_COA` để phục vụ thanh tra ISO.




* **Bước 5:** Click **[Tạo mới]**. Hệ thống sẽ tự động sinh mã quản lý nội bộ (BTL_...) và hiển thị **Tem nhãn QR** để in và dán lên chai.
    * **Thông tin trên tem:** Tên hóa chất, CAS, Lô/NhSX (hóa chất thương mại) hoặc **TL pha**, **Hệ số K** (hóa chất pha), Ngày NSX/Ngày pha - Hạn dùng, và mã QR định danh.



---

## 3. Quy trình Xuất/Nhập Kho theo Phiếu (Inventory Transaction)

Dùng để quản lý các giao dịch lớn hoặc điều chỉnh tồn kho tổng.

* 
**Bước 1:** Chuyển sang tab **[Phiếu Xuất/Nhập kho]** -> Click **[+ Tạo phiếu mới]**.


* **Bước 2: Chọn Loại phiếu:**
* **Nhập kho:** Hàng từ nhà cung cấp về.
* 
**Xuất kho:** Chuyển từ kho tổng sang tủ trực nhật phòng Lab.




* **Bước 3: Thêm hóa chất vào phiếu:**
* Click **[+ Chọn hóa chất từ kho]**.
* Tích chọn các lô hóa chất cần xuất/nhập.
* Nhập số lượng thực tế thao tác.




* **Bước 4: Hoàn tất & In phiếu:**
* Bấm **[Tạo phiếu & Giao dịch]**.
* Hệ thống sẽ hiển thị bản xem trước PDF **Phiếu Nhập/Xuất kho** chứa Logo viện, danh sách vật tư và các cột ký tên.


* Click **[In]** hoặc **[Xuất file PDF]** để lưu trữ hồ sơ giấy.


---

## 4. Quy trình Kiểm kê kho (Inventory Audit)

Chức năng kiểm kê cho phép rà soát và tự động điều chỉnh số lượng tồn kho thực tế so với hệ thống.

* **Bước 1:** Chuyển sang tab **[Kiểm kê kho]** -> Click nút **[+ Tạo Đợt Kiểm Kê]**.
* **Bước 2: Thêm hóa chất vào đợt kiểm kê:**
  * Tại giao diện chi tiết, bạn có thể **Quét mã QR** (mã chai) để tự động thêm vào danh sách kiểm kê.
  * Hoặc click **[+ Chọn từ danh sách]**. Trong cửa sổ tìm kiếm, bạn có thể gõ **Mã chai** hoặc **Tên hóa chất** để tìm nhanh và tích chọn các lô cần kiểm kê.
* **Bước 3: Ghi nhận số lượng thực tế:**
  * Nhập số lượng đếm được thực tế vào cột **Thực tế**.
  * Hệ thống tự động tính toán số **Chênh lệch** (Lệch) và hiển thị nhãn màu xanh (thừa) hoặc đỏ (thiếu). Các dòng có sai lệch sẽ tự động được làm nổi bật (highlight).
  * Bạn cũng có thể ghi chú lý do sai lệch vào cột **Ghi chú**.
* **Bước 4: Lưu và Duyệt kiểm kê:**
  * Bấm **[Lưu thay đổi]** để lưu nháp kết quả (bạn vẫn có thể sửa tiếp).
  * Sau khi hoàn tất rà soát, bấm **[Duyệt kiểm kê]** để xác nhận.
  * **Hệ thống tự động hóa:** Khi duyệt, hệ thống sẽ **tự động tạo phiếu điều chỉnh kho (AUDIT_ADJUSTMENT)** và cập nhật tồn kho thực tế cho tất cả các mã chai có sự chênh lệch. Giao diện lúc này sẽ chuyển sang chế độ "Chỉ xem" (View Only) và khóa mọi thao tác chỉnh sửa, đảm bảo tính toàn vẹn dữ liệu.

---

## 5. Ghi nhận Sử dụng & Truy xuất (Usage Log)

Thực hiện mỗi khi Kiểm nghiệm viên (KNV) lấy hóa chất để chạy phép thử.

* **Bước 1:** Tại màn hình chi tiết của một chai hóa chất, chọn nút **[Sửa/Cập nhật]** (Icon hình bút).
* **Bước 2: Ghi nhật ký:**
* Nhập **Lượng lấy** (Ví dụ: 10ml).


* Chọn **Mục đích sử dụng** (Pha dung dịch chuẩn hoặc chạy chỉ tiêu cụ thể).




* 
**Bước 3:** Hệ thống sẽ tự động trừ tồn kho hiện dụng của chai đó.


* 
**Bước 4 (Truy xuất):** QA có thể vào mục **[Lịch sử tương tác]** để lọc xem chai hóa chất lô này đã dùng cho những mẫu (Sample ID) nào trong ngày.



---

## 6. Các lưu ý quan trọng (Audit Trail)

* 
**Thay đổi trạng thái:** Khi hóa chất hết hạn hoặc nghi ngờ hỏng, người dùng phải cập nhật trạng thái lô sang `Expired` hoặc `Disposed` để hệ thống khóa không cho gán vào phép thử mới.


* 
**Vết kiểm toán:** Mọi hành động chỉnh sửa số lượng tồn kho thủ công (Manual Adjustment) đều yêu cầu nhập **Lý do thay đổi** để lưu vào nhật ký hệ thống phục vụ hậu kiểm.

---

### 1. Phân công Kỹ thuật viên (KTV)

**Mục đích:** Giao chỉ tiêu phân tích cho cá nhân hoặc tổ chuyên môn.

* **Truy cập:** Menu `Tiếp nhận mẫu` > `Phân công KTV`.
* **Thao tác:**
1. Tại danh sách, tích chọn các chỉ tiêu có trạng thái **Chờ xử lý** (màu vàng).
2. Bấm nút **Phân công KTV** ở góc trên bên phải.
3. Trong cửa sổ hiện ra, bạn có 2 lựa chọn:
* **Cá nhân:** Chọn đích danh KTV thực hiện.
* **Theo nhóm:** Chọn tổ chuyên môn (ví dụ: *Sắc ký lỏng, Hóa điện, Vi sinh...*).


4. Bấm **Xác nhận**. Hệ thống thông báo *"Đã phân công thành công"*.



---

### 2. Nhận thực hiện chỉ tiêu

**Mục đích:** KTV xác nhận tiếp nhận công việc tại bàn làm việc cá nhân.

* **Truy cập:** Menu `LIMS Lab` > `Bàn làm việc KTV`.
* **Thao tác:**
1. Tại tab **Chờ nhận**, chọn các chỉ tiêu vừa được phân công.
2. Bấm nút **Nhận chỉ tiêu**.
3. Các chỉ tiêu này sẽ tự động chuyển sang tab **Đang thử nghiệm** để bắt đầu xử lý.



---

### 3. Tạo Biên bản thử nghiệm (Protocol)

**Mục đích:** Thiết lập hồ sơ ghi chép dữ liệu thô và mẫu báo cáo.

* **Thao tác tại Bàn làm việc KTV:**
1. Tìm chỉ tiêu tại tab **Đang thử nghiệm**, bấm vào **Icon Chỉnh sửa (hình tờ giấy)** ở cột *Thao tác*.
2. Tại giao diện biên bản:
* **Cách 1:** Sử dụng mẫu có sẵn trong hệ thống.
* **Cách 2:** Bấm **Tải file Word** để tải lên mẫu biên bản nội bộ từ máy tính.


3. **Chèn dữ liệu động:** Bấm nút **Chèn bảng chỉ tiêu**. Chọn các trường thông tin cần hiển thị trong bảng (STT, Mã mẫu, Chỉ tiêu, Phương pháp, Kết quả...).
4. Bấm **Lưu & Xuất PDF** để hệ thống render file hồ sơ. Bạn có thể bấm **Mở tab mới** để xem trước định dạng PDF.



---

### 4. Nhập kết quả thử nghiệm

**Mục đích:** Ghi nhận số liệu phân tích cuối cùng vào hệ thống.

* **Thao tác:**
1. Tại tab **Đang thử nghiệm**, tích chọn các chỉ tiêu đã có kết quả.
2. Bấm nút **Nhập kết quả bộ (n)**.
3. Trong bảng nhập liệu hiện ra, điền các thông tin:
* **Kết quả:** Nhập giá trị phân tích (ví dụ: *KET QUA 1*).
* **Đơn vị:** Chọn hoặc nhập đơn vị tính (ví dụ: *mg/kg, ppb...*).
* **Đánh giá:** Chọn *Đạt* hoặc *Không đạt*.


4. Bấm **Lưu kết quả**. Trạng thái chỉ tiêu sẽ chuyển sang **Đã nhập kết quả**.



---

### 5. Gửi duyệt kết quả

**Mục đích:** Chuyển hồ sơ cho cấp quản lý (Tổ trưởng/QA) kiểm tra.

* **Thao tác:**
1. Chọn các chỉ tiêu đã hoàn tất nhập liệu và biên bản.
2. Bấm nút **Gửi duyệt (n)** ở thanh công cụ phía trên.
3. Xác nhận gửi. Hệ thống sẽ chuyển dữ liệu sang phân hệ kiểm soát.



---

### 6. Soát xét & Duyệt kết quả

**Mục đích:** Phê duyệt dữ liệu để xuất phiếu kết quả cuối cùng.

* **Truy cập:** Menu `Tiếp nhận mẫu` > `Kiểm soát & Duyệt KQ`.
* **Thao tác:**
1. **Tab Chờ soát xét (Leader):** Cấp tổ trưởng kiểm tra lại biên bản và số liệu của KTV. Tích chọn các dòng và bấm **Phê duyệt**.
2. **Tab Chờ duyệt (QA/Manager):** Cấp quản lý cuối cùng thực hiện kiểm tra chéo lần cuối.
3. Sau khi bấm **Phê duyệt**, kết quả sẽ nằm ở tab **Đã duyệt** và sẵn sàng để in phiếu trả khách hàng.



---

---

### 7. Tạo Vận đơn (Shipment Creation)

**Mục đích:** Khởi tạo yêu cầu giao hàng vật lý (phiếu kết quả bản cứng) qua đơn vị vận chuyển (ViettelPost) ngay trên hệ thống.

* **Người thực hiện:** Nhân viên Tiếp nhận / Logistics.
* **Các bước thực hiện:**
1. Tại danh sách **Tiếp nhận mẫu**, chọn hồ sơ (mã TNM) cần trả kết quả.
2. Trong giao diện chi tiết, tìm đến mục **Vận đơn** và nhấn nút **[Tạo / Xem vận đơn]**.
3. **Cấu hình đơn hàng:**
* Chọn đơn vị vận chuyển: **ViettelPost**.
* Sử dụng tính năng **[Trích xuất từ dữ liệu tiếp nhận]**: Hệ thống sẽ tự động lấy địa chỉ khách hàng và thông tin người nhận từ hồ sơ gốc để điền vào form.
* Kiểm tra lại thông tin: Tên người nhận, Số điện thoại, Địa chỉ chi tiết.


4. Nhấn **[Tạo vận đơn mới]**.
5. **In nhãn:** Sau khi tạo thành công, hệ thống hiển thị mã vận đơn và nút **[Xem trước tem in]**. Thực hiện in tem này và dán lên phong bì hồ sơ trả khách.



---

### 8. Xuất Phiếu Kết quả (COA Export)

**Mục đích:** Render file kết quả cuối cùng (PDF) có đầy đủ chữ ký, con dấu và các thông số kỹ thuật đã duyệt.

* **Người thực hiện:** Hệ thống tự động / QA Manager.
* **Đặc điểm phiếu (theo video):**
* **Header:** Thông tin Viện nghiên cứu, logo, chứng chỉ ISO/IEC 17025.
* **Nội dung:** Thông tin khách hàng, mô tả mẫu, ngày nhận/ngày trả kết quả.
* **Bảng kết quả:** Gồm STT, Tên chỉ tiêu, Đơn vị tính, Kết quả, Phương pháp thử và Đánh giá (Pass/Fail).
* **Footer:** Ý kiến chuyên môn và phần ký duyệt của Lãnh đạo.



---

### 9. Trả kết quả (Result Dispatch - Email)

**Mục đích:** Gửi thông báo và bản mềm (PDF) phiếu kết quả cho khách hàng qua email.

* **Người thực hiện:** Nhân viên Chăm sóc khách hàng (CS) / Tiếp nhận.
* **Các bước thực hiện:**
1. Tại giao diện hồ sơ tiếp nhận, nhấn nút **[Trả kết quả]** (thường có icon hình thư gửi).
2. **Soạn Email:** Một cửa sổ popup hiện ra với Template đã được soạn sẵn:
* **Tiêu đề:** *"Kết quả thử nghiệm đơn hàng [Mã Đơn Hàng]"*.
* **Nội dung:** Tự động điền tên khách hàng và mã hồ sơ.


3. **Kiểm tra file đính kèm:** Hệ thống tự động đính kèm file **Phiếu kết quả thử nghiệm (PDF)**. Bạn có thể nhấn **[Preview]** để kiểm tra lại tính chính xác của file trước khi gửi.
4. Nhấn **[Gửi Email]**.
5. **Cập nhật trạng thái:** Sau khi gửi thành công, trạng thái hồ sơ trên Dashboard sẽ chuyển sang **"Đã trả kết quả"** (màu xanh lá).



---

### Một số lưu ý quan trọng (Tips):

* **Đồng bộ dữ liệu:** Luôn ưu tiên dùng nút **Auto-map địa chỉ** khi tạo vận đơn để tránh sai sót gõ tay địa chỉ khách hàng.
* **Kiểm tra kỹ trước khi gửi:** Bước **Preview COA** trong popup email là "chốt chặn" cuối cùng để đảm bảo không gửi nhầm file hoặc kết quả sai cho khách.
* **Tra cứu vận đơn:** Sau khi tạo, bạn có thể theo dõi hành trình đơn hàng trực tiếp bằng cách click vào mã vận đơn (VTP...) trong hệ thống.
