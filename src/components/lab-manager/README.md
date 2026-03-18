# Lab Manager Module (Quản lý Phòng thí nghiệm)

## 1. Giới thiệu chức năng

Module này cung cấp hệ thống giao diện giám sát và điều hành toàn diện dành cho Quản lý Phòng Lab (Lab Manager). Chức năng chính bao gồm:

- Theo dõi toàn bộ tiến độ phân tích mẫu và chỉ tiêu (`Analyses`).
- Phê duyệt / Soát xét kết quả xử lý (`Approvals`).
- Xử lý các trường hợp ngoại lệ (Ưu tiên, Khiếu nại, Làm lại, Thầu phụ) ở màn hình `Exceptions`.

## 2. Các Component Chính

| Component | Trách nhiệm (Responsibility) |
| --- | --- |
| `LabManagerAnalyses.tsx` | Màn hình hiển thị danh sách tất cả các phân tích. Hỗ trợ nhiều bộ lọc mạnh mẽ tích hợp trên từng cột (FilterPopover). |
| `LabManagerExceptions.tsx` | Màn hình kiểm soát ngoại lệ (Mẫu khẩn, Mẫu/CT khiếu nại, CT làm lại, Thầu phụ). Tái sử dụng bảng dữ liệu tương đương với Analyses view nhưng query filter khác biệt (phụ thuộc tham số đặc thù vào API `processing`). |
| `FilterPopover.tsx` | Component tái sử dụng (Reusable), cung cấp giao diện Popover Command Liste để chọn lọc thông tin trên header của Table. Ví dụ: Lọc Kỹ thuật viên, Nhóm KTV dự kiến, hoặc Lọc theo trạng thái có biên bản đính kèm. |
| `DataEnteredList.tsx` / `TechReviewList.tsx` | Danh sách hiển thị quy trình phê duyệt sau khi KTV nhập kết quả. |

## 3. Quản lý trạng thái và Dữ liệu

- **Filter thông minh trên bảng:** Các trường thông tin bổ sung (`Nhóm phụ trách`, `Người phụ trách`, `Biên bản đính kèm`) được lọc trực tiếp trên `TableHead` thông qua `FilterPopover`. Cột *Xem* cho phép lọc chỉ những phân tích đã đính kèm biên bản PDF (`IS NOT NULL` / `IS NULL`).
- **Hiển thị Marks (Nhãn ưu tiên):**
  - Chức năng tiện ích `getTopAnalysisMarks()` trong `src/lib/utils.ts` giới hạn và ưu tiên hiển thị tối đa 4 nhãn theo thứ tự độ phủ cấu trúc: `Fast` (Khẩn) -> `EX` (Thầu phụ) -> Các trạng thái quan trọng khác (`Complained`, `ReTest`, v.v.).
- **Tích hợp Preview:**
  - `DocumentPreviewButton` tích hợp thẳng vào action list của các bảng giúp thao tác xem thử tài liệu của Manager diễn ra trực tiếp ngay trên trang (dùng Icon `FileText`), tối giản quy trình click liên kết dư thừa.

## 4. Đặc tả giao diện (UI/UX)

- Bảng dữ liệu được chuẩn hóa format (Căn trái toàn diện cho headers và ô dữ liệu), giúp dữ liệu văn bản và thông tin list dễ quét bằng mắt hơn.
- Layout Header loại bỏ các metadata dư thừa khi render tài liệu xuất (kết xuất PDF).
