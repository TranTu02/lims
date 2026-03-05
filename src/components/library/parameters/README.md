# Parameters – Chỉ tiêu (`library/parameters`)

## Tổng quan

Quản lý danh sách **chỉ tiêu phân tích** (Parameters). Mỗi chỉ tiêu đại diện cho một phép đo/phân tích cụ thể (VD: Enterococcus faecalis, Coliform, pH...).

## Danh sách file

| File                         | Mô tả                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ParametersView.tsx`         | Component chính: state, API call `useParametersList`, phân trang, quản lý modal create/edit, detail panel            |
| `ParametersTable.tsx`        | Bảng danh sách với filter Excel-style. Cột: ID, Tên, Technician Alias, Group ID, Status, Display Style, Actions      |
| `ParametersDetailPanel.tsx`  | Panel chi tiết bên phải khi click vào hàng                                                                           |
| `ParameterFormModal.tsx`     | Modal tạo mới/chỉnh sửa chỉ tiêu. Khi ở chế độ chỉnh sửa, hiển thị layout 2 cột với ParameterMatrixManager bên phải. |
| `ParameterMatrixManager.tsx` | Quản lý danh sách các ma trận liên quan đến chỉ tiêu này. Tích hợp MatricesCreateModal/EditModal.                    |
| `MatricesAccordionItem.tsx`  | Component con hiển thị từng matrix liên quan trong panel chi tiết                                                    |

## Luồng hoạt động

1. **Xem danh sách**: `ParametersView` gọi `useParametersList` với phân trang 20 items/page
2. **Lọc**: Filter Excel-style cho các cột: parameterId, parameterName, technicianAlias
3. **Xem chi tiết**: Click hàng → `ParametersDetailPanel` (sidebar phải)
4. **Tạo/Chỉnh sửa**: Click nút Add/Edit → Mở `ParameterFormModal`.
    - **Chế độ Edit**: Modal mở rộng (80% width) với layout 2 cột.
    - **Cột Trái**: Thông tin cơ bản của Chỉ tiêu.
    - **Cột Phải**: Quản lý ma trận (`ParameterMatrixManager`) - cho phép thêm mới/sửa ma trận nền mẫu của chỉ tiêu này ngay tại chỗ.
5. **Quản lý Ma trận**: `ParameterMatrixManager` sử dụng `MatricesCreateModal` và `MatricesEditModal`. Khi thêm mới từ đây, `parameterId` sẽ được khóa (locked) theo chỉ tiêu hiện tại.

## Cột Display Style

Cột `displayStyle` hiển thị **2 dòng**:

- Dòng 1 (chữ lớn): `displayStyleResolved.default`
- Dòng 2 (chữ nhỏ, muted): `displayStyleResolved.eng`
- Hỗ trợ markdown inline: `*text*` được render thành _in nghiêng_ qua `renderInlineEm`

## API Endpoints

- `GET /v2/parameters/get/list` – Danh sách
- `POST /v2/parameters/create` – Tạo mới
- `POST /v2/parameters/filter` – Filter Excel-style
