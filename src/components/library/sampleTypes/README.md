# Sample Types – Loại mẫu (`library/sampleTypes`)

## Tổng quan

Quản lý danh sách **loại mẫu** (Sample Types). Mỗi loại mẫu (VD: Nước uống, Nước thải, Đất...) có cấu hình hiển thị (`displayTypeStyle`) với hai phiên bản ngôn ngữ (default + eng).

## Danh sách file

| File                          | Mô tả                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `SampleTypesView.tsx`         | Component chính: state, API, phân trang, quản lý danh sách.                                        |
| `SampleTypesTable.tsx`        | Bảng danh sách với filter Excel-style. Cột: ID, Tên, Display Style, Ngày tạo, Actions              |
| `SampleTypeDetailPanel.tsx`   | Panel chi tiết bên phải khi click vào hàng, hiển thị thông tin chung và danh sách matrices         |
| `SampleTypeFormModal.tsx`     | Modal tạo mới / chỉnh sửa. Chế độ Edit hiển thị layout 2 cột với SampleTypeMatrixManager bên phải. |
| `SampleTypeMatrixManager.tsx` | Quản lý ma trận liên quan đến loại mẫu này. Tích hợp MatricesCreateModal/EditModal.                |

## Luồng hoạt động

1. **Xem danh sách**: `SampleTypesView` gọi `useSampleTypesList` với phân trang server-side (20/page)
2. **Lọc**: Filter Excel-style cho cột: sampleTypeId, sampleTypeName, displayTypeStyle
3. **Xem chi tiết**: Click hàng → `SampleTypeDetailPanel` (sidebar phải)
4. **Tạo/Chỉnh sửa**: Click nút Add/Edit → Mở `SampleTypeFormModal`.
    - **Chế độ Edit**: Modal mở rộng (80% width) với layout 2 cột.
    - **Cột Trái**: Thông tin cơ bản của Loại mẫu.
    - **Cột Phải**: Quản lý ma trận (`SampleTypeMatrixManager`) - cho phép quản lý ma trận nền mẫu của loại mẫu này ngay tại chỗ.
5. **Quản lý Ma trận**: `SampleTypeMatrixManager` gọi `MatricesCreateModal` và `MatricesEditModal`. Khi thêm mới từ đây, `sampleTypeId` sẽ được khóa (locked) theo loại mẫu hiện tại.

## Cột Display Type Style

Cột `displayTypeStyle` hiển thị **2 dòng**:

- Dòng 1: `displayTypeStyle.default` – chữ lớn, màu foreground
- Dòng 2: `displayTypeStyle.eng` – chữ nhỏ, màu muted
- Hỗ trợ markdown inline: `*text*` → _in nghiêng_ qua `renderInlineEm`

## API Endpoints

- `GET /v2/sampleTypes/get/list` – Danh sách (có phân trang, tìm kiếm)
- `POST /v2/sampleTypes/create` – Tạo mới
- `POST /v2/sampleTypes/filter` – Filter Excel-style

## Lưu ý

- `SampleTypeFormModal` nhận prop `initialData?: { sampleTypeName, displayDefault, displayEng }` để hỗ trợ edit
