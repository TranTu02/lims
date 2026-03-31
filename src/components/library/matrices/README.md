# Matrices – Cấu hình (`library/matrices`)

## Tổng quan

Quản lý danh sách **cấu hình phân tích** (Matrices). Mỗi cấu hình liên kết một **chỉ tiêu** (Parameter) với một **phương pháp** (Protocol) và **loại mẫu** (Sample Type), kèm thông tin đơn giá, thuế suất, giới hạn phát hiện (LOD/LOQ), thời gian xử lý.

## Danh sách file

| File                        | Mô tả                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `MatricesView.tsx`          | Component chính: state, API call `useMatricesList`, phân trang server-side, quản lý modal create/edit/delete và detail panel |
| `MatricesTable.tsx`         | Bảng danh sách matrices với filter Excel-style cho các cột: Matrix ID, Chỉ tiêu, Phương pháp. Có cột Actions (Edit, Delete)  |
| `MatrixDetailPanel.tsx`     | Panel bên phải hiển thị chi tiết matrix khi click vào hàng trong bảng. Gọi `useMatrixDetail`                                 |
| `MatricesDetailModal.tsx`   | Modal hiển thị chi tiết matrix (dạng popup toàn màn hình)                                                                    |
| `MatricesCreateModal.tsx`   | Modal tạo cấu hình mới: chọn Parameter, Protocol, Sample Type, nhập đơn giá                                                  |
| `MatricesEditModal.tsx`     | Modal chỉnh sửa cấu hình: load dữ liệu hiện tại, cho phép cập nhật                                                           |
| `ParameterSelectPicker.tsx` | Bộ chọn chỉ tiêu dựa trên danh mục chuẩn (Catalog API) để lọc dữ liệu bảng chính xác.                                        |

## Luồng hoạt động

1. **Xem danh sách**: `MatricesView` gọi `useMatricesList` với phân trang server-side (20 items/page)
2. **Lọc (Excel Filter)**:
    * **parameterId**: Sử dụng `ParameterSelectPicker` để chọn tên chỉ tiêu từ danh mục Catalog. Thay vì nhập văn bản tự do, điều này đảm bảo lọc tuyệt đối chính xác theo ID của chỉ tiêu.
3. **Xem chi tiết**: Click vào hàng → `MatrixDetailPanel` (sidebar phải) gọi `useMatrixDetail`
4. **Chỉnh sửa**: Click nút Edit → `MatricesEditModal` (popup).
5. **Xóa**: Click nút Delete → `MatricesDeleteConfirm`
6. **Tạo mới**: Click nút Add → `MatricesCreateModal`

## API Endpoints

* `GET /v2/matrices/get/list` – Danh sách (có phân trang, tìm kiếm)
* `GET /v2/matrices/get/detail` – Chi tiết theo `matrixId`
* `POST /v2/matrices/create` – Tạo mới
* `POST /v2/matrices/update` – Cập nhật
* `POST /v2/matrices/delete` – Xóa
* `POST /v2/matrices/filter` – Filter Excel-style bổ sung cho các trường ID.
* `GET /v2alpha/catalog` – Cung cấp danh mục chỉ tiêu cho bộ lọc.
