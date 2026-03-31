# TÀI LIỆU PHÂN HỆ GENERAL INVENTORY (V2)

**Vị trí:** `src/components/inventory/general`

---

## 1. TỔNG QUAN KIẾN TRÚC (SKU - INVENTORY TIERED MODEL)

Phân hệ `General Inventory` (Kho Dụng cụ & Thiết bị) đã được tái cấu trúc sang mô hình **Tách biệt Danh mục (SKU) và Thực thể vật lý (Inventory)**.

- **LabSku (`labSkus` - Danh mục)**: Đóng vai trò là Master Data, tập hợp thông tin chung về Nhãn hiệu, Model, Thông số kỹ thuật chuẩn, Phân loại SKU.
- **LabInventory (`labInventories` - Kho/Vật tư)**: Quản lý hàng tồn kho hoặc thực thể vật lý cụ thể. Ánh xạ 1-N tới `LabSku`. Theo dõi số Serial, Vị trí kho, Trạng thái (Ready, InUse), Số lượng tồn, Hạn hiệu chuẩn. (Dữ liệu cache: `labSkuName`, `labSkuType` để giảm tải Join).
- **AssetActivityLog (`assetActivityLogs` - Sổ cái truy vết)**: Ghi log toàn bộ luân chuyển, bảo trì và sử dụng tài sản liên quan.

---

## 2. CẤU TRÚC COMPONENTS & FILES

| File / Component | Chức Năng |
| :--- | :--- |
| `GeneralInventoryLayout.tsx` | Layout chính quản lý 3 Tabs: `Vật tư - Kho` (Equipment), `Danh mục thiết bị & Dụng cụ` (LabTools), `Sổ cái truy vết` (ActivityLogs). |
| `EquipmentTab.tsx` | UI Quản lý các cá thể thực tế (`labInventories`). Hỗ trợ hiển thị Multi-Filter trực tiếp (Inline Filter) trên Header Cột (Loại SKU, Trạng thái) và Pagination. |
| `EquipmentEditModal.tsx` | Cửa sổ tạo mới/chỉnh sửa một bản ghi kho (Inventory). Hỗ trợ upload tài liệu liên quan. |
| `EquipmentDetailPanel.tsx` | Panel trượt ngang xem chi tiết Inventory, lịch sử sửa đổi và tài liệu (Documents). |
| `LabToolsTab.tsx` | UI Quản lý dữ liệu gốc (`labSkus`). Danh mục Máy móc, Dụng cụ hoặc Hóa chất tiêu hao. |
| `LabToolEditModal.tsx` | Cửa sổ khai báo Master Data cho danh mục SKU. |
| `AssetActivityLogsTab.tsx` | UI xem truy vết vòng đời, kiểm kê, lịch sử hiệu chuẩn, giao nhận. |

---

## 3. LOGIC XỬ LÝ QUAN TRỌNG

### 3.1. Đồng bộ State với URL (URL-Driven State)

Module tận dụng tối đa URL làm "Single Source of Truth" thông qua `useSearchParams` từ `react-router-dom`:

- **Bảo toàn ngữ cảnh**: Khi người dùng chia sẻ link (Share Link) hoặc tải lại trang (F5), tất cả các thông số như **Từ khóa**, **Bộ lọc**, **Trang hiện tại** đều không thay đổi.
- **Param Pattern**: `?page=1&itemsPerPage=20&search=hplc&labSkuType=Tool&labInventoryStatus=Ready,InUse`
- **Xử lý UX**: 
  - Đổi Filter (Checkbox Lọc) -> Trở về Trang 1 tự động (`page=1`).
  - Đổi Items/Page -> Trở về Trang 1 tự động (`page=1`).

### 3.2. Mapping Filter cho ListQuery (`api.get`)

Luồng call API cho các danh sách (List) tuân thủ quy chuẩn truyền Object Parameter (`query:`):

```typescript
// src/api/generalInventory.ts -> buildListQuery(...)
function buildListQuery(input?: { query?: ListQuery }) {
    return {
        // Backend yêu cầu array param được suffix bởi ngoặc vuông (tuân theo API_RULE.md)
        "labSkuType[]": input?.query?.labSkuType,        
        "labInventoryStatus[]": input?.query?.labInventoryStatus,
        search: input?.query?.search,
        page: input?.query?.page,
        itemsPerPage: input?.query?.itemsPerPage,
    }
}
```

```tsx
// Inside EquipmentTab.tsx
const { data, isLoading } = useLabInventoryList({ 
    query: {
         page: safePage,
         itemsPerPage: safeItemsPerPage,
         labSkuType: ["Tool", "Equipment"],     // Multiple Choices
         labInventoryStatus: ["Ready"]
    }
});
```

### 3.3. Multi-Select Inline / Dropdown Filter

Nút "Lọc" không tách rời hiển thị thành cụm ngoài thanh Toolbar mà **được tích hợp ngay trên TableHead** chuyên dụng.

- Sử dụng `<DropdownMenuTrigger>` gói bên ngoài `<Button variant="ghost">` ở trong tiêu đề `<TableHead>`.
- Hiệu ứng trực quan trực tiếp: **Icon Filter (`lucide-react`)** sẽ nhuộm màu (*text-blue-500*) để nhắc nhở người dùng cột đó đang bị lọc ẩn dữ liệu.
- Quản lý Logic trong Custom Hook update URL.

### 3.4. Quản lý Sổ cái truy vết (Asset Activity Logs)

Chỉ có thể tự động thêm thông qua Hook Event API hoặc manual Insert. Toàn bộ record đều Immutable (Không hỗ trợ Update - chỉ có theêm/xóa/đè mới nguyên bản).
Dữ liệu lưu dạng Snapshot (thông tin Object tại thời điểm bị thao tác) trong Object `logData` dạng `JSONB`.

---

## 4. QUY CHUẨN UX/UI

1. **Naming Conventions**: 
   - `Danh mục thiết bị & Dụng cụ` thay vì "Thiết bị".
   - `Vật tư - Kho` thay vì "Equipment Items".
   - `Sổ cái truy vết` thay vì "Lịch sử".
2. **Denormalization để giảm Join**: Data trên Tab "Vật tư - Kho" có thể query/search lên trường `labSkuName` và hiển thị trực tiếp mà không cần Backend join DB gây quá tải.
3. **Empty State & Loading**: Tất cả table đều check trạng thái `isLoading` -> rendering Skeleton,  và trạng thái `items.length === 0` -> Empty warning message theo chuẩn i18n (`t("..."))`.
4. **Pagination Bottom**: Nằm gọn ở Footer của Tab `<EquipmentTab>` và luôn check logic `meta.totalPages > 1` mới xuất hiện để tối ưu khoảng trống dọc màn hình.
