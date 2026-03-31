# Protocols – Phương pháp (`library/protocols`)

## Tổng quan

Quản lý danh sách **phương pháp phân tích** (Protocols). Mỗi phương pháp gồm: mã hiệu, tiêu đề, nguồn gốc, mô tả, chứng nhận (VILAS/TDC), danh sách chỉ tiêu, hóa chất, hồ sơ SOP, và tài liệu liên quan.

## Danh sách file

| File                        | Mô tả                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ProtocolsView.tsx`         | Component chính: quản lý toàn bộ state, API, danh sách.                                                                              |
| `ProtocolsTable.tsx`        | Bảng danh sách với filter Excel-style. Cột: Code, Title, Source, Accreditation, Actions                                              |
| `ProtocolDetailPanel.tsx`   | Panel chi tiết bên phải khi click vào hàng. Hiển thị hồ sơ SOP và tài liệu riêng biệt.                                               |
| `ProtocolDetailModal.tsx`   | Modal chi tiết (popup toàn màn hình), kèm bảng hóa chất và danh sách tài liệu chi tiết.                                              |
| `ProtocolFormModal.tsx`     | Modal tạo mới / chỉnh sửa phương pháp. Hỗ trợ bộ chọn tài liệu theo loại (SOP vs DOC) và quản lý công nhận chi tiết theo ngày.       |
| `ProtocolMatrixManager.tsx` | Quản lý danh sách các ma trận liên quan đến phương pháp này. Tích hợp MatricesCreateModal/EditModal.                                 |

## Luồng hoạt động

1. **Xem danh sách**: `ProtocolsView` gọi `useProtocolsList` với phân trang server-side
2. **Xem chi tiết**: Click hàng → `ProtocolDetailPanel` (sidebar)
    * Tự động lọc tài liệu thành 2 danh sách riêng: **Hồ sơ SOP** (loại `PROTOCOL_SOP`) và **Tài liệu liên quan** (loại `PROTOCOL_DOC`).
3. **Tạo/Chỉnh sửa**: Click nút Add/Edit → Mở `ProtocolFormModal`.
    * **Phân loại tài liệu**: Khi chọn đính kèm hoặc tải lên, hệ thống gọi `searchDocuments` với filter `documentType` tương ứng để tránh nhầm lẫn.
    * **Quản lý công nhận**: Sử dụng `AccreditationTagInput` tích hợp Enum API. Mỗi mã hiệu (VILAS, TDC...) cho phép nhập riêng **Ngày cấp** và **Ngày hết hạn**.
    * **Chế độ Edit**: Modal mở rộng (80% width) với layout 2 cột.
4. **Quản lý Ma trận**: `ProtocolMatrixManager` gọi `MatricesCreateModal` và `MatricesEditModal`.

## Quản lý Tài liệu (Document Management)

Mỗi phương pháp phân tích quản lý hai loại tài liệu chính:

* **PROTOCOL_DOC**: Các tài liệu đính kèm công khai, hướng dẫn sử dụng,...
* **PROTOCOL_SOP**: Các quy trình thực hành chuẩn (SOP), thường chỉ dành cho bộ phận kỹ thuật hoặc quản lý.

## Quản lý Công nhận (Accreditation)

Sử dụng cấu hình JSONB chi tiết:
* **Nguồn**: `/v2/enum/get/list?enumType=protocolAccreditation`
* **Dữ liệu**: `{ "CODE": { "registrationDate": "DD/MM/YYYY", "expirationDate": "DD/MM/YYYY" } }`
* **Giao diện**: Cho phép Bật/Tắt (Enable/Disable) từng loại công nhận ngay trên form.

## API Endpoints

* `GET /v2/protocols/get/list` – Danh sách
* `GET /v2/protocols/get/full` – **Full protocol snapshot** (SOPs + Docs + Matrices)
* `POST /v2/protocols/create` – Tạo mới
* `POST /v2/protocols/update` – Cập nhật
* `GET /v2/documents/get/list?documentType=...` – Tìm kiếm tài liệu theo loại
