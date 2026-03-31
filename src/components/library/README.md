# Library Module (`src/components/library`)

## Tổng quan

Module **Library** quản lý toàn bộ dữ liệu danh mục (catalog) của hệ thống LIMS, bao gồm: **Cấu hình (Matrices)**, **Chỉ tiêu (Parameters)**, **Nhóm chỉ tiêu (Parameter Groups)**, **Phương pháp (Protocols)**, và **Loại mẫu (Sample Types)**.

## Cấu trúc thư mục

```text
library/
├── LibraryHeader.tsx          # Header chung cho tất cả trang (search, add button, title)
├── hooks/                     # Custom hooks dùng chung
│   ├── useDebouncedValue.ts   # Debounce giá trị search
│   ├── useServerPagination.ts # Quản lý phân trang phía server
│   └── useLibraryData.ts      # Types và hooks cho dữ liệu thư viện
├── matrices/                  # Quản lý cấu hình (Matrices)
├── parameterGroups/           # Quản lý nhóm chỉ tiêu
├── parameters/                # Quản lý chỉ tiêu (Parameters)
├── protocols/                 # Quản lý phương pháp (Protocols)
└── sampleTypes/               # Quản lý loại mẫu (Sample Types)
```

## Kiến trúc chung

Mỗi thư mục con (matrices, parameters, ...) tuân theo mẫu kiến trúc sau:

| Component                               | Vai trò                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| `*View.tsx`                             | Component chính (page-level). Quản lý state, gọi API, phân trang    |
| `*Table.tsx`                            | Bảng danh sách có filter Excel-style, sắp xếp, chọn hàng            |
| `*DetailPanel.tsx` / `*DetailModal.tsx` | Hiển thị chi tiết khi click vào hàng. Có nút **Edit** (✏️) optional |
| `*CreateModal.tsx`                      | Modal tạo mới (hoặc chỉnh sửa nếu truyền `initialData`)             |
| `*EditModal.tsx`                        | Modal chỉnh sửa (nếu tách riêng)                                    |
| `*DeleteConfirm.tsx`                    | Dialog xác nhận xóa                                                 |

## Tính năng nổi bật gần đây

1. **Matrices (Cấu hình)**:
    * Hỗ trợ bộ lọc **Chỉ tiêu (parameterId)** lấy trực tiếp từ danh mục (Catalog API), giúp lọc cấu hình chính xác theo tên chỉ tiêu thay vì nhập tay.
2. **Parameters (Chỉ tiêu)**:
    * Hệ thống hóa **Vị trí phụ trách (technicianAlias)** và **Nhóm thực hiện (technicianGroupId)** qua API Enum và Identity.
    * Bộ chọn thông minh (Searchable Combobox) trong form tạo/sửa giúp chuẩn hóa dữ liệu nhân sự phụ trách.
3. **Protocols (Phương pháp)**:
    * **Phân loại tài liệu**: Tách biệt rõ ràng **Tài liệu đính kèm (PROTOCOL_DOC)** công khai và **Hồ sơ SOP (PROTOCOL_SOP)** nội bộ.
    * **Quản lý Công nhận (Accreditation)**: Tích hợp API Enum (`protocolAccreditation`) với cấu hình chi tiết ngày cấp (registrationDate) và ngày hết hạn (expirationDate) cho từng mã hiệu (VILAS, TDC,...).

## API Layer

Tất cả API calls được định nghĩa trong `src/api/library.ts`, bao gồm:

* **CRUD operations**: `list`, `detail`, `full`, `create`, `update`, `delete`
* **React Query hooks**: `useMatricesList`, `useMatrixDetail`, `useProtocolsList`, `useProtocolDetail`, ...
* **Filter API**: `useParametersFilter`, `useSampleTypesFilter`, ...
* **Full data endpoints**: `/v2/protocols/get/full`, `/v2/parameters/get/full`, `/v2/sampleTypes/get/full`
* **Enum API**: Sử dụng `useEnumList` để lấy danh mục động (vị trí phụ trách, loại công nhận).

## Quy ước quan trọng

1. **Cấu trúc Công nhận**: Trường `protocolAccreditation` là một JSONB có cấu trúc `{ [code]: { registrationDate, expirationDate } | boolean }`.
2. **Tài liệu Phương pháp**: Khi đính kèm/tải lên tài liệu trong Protocol, hệ thống tự động lọc theo `documentType` để đảm bảo tài liệu được đặt đúng mục (SOP vs DOC).
3. **DisplayStyle**: Các cột `displayStyle` / `displayTypeStyle` luôn render **2 dòng** (default + eng).
4. **Phân trang**: Sử dụng `useServerPagination` tương tác trực tiếp với API `list` của backend.
