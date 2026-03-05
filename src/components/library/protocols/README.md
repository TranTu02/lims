# Protocols – Phương pháp (`library/protocols`)

## Tổng quan

Quản lý danh sách **phương pháp phân tích** (Protocols). Mỗi phương pháp gồm: mã hiệu, tiêu đề, nguồn gốc, mô tả, chứng nhận (VILAS/TDC), danh sách chỉ tiêu, loại mẫu, hóa chất, tài liệu đính kèm, và **matrices snapshot**.

## Danh sách file

| File                        | Mô tả                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ProtocolsView.tsx`         | Component chính: quản lý toàn bộ state, API, danh sách.                                                                              |
| `ProtocolsTable.tsx`        | Bảng danh sách với filter Excel-style. Cột: Code, Title, Source, Accreditation, Actions                                              |
| `ProtocolDetailPanel.tsx`   | Panel chi tiết bên phải khi click vào hàng. Có nút **Edit** (✏️) bên cạnh nút Close. Hiển thị matrices snapshot bên dưới documents.  |
| `ProtocolDetailModal.tsx`   | Modal chi tiết (dạng popup toàn màn hình), kèm bảng hóa chất và danh sách tài liệu.Fetch full protocol data via `useProtocolDetail`. |
| `ProtocolFormModal.tsx`     | Modal tạo mới / chỉnh sửa phương pháp. Chế độ Edit hiển thị layout 2 cột với ProtocolMatrixManager bên phải.                         |
| `ProtocolMatrixManager.tsx` | Quản lý danh sách các ma trận liên quan đến phương pháp này. Tích hợp MatricesCreateModal/EditModal.                                 |
| `SearchSelectPicker.tsx`    | Component tìm kiếm + chọn nhiều item (dùng cho parameters, sample types, documents trong modal edit)                                 |

## Luồng hoạt động

1. **Xem danh sách**: `ProtocolsView` gọi `useProtocolsList` với phân trang server-side
2. **Xem chi tiết**: Click hàng → `ProtocolDetailPanel` (sidebar)
    - Tự động fetch full protocol data via `useProtocolDetail` (endpoint `/v2/protocols/get/full`)
    - Hiển thị loading spinner trong khi fetch
    - Sử dụng `displayProtocol` (full data hoặc fallback prop)
3. **Tạo/Chỉnh sửa**: Click nút Add/Edit → Mở `ProtocolFormModal`.
    - **Chế độ Edit**: Modal mở rộng (80% width) với layout 2 cột.
    - **Cột Trái**: Thông tin phương pháp, hóa chất, tài liệu.
    - **Cột Phải**: Quản lý ma trận (`ProtocolMatrixManager`) - cho phép quản lý ma trận nền mẫu của phương pháp này ngay tại chỗ.
4. **Quản lý Ma trận**: `ProtocolMatrixManager` gọi `MatricesCreateModal` và `MatricesEditModal`. Khi thêm mới từ đây, `protocolId` sẽ được khóa (locked) theo phương pháp hiện tại.
5. **Upload tài liệu**: Nút "Tải lên tài liệu" trong modal edit → tạo document → thêm vào `documentIds`.

## Chi tiết hiển thị tài liệu đính kèm (DocumentItem)

Mỗi document trong `ProtocolDetailPanel` / `ProtocolDetailModal` hiển thị:

1. **Title** — Ưu tiên: `jsonContent.documentTitle` → `documentTitle` → `file.fileName` → `documentId`
2. **Status** — `jsonContent.documentStatus` → `documentStatus`
3. **Common Keys** — `jsonContent.commonKeys` → `commonKeys`
4. **Document ID** — Badge nhỏ
5. **Nút Preview** — Gọi `documentApi.url()` → mở `DocumentPreviewModal`

## Matrices Snapshot

Khi API `/v2/protocols/get/full` trả về mảng `matrices`, `ProtocolDetailPanel` hiển thị bảng mini (scrollable max 300px) bên dưới phần tài liệu đính kèm:

| Cột          | Source                               |
| ------------ | ------------------------------------ |
| Tên chỉ tiêu | `parameterName` hoặc `parameterId`   |
| Loại mẫu     | `sampleTypeName` hoặc `sampleTypeId` |
| Phí sau thuế | `feeAfterTax` (format vi-VN)         |

## API Endpoints

- `GET /v2/protocols/get/list` – Danh sách
- `GET /v2/protocols/get/detail` – Chi tiết cơ bản
- `GET /v2/protocols/get/full` – **Full protocol snapshot** (documents + matrices)
- `POST /v2/protocols/create` – Tạo mới
- `POST /v2/protocols/update` – Cập nhật
- `POST /v2/protocols/delete` – Xóa
- `POST /v2/protocols/filter` – Filter Excel-style

## Tính năng nút Edit

Tất cả DetailPanel trong module Library (Protocol, Parameter, Matrix, SampleType) đều hỗ trợ prop `onEdit?`. Khi được cung cấp, nút ✏️ (Pencil) hiển thị bên cạnh nút X (Close).

## i18n Keys

| Namespace                    | Mô tả                         |
| ---------------------------- | ----------------------------- |
| `library.protocols.*`        | Labels chung, columns, form   |
| `library.protocols.detail.*` | Labels panel chi tiết         |
| `library.matrices.*`         | Labels bảng matrices snapshot |

## Lưu ý

- `useProtocolDetail` hook nhận `{ params: { protocolId: string } }`, sử dụng endpoint `/v2/protocols/get/full`
- `Protocol` type trong `library.ts` bao gồm `documents[].jsonContent`, `documents[].file` cho nested data
- Modal create/edit dùng chung cùng một form state (`editForm`), phân biệt bằng `editForm.protocolId`
