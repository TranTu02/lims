# Tài liệu Hướng dẫn - Quản lý Lưu Mẫu (Sample Storage)

Tài liệu này mô tả chi tiết kiến trúc UI, cấu trúc thư mục, chức năng của từng file component và luồng logic chính trong chức năng **"Lưu mẫu"** thuộc module Inventory.

---

## 1. Cấu trúc thư mục (`src/components/inventory/samples/`)

Thư mục này chứa toàn bộ các components phục vụ cho việc quản lý vị trí lưu các mẫu sau khi tiếp nhận, bao gồm các tab hiển thị trạng thái và các modal thao tác hàng loạt.

```text
src/components/inventory/samples/
├── SampleStorageBoard.tsx        # File container chính (Board) điều hướng giữa 3 Tab
├── SamplePendingList.tsx         # Tab 1: Danh sách "Mẫu chờ lưu"
├── SampleRetainedList.tsx        # Tab 2: Danh sách "Mẫu đang lưu"
├── SampleDisposedList.tsx        # Tab 3: Danh sách "Mẫu đã hủy/trả"
├── StorageLocationMap.tsx        # Giao diện kéo thả (Drag & Drop) xếp mẫu vào vị trí
├── BulkStorageUpdateModal.tsx    # Modal cập nhật "Vị trí lưu" hàng loạt (Bulk Assign Location)
└── BulkStatusUpdateModal.tsx     # Modal cập nhật "Trạng thái mẫu" hàng loạt (Bulk Dispose/Return)
```

---

## 2. Giải thích chi tiết từng File vả Chức năng

### 2.1. `SampleStorageBoard.tsx`

- **Vai trò:** Là trang chính wrapper toàn bộ khối UI Lưu mẫu.
- **Chức năng:** Quản lý state `activeTab` để chuyển đổi hiển thị giữa 3 Tabs nội dung:
    - `pending` (Chờ lưu)
    - `retained` (Đang lưu)
    - `disposed` (Đã hủy / Đã trả).

### 2.2. `SamplePendingList.tsx`

- **Vai trò:** Quản lý danh sách các mẫu chưa phân vị trí (`sampleStorageLoc: ["IS NULL"]`).
- **Giao diện:**
    - Hỗ trợ 2 chế độ xem (ViewMode): **Table** (Dạng bảng truyền thống) và **DnD** (Kéo thả).
    - Có ô tìm kiếm (Search input).
    - Cho phép chọn nhiều mẫu (Checkbox) và hiển thị thanh công cụ tiện ích khi tích chọn mẫu (Bulk Action bar).
- **Chức năng:** Nơi người dùng bắt đầu tiến trình chọn vị trí cất giữ cho mẫu. Nếu click nút "Cập nhật vị trí" từ thanh công cụ đa chọn, `BulkStorageUpdateModal` sẽ được mở ra.

### 2.3. `StorageLocationMap.tsx`

- **Vai trò:** Cung cấp giao diện Map trực quan dạng lưới (hoặc kho) để kéo thả mẫu chưa lưu vào đúng tọa độ/khu vực.
- **Chức năng:**
    - Render danh sách các mẫu Pending bên cạnh bản đồ Grid.
    - Sử dụng thư viện `@dnd-kit/core` để bắt lấy thao tác kéo từ mẫu thả vào vị trí cụ thể.
    - Gọi Mutation cập nhật thuộc tính `sampleStorageLoc` cho mẫu ngay khi thả thành công.

### 2.4. `SampleRetainedList.tsx`

- **Vai trò:** Hiển thị danh sách mẫu hiện đang được cất trong kho (`sampleStatus: ["Retained"]`).
- **Giao diện & Chức năng:**
    - Hiển thị đầy đủ vị trí hiện tại.
    - Tích chọn nhiều mẫu (Bulk Actions) hỗ trợ 2 nghiệp vụ chính:
        1. Đổi vị trí lưu hàng loạt thông qua `BulkStorageUpdateModal`.
        2. Xuất kho mẫu (Hủy hoặc Trả cho khách) thông qua `BulkStatusUpdateModal`.

### 2.5. `SampleDisposedList.tsx`

- **Vai trò:** Trang theo dõi lịch sử các mẫu không còn lưu trữ trong phòng Lab (`sampleStatus: ["Returned", "Disposed"]`).
- **Giao diện:** Hiển thị vị trí trước khi báo hủy và thời gian hủy mẫu/trả mẫu thực tế (`sampleDisposalDate`). Không cung cấp bulk action cập nhật nữa.

### 2.6. Các file Modal thao tác hàng loạt

- **`BulkStorageUpdateModal.tsx`**: Nhận vào danh sách `selectedIds`. Chứa input cho phép gõ tên vị trí mới. Khi Submit sẽ gọi API update hàng loạt các mẫu có ID trong mảng.
- **`BulkStatusUpdateModal.tsx`**: Dùng để chuyển trạng thái mẫu từ "Retained" sang "Disposed" (Hủy) hoặc "Returned" (Trả khách hàng). Đồng thời cho phép cập nhật luôn trường ngày tháng (`sampleDisposalDate`).

---

## 3. Luồng xử lý Logic & Data Fetching (Quy tắc API Mới)

### API Client và Query Params

Toàn bộ fetching data sử dụng Client axios được khai báo tại `src/api/samples.ts` kết hợp `@tanstack/react-query` (`useSamplesList`).

- Hệ thống **tự động phân trang trên Server** thông qua hook `useServerPagination(serverTotalPages, 50)` (Mặc định trang hiển thị 50 bản ghi, có thể đổi sang 100, 200, 500).

### Cấu trúc Query áp dụng:

Bất kỳ một request `GET /v2/samples/get/list` nào đên Backend đều tuân thủ nguyên tắc định dạng phẳng (flatten) đối với sort, và gửi mảng tự nhiên đối với filter array điều kiện.

**Ví dụ Tab Pending:**

```json
{
    "page": 1,
    "itemsPerPage": 50,
    "sampleStorageLoc": ["IS NULL"],
    "sortColumn": "createdAt",
    "sortDirection": "DESC"
}
```

**Ví dụ Tab Retained:**

```json
{
    "page": 1,
    "itemsPerPage": 50,
    "sampleStatus": ["Retained"],
    "sortColumn": "createdAt",
    "sortDirection": "DESC"
}
```

**Ví dụ Tab Disposed:**

```json
{
    "page": 1,
    "itemsPerPage": 50,
    "sampleStatus": ["Returned", "Disposed"],
    "sortColumn": "modifiedAt",
    "sortDirection": "DESC"
}
```

_Lưu ý Data Structure Flow:_
Thay vì tự stringify các trường Array qua JSON như trước kia, toàn bộ request hiện tại pass Array trực tiếp vào object param (Rx: `&sampleStatus=Returned&sampleStatus=Disposed`), bảo đảm Backend phân tích tự nhiên được params bằng query parser.

### Xử lý Cập nhật thay đổi (Mutations)

Sau khi thực hiện thành công một thao tác hàng loạt gọi từ hook `useBulkUpdateSamples()`, hệ thống sẽ kích hoạt lệnh bắt React-Query invalidate:

```tsx
await qc.invalidateQueries({ queryKey: samplesKeys.all, exact: false });
```

Điều này khiến toàn bộ các Component danh sách (Pending, Retained...) tự động re-fetch lại dữ liệu mà không cần phải reload trình duyệt, bảo đảm State hiển thị trên Grid luôn đồng nhất và real-time nhất.

---

_Tài liệu này được sinh ra nhằm mục đích chuẩn hóa cấu trúc Code và làm reference cho các team FE member maintain phân hệ Lưu mẫu sau này._
