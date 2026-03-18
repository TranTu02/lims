# Technician Module (Khu vực Kỹ thuật viên)

## 1. Giới thiệu chức năng

Module này cung cấp môi trường làm việc chính (`Workspace`) cho các kỹ thuật viên (Technician) trong phòng lab. Kỹ thuật viên sử dụng module này để:

- Nhận các chỉ tiêu phân công (`Pending` -> `Testing`).
- Xem danh sách các chỉ tiêu đang thực hiện (`Testing`) và các chỉ tiêu cần làm lại (`ReTest`).
- Thực hiện nhập kết quả hàng loạt (`Bulk Entry`).
- Lập biên bản thử nghiệm (`Test Protocol Editor`).
- Đề xuất và cấp phát hóa chất (`Chemical Requests`).

## 2. Các Component Chính

| Component | Trách nhiệm (Responsibility) |
| --- | --- |
| `TechnicianWorkspace.tsx` | Màn hình làm việc tổng quan. Chứa hệ thống Tab (Chờ nhận, Đang thử nghiệm, Cần làm lại, Yêu cầu hóa chất). Hỗ trợ chọn nhiều dòng (bao gồm kéo thả `drag-to-select`) để thực hiện thao tác hàng loạt (Nhận chỉ tiêu, Nhập KQ, Lập biên bản). Tích hợp các modal xử lý nghiệp vụ. Sử dụng API `processing` thay vì `list` để tối ưu hóa phạm vi dữ liệu hiển thị. |
| `TestProtocolEditor.tsx` | Trình soạn thảo biên bản thử nghiệm nâng cao. Cho phép nhập thông tin từ file `.docx` (sử dụng thư viện `mammoth`), chỉnh sửa nội dung dưới dạng HTML, và áp dụng custom CSS (căn trái, font-weight) trong bảng để nhất quán khi xuất PDF. Hỗ trợ cấu trúc lưu kết quả và xuất báo cáo PDF tự động cho biên bản. |
| `TechnicianBulkEntryModal.tsx` | Nhập kết quả phân tích cho nhiều chỉ tiêu cùng một lúc. |
| `TechnicianChemicalRequestsTab.tsx` / `Modal` | Quản lý vòng đời yêu cầu cấp phát, tự động đề xuất lô hóa chất theo cơ chế FEFO. |

## 3. Kiến trúc Luồng Dữ liệu (Data Flow)

- **API Queries:** Sử dụng `useAnalysesProcessing` từ `src/api/analyses.ts` thay vì `useAnalysesList` mặc định để chỉ fetch về những chỉ tiêu đang trong quá trình xử lý (chưa đóng) giúp tăng hiệu năng.
- **Lọc theo Tab:**
  - Tab *Chờ nhận*: `["Pending", "Ready"]`
  - Tab *Đang thử nghiệm*: `["Testing"]`
  - Tab *Cần làm lại*: `["ReTest"]`
- **Actions (Hành động):** Các nút thao tác (như Nhập kết quả lô, Lập biên bản) được kích hoạt linh hoạt (không bị `disabled`) cho cả phần *Đang thử nghiệm* và *Cần làm lại*.
- **Nhận diện Icon:**
  - `FilePenLine`: Icon Lập/Chỉnh sửa biên bản (Thao tác thay đổi/nhập liệu).
  - `FileText`: Icon Xem trước biên bản đã tạo (Read-only Document preview).

## 4. Đặc tả UI/UX

- Đồng bộ bảng dữ liệu theo quy chuẩn: Các dữ liệu dạng Text và thao tác trong Table (kể cả Header) đều được căn trái (`text-left`, `justify-start`) để tăng tính dễ đọc.
- Giữ logic chọn dòng nâng cao (kéo chuột để chọn nhiều hàng - Multi-row drag selection).
