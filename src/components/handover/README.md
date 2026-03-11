# 📦 Module Bàn giao Mẫu Nội bộ (Internal Handover)

## 📝 Tổng quan

Module này quản lý quy trình bàn giao mẫu thử và chỉ tiêu phân tích từ bộ phận quản lý mẫu sang các Kỹ thuật viên (KTV) hoặc các phòng Lab chuyên môn. Quy trình đảm bảo tính minh bạch, có chứng từ đi kèm (Biên bản bàn giao) và cập nhật trạng thái hệ thống theo thời gian thực.

---

## 🏗️ Cấu trúc Thư mục

```text
handover/
├── HandoverManagement.tsx       # Component chính (Quản lý danh sách & bộ lọc)
├── HandoverDocumentModal.tsx    # Modal biên bản bàn giao (A4 format, TinyMCE)
└── README.md                    # Tài liệu hướng dẫn (File này)
```

---

## 🛠️ Chi tiết các File & Logic

### 1. `HandoverManagement.tsx`

**Chức năng:** Giao diện điều khiển chính, cho phép người dùng tìm kiếm, chọn mẫu và thực hiện bàn giao hàng loạt.

- **Logic Nghiệp vụ:**
    - Lấy danh sách Analysis có trạng thái `Ready` (Sẵn sàng bàn giao).
    - Hỗ trợ phân trang (`page`, `itemsPerPage: 100`).
    - Tìm kiếm nhanh (Debounced Search) theo tên chỉ tiêu, mã mẫu, hoặc KTV.
    - **Grouping Logic:** Khi người dùng chọn nhiều chỉ tiêu và bấm "Bàn giao hàng loạt", hệ thống tự động nhóm các chỉ tiêu này theo từng Kỹ thuật viên (`technicianId`) để tạo ra các biên bản riêng biệt.
- **Tối ưu hóa:**
    - Sử dụng `useDebounce` để giảm tần suất gọi API khi người dùng gõ tìm kiếm.
    - Caching dữ liệu với `staleTime` và `keepPreviousData` để UI không bị giật lag khi chuyển trang.

### 2. `HandoverDocumentModal.tsx`

**Chức năng:** Hiển thị biên bản bàn giao dưới dạng văn bản A4 chuyên nghiệp, cho phép chỉnh sửa nội dung nhanh trước khi in hoặc xuất file.

- **Cấu trúc Biên bản (A4 Layout):**
    - **Header:** Thông tin Viện nghiên cứu (Logo, Tên, Địa chỉ, SĐT).
    - **Title:** "BIÊN BẢN BÀN GIAO MẪU THỬ / CHỈ TIÊU PHÂN TÍCH".
    - **Content:** Bảng danh sách chỉ tiêu (Mã mẫu, Nền mẫu, Chỉ tiêu, Phương pháp, Đơn vị, Hạn trả, Ghi chú).
    - **Footer:** Phần cam kết và chữ ký của bên giao/bên nhận theo đúng chuẩn hành chính.
- **Tính năng đặc biệt:**
    - **TinyMCE Integration:** Sử dụng trình soạn thảo TinyMCE để hiển thị preview chuẩn A4. Người dùng có thể sửa trực tiếp nội dung biên bản nếu cần thiết.
    - **In trực tiếp (Print):** Tích hợp lệnh in của trình duyệt với CSS `@media print` được tối ưu (ẩn header/footer trình duyệt, căn lề chuẩn 10mm).
    - **Xuất PDF (API):** Sử dụng endpoint `/v2/analyses/generate/handover-pdf` để tạo file PDF chuyên nghiệp từ nội dung HTML hiện tại trên editor.
- **Tối ưu hóa:**
    - **Lazy Loading Editor:** Chỉ khởi tạo trình soạn thảo TinyMCE cho Tab đang active. Điều này giúp Modal mở lên cực nhanh ngay cả khi bàn giao cho 20-30 KTV cùng lúc.
    - **Transition State:** Sử dụng `useTransition` để việc chuyển đổi qua lại giữa các Tab KTV mượt mà, không gây khóa giao diện (UI Blocking).

### 3. `hooks/useDebounce.ts` (Utility)

**Chức năng:** Trì hoãn việc cập nhật giá trị search cho đến khi người dùng ngừng gõ (mặc định 300ms).

- Mục đích: Tiết kiệm tài nguyên server và giúp giao diện phản hồi mượt mà hơn.

---

## 🔄 Quy trình Nghiệp vụ (Workflow)

1. **Bước 1: Lọc dữ liệu** - Admin truy cập trang Bàn giao, hệ thống mặc định lọc các mẫu `Ready`.
2. **Bước 2: Chọn mẫu** - Người dùng chọn các chỉ tiêu muốn bàn giao (có thể chọn tất cả 100 dòng/trang).
3. **Bước 3: Xem biên bản** - Bấm nút "Bàn giao". Modal hiện lên với các Tab chia theo từng KTV nhận mẫu.
4. **Bước 4: Chỉnh sửa & In** - Người dùng kiểm tra lại thông tin, có thể sửa nội dung trong editor, sau đó bấm "In" hoặc "Xuất PDF" để lưu trữ hồ sơ giấy.
5. **Bước 5: Xác nhận** - Bấm "Xác nhận bàn giao". Hệ thống sẽ gọi API cập nhật trạng thái `analysisStatus` sang trạng thái tiếp theo trong quy trình Lab.

---

## 🎨 Quy chuẩn Thiết kế (Styling)

- **Layout A4:** Sử dụng kích thước tĩnh `210mm x 297mm` trong preview để người dùng dễ hình dung kết quả in.
- **Margins:**
    - Lề trên/phải/trái: 10mm.
    - Lề dưới: 8mm (được xử lý thông qua `tfoot` của table để đảm bảo nội dung không bị sát mép giấy).
- **Typography:** Sử dụng font Inter/Roboto đồng nhất, kích thước chữ nội dung bảng `10.5px` để tối ưu diện tích hiển thị.
- **Biểu mẫu:** Nhãn "Biên bản bàn giao nội bộ" (thay cho BBBGMTNB) và mã số biên bản được đặt ở góc phải trên cùng.

---

## 🚀 Hướng dẫn Bảo trì/Mở rộng

- **Thêm trường vào bảng:** Chỉnh sửa hàm `generateHandoverHtml` trong file `HandoverDocumentModal.tsx`.
- **Thay đổi Logo/Thông tin Viện:** Cập nhật trong file ngôn ngữ `vi.ts/en.ts` tại key `sampleRequest.institute`.
- **Thay đổi API PDF:** Cập nhật hàm `analysesGenerateHandoverPdf` trong `src/api/analyses.ts`.
