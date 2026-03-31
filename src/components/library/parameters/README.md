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
| `TechnicianAliasSelect.tsx`  | Bộ chọn vị trí phụ trách từ Enum API (`technicianAlias`)                                                             |
| `TechnicianGroupIdSelect.tsx`| Bộ chọn nhóm thực hiện từ Identity API                                                                               |

## Luồng hoạt động

1. **Xem danh sách**: `ParametersView` gọi `useParametersList` với phân trang 20 items/page
2. **Lọc**: Filter Excel-style cho các cột: parameterId, parameterName, technicianAlias
3. **Xem chi tiết**: Click hàng → `ParametersDetailPanel` (sidebar phải)
4. **Tạo/Chỉnh sửa**: Click nút Add/Edit → Mở `ParameterFormModal`.
    * **Vị trí & Nhóm thực hiện**: Sử dụng `TechnicianAliasSelect` và `TechnicianGroupIdSelect` để chọn từ danh mục chuẩn thay vì nhập văn bản tự do.
    * **Chế độ Edit**: Modal mở rộng (80% width) với layout 2 cột (Thông tin cơ bản + ParameterMatrixManager).
5. **Quản lý Ma trận**: `ParameterMatrixManager` sử dụng `MatricesCreateModal` và `MatricesEditModal`.

## Cột Display Style

Cột `displayStyle` hiển thị **2 dòng**:

* Dòng 1 (chữ lớn): `displayStyleResolved.default`
* Dòng 2 (chữ nhỏ, muted): `displayStyleResolved.eng`
* Hỗ trợ markdown inline: `*text*` được render thành _in nghiêng_ qua `renderInlineEm`

## API Endpoints

* `GET /v2/parameters/get/list` – Danh sách
* `POST /v2/parameters/create` – Tạo mới
* `POST /v2/parameters/filter` – Filter Excel-style
* `GET /v2/enum/get/list?enumType=technicianAlias` – Danh mục vị trí phụ trách
