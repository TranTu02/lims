# Tài liệu Hệ thống: Không gian làm việc Kỹ thuật viên (Technician Workspace)

Thư mục: `src/components/technician/`
Biên soạn lúc: 11/03/2026

Thư mục này chứa toàn bộ các components phục vụ cho giao diện làm việc của Kỹ thuật viên (KTV) trong phòng lab. KTV sử dụng không gian này để xem các chỉ tiêu được phân công, nhận mẫu, báo cáo kết quả, xử lý hóa chất và soạn thảo biên bản thử nghiệm.

---

## 1. Thành phần chính (Core Components)

### 1.1 `TechnicianWorkspace.tsx`
**Mô tả:** Đây là trang chính (Dashboard) của KTV. Tích hợp quản lý theo dạng tab và các thao tác hàng loạt (Bulk actions).

**Logic & Tính năng chính:**
-   **Quản lý Tabs:** 
    -   `Chờ nhận mẫu` (Pending/Ready): Các chỉ tiêu KTV đã được phân công nhưng chưa bắt đầu làm.
    -   `Đang thử nghiệm` (Testing): Các chỉ tiêu KTV đã xác nhận nhận mẫu và đang tiến hành phân tích.
    -   `Yêu cầu thử lại` (ReTest): Các chỉ tiêu có vấn đề (sai số, không đạt QC) bị trả về yêu cầu test lại.
    -   `Yêu cầu vật tư` (Chemical Requests): Tab riêng hiển thị lịch sử cấp phát/yêu cầu hóa chất.
-   **Chọn hàng loạt (Drag-to-select & Checkbox):** Hỗ trợ kéo thả chuột để check nhiều dòng liên tiếp (sử dụng tọa độ chuột và ranh giới element `getBoundingClientRect`) hoặc bấm checkbox thông thường.
-   **Bulk Actions (Hành động hàng loạt):**
    -   `Nhận chỉ tiêu`: Chuyển trạng thái các mẫu từ Pending/Ready sang `Testing`.
    -   `Nhập kết quả lô`: Mở modal `TechnicianBulkEntryModal` để nhập kết quả nhanh cho nhiều mẫu đang ở trạng thái Testing.
    -   `Gợi ý hóa chất FEFO`: Mở modal `TechnicianChemicalAllocationModal` để tính toán và hướng dẫn bốc chai hóa chất.
    -   `Soạn biên bản`: Mở trình soạn thảo `TestProtocolEditor` (có thể chọn 1 hoặc nhiều chỉ tiêu cùng lúc để cùng soạn 1 biên bản chung).
-   **Phân trang & Tìm kiếm:** Sử dụng `useAnalysesList` API với tính năng debounce khi tìm kiếm.

---

## 2. Các Components liên quan đến Biên bản Thử nghiệm

### 2.1 `TestProtocolEditor.tsx`
**Mô tả:** Trình soạn thảo Rich Text (TinyMCE) mạnh mẽ để KTV soạn thảo, chỉnh sửa Biên bản thử nghiệm.

**Logic & Tính năng chính:**
-   **Xử lý đa chỉ tiêu (Multi-analyses):** Component được thiết kế để nhận một mảng `analyses`. Nếu các phân tích này có nhiều "Phương pháp" (protocol) khác nhau, hệ thống hiển thị Dropdown để người dùng chọn xem Protocol nào sẽ làm tiêu đề chính.
-   **Tự động tạo Header động (Dynamic Header):** Sử dụng `buidHeaderInnerHtml()` để sinh ra phần đầu của biên bản gồm Logo, Tên Viện, Tên báo cáo, Tên phương pháp, và Mã số biên bản sinh ngẫu nhiên. Nếu đổi phương pháp chính, Header trong TinyMCE sẽ lập tức được thay thế (tiêm lại HTML) qua DOM.
-   **Tích hợp Mammoth.js (Tải file Word):** Xử lý nhập file `.docx` từ máy tính:
    -   Đọc `ArrayBuffer` -> Mammoth convert -> HTML thuần.
    -   Bọc HTML của Word vào giữa template Header và Footer của hệ thống, rồi "bơm" vào TinyMCE.
-   **Quản lý Hóa chất (BOM Sidebar):**
    -   Tự động trích xuất `consumablesUsed` (hóa chất đã cấp phát) từ tất cả các chỉ tiêu được chọn.
    -   Nhóm hóa chất bằng `uniqueKey` (`analysisId_chemicalSkuId`) để phân biệt độc lập và cho phép chỉnh sửa số lượng tồn thực tế (`consumedQty`).
-   **Lưu biên bản:** Gửi nội dung HTML của biên bản (được lưu tại `rawData.protocolReportHtml`) cùng mảng cập nhật số lượng vật tư tới API bulk update.

### 2.2 `ChemicalInsertModal.tsx`
**Mô tả:** Popup nhỏ gọn dùng bên trong `TestProtocolEditor` để chèn bảng danh sách hóa chất thực tế vào giữa văn bản biên bản.

**Logic & Tính năng chính:**
-   Nhận list `consumablesUsed` truyền trực tiếp từ Editor.
-   Map các trường dữ liệu quan trọng: `chemicalName` (Tên hóa chất), `chemicalCasNumber` (Mã CAS), `lotNumber` (Số lô), `manufacturerName` (NSX), `changeQty` (Số lượng sử dụng), và `chemicalBaseUnit` (Đơn vị).
-   Tạo thành một chuỗi HTML Table hoàn chỉnh bao gồm thead và tbody, và trả về qua callback `onInsert`.
-   TinyMCE sẽ dùng lệnh `insertContent` để chèn chuỗi này vào đúng ngay vị trí con trỏ chuột hiện tại của KTV.

---

## 3. Các Components Nghiệp vụ Hóa chất & Kết quả

### 3.1 `TechnicianChemicalAllocationModal.tsx`
**Mô tả:** Modal "Gợi ý hóa chất FEFO". Đây là lõi nghiệp vụ xử lý trừ kho hoàn toàn tự động dựa trên hóa chất mặc định.

**Logic & Tính năng chính:**
-   **Bước 1: Lấy BOM:** Fetch danh sách hóa chất tiêu chuẩn cho tập hợp các chỉ tiêu đã chọn.
-   **Bước 2: Ước tính FEFO:** Gửi list hóa chất tới backend API (Estimate). Backend duyệt kho hàng, sắp xếp theo Lô Hết Hạn Gần Nhất (FEFO). KTV sẽ xem trước list được duyệt. KTV có thể điều chỉnh lại lượng hóa chất (nếu lỡ tay làm đổ, hao hụt).
-   **Bước 3: Thực hiện cấp phát:** Xác nhận API (AllocateStock), tạo ra các `transactionBlock` trừ kho thực tế và tạo `picking list` (chỉ dẫn lấy chai nào, vị trí kệ nào trong kho cho KTV).
-   **Xử lý UI:** Quản lý giao diện state phức tạp (Nhập lượng -> Tính -> Duyệt -> Báo cáo).

### 3.2 `TechnicianChemicalRequestsTab.tsx`
**Mô tả:** Một Tab chuyên biệt nằm trong `TechnicianWorkspace` để hiển thị lịch sử cấp phát hóa chất của KTV.

**Logic & Tính năng chính:**
-   Fetching API lấy danh sách các giao dịch (Transaction Blocks) có type `Allocation` (Cấp phát) và được thực hiện bởi KTV đang đăng nhập (`user?.identityId`).
-   Hiển thị danh sách phiếu (ID phiếu, thời gian, trạng thái...).
-   Chức năng **Hoàn trả (Return):** Nếu KTV dùng dư hóa chất, có thể làm lệnh hoàn trả ngược lại kho (Sử dụng `ChemicalReturnModal` ở ngoài thư mục này) thông qua button thao tác ở từng record.

### 3.3 `TechnicianBulkEntryModal.tsx`
**Mô tả:** Modal nhập nhanh kết quả (Result) hàng loạt theo danh sách lưới (Table).

**Logic & Tính năng chính:**
-   Render danh sách row các chỉ tiêu đang chọn dưới dạng table. Mỗi dòng có `Input` (nhập giá trị kêt quả đo) và `Select` (Đánh giá Đạt/Không đạt - Status).
-   **Tính năng Điền nhanh (Fill Down):** Có nút "Điền xuống". Nút này sẽ sao chép Kết quả và Đánh giá hiện tại rồi dán cho **tất cả các record nằm phía dưới có CÙNG TÊN CHỈ TIÊU**. Việc điền sẽ tự động dừng lại nếu gặp tên chỉ tiêu khác. Cực kỳ hữu dụng khi KTV làm song song 1 lô mẫu giống nhau.
-   Push toàn bộ lên hệ thống `updateBulk` đồng loạt, cập nhật status sang `DataEntered` (Đã nhập kết quả) để sẵn sàng trình Tổ trưởng soát xét (TechReview).

---

## Tổng kết Data Flow
1. Cấu hình ban đầu nằm ở `matrix` (giá, phương pháp, hóa chất chuẩn LOD, LOQ...).
2. KTV nhận các `analysis` (sinh ra từ matrix).
3. Sử dụng `TechnicianChemicalAllocationModal` để sinh vật tư dùng thực tế (`consumablesUsed`).
4. KTV gõ kết quả sơ bộ qua `TechnicianBulkEntryModal`.
5. Cuối cùng, KTV tổng hợp nội dung văn bản chứng nhận qua `TestProtocolEditor`, đính kèm bảng hóa chất `ChemicalInsertModal`, điều chỉnh số lượng thực hao hụt và chốt lại công đoạn.
