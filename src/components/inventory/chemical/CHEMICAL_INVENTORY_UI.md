# TÀI LIỆU UI - MODULE QUẢN LÝ KHO HÓA CHẤT

**Thư mục**: `src/components/inventory/chemical/`

Tài liệu này mô tả chi tiết toàn bộ các component UI trong module Quản lý Kho Hóa Chất, bao gồm: mục đích, logic, các đối tượng dữ liệu, cách gọi API, và cơ chế phân trang.

---

## 1. KIẾN TRÚC TỔNG QUAN

### Layout & Routing

File: `ChemicalInventoryLayout.tsx`

Đây là component bố cục (layout) chính chứa hệ thống **7 tab điều hướng** của module:

| Tab              | Component              | Mô tả                      |
| ---------------- | ---------------------- | -------------------------- |
| Hóa chất (SKU)   | `SkusTab`              | Danh mục hóa chất tổng hợp |
| Nhà cung cấp     | `SuppliersTab`         | Quản lý nhà cung cấp       |
| Lọ/Chai          | `InventoriesTab`       | Tồn kho vật lý từng chai   |
| Phiếu xuất/nhập  | `TransactionBlocksTab` | Phiếu giao dịch (Header)   |
| Lịch sử GD       | `TransactionsTab`      | Log chi tiết giao dịch     |
| Phiếu kiểm kê    | `AuditBlocksTab`       | Quản lý đợt kiểm kê        |
| Chi tiết kiểm kê | `AuditDetailsTab`      | Log chi tiết kiểm đếm      |

---

## 2. CƠ CHẾ PHÂN TRANG (PAGINATION)

### Shared Component: `src/components/ui/pagination.tsx`

Component dùng chung cho tất cả các tab. Props:

```typescript
interface PaginationProps {
    currentPage: number;
    totalPages?: number;
    itemsPerPage?: number;
    totalItems?: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
}
```

**Tính năng:**

- Hiển thị nút đầu/cuối, trước/sau trang
- Hiển thị số trang với ellipsis `...` khi có nhiều trang (hiển thị tối đa 2 trang mỗi bên so với trang hiện tại, luôn hiển thị trang đầu và cuối)
- Selector số hàng/trang: `[10, 20, 50, 100]`
- Hiển thị thông tin range: `"1 - 20 / 150"`

### Pattern chuẩn trong mỗi Tab

Mỗi tab đều dùng cùng một pattern state + query:

```typescript
// State phân trang
const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(20);
const [submittedSearch, setSubmittedSearch] = useState(""); // search chỉ kích hoạt khi bấm nút

// Truyền vào hook
useXxxList({
  query: {
    search: submittedSearch,
    page,
    itemsPerPage,
    sortColumn: "createdAt",
    sortDirection: "DESC",
  }
});

// Render Pagination
{result?.pagination && (
  <Pagination
    currentPage={page}
    totalPages={result.pagination.totalPages}
    itemsPerPage={itemsPerPage}
    totalItems={result.pagination.totalItems}
    onPageChange={(p) => setPage(p)}
    onItemsPerPageChange={(iper) => {
      setItemsPerPage(iper);
      setPage(1); // reset về trang 1 khi đổi số hàng
    }}
  />
)}
```

**Quan trọng**: Khi `page` hoặc `itemsPerPage` thay đổi, React Query tự động fetch lại API nhờ `queryKey` chứa toàn bộ `input` dưới dạng JSON chuẩn (xem `chemicalKeys.ts`).

---

## 3. CƠ CHẾ CACHE KEY (chemicalKeys.ts)

File: `src/api/chemicalKeys.ts`

```typescript
export const stableKey = (obj: unknown): string => {
    if (obj === null || typeof obj !== "object") return String(obj);
    return JSON.stringify(obj); // serialize toàn bộ object để dùng làm cache key
};
```

- Mỗi tổ hợp tham số (`page`, `itemsPerPage`, `search`, ...) tạo ra một cache key riêng biệt
- Khi thay đổi trang hay search, React Query nhận diện cache key mới → trigger API call mới
- `keepPreviousData` giúp dữ liệu cũ hiển thị trong khi chờ data mới (không bị giật/trắng màn hình)

---

## 4. API HOOKS (src/api/chemical.ts)

### Cách gọi API list

Tất cả API list gọi theo phương thức `POST` nhưng truyền tham số phân trang qua **query string**:

```typescript
// Tất cả các list API đều dùng pattern này:
api.post<T[]>("/v2/endpoint/get/list", {
    query: { ...DEFAULT_LIST_QUERY, ...input?.query },
    // KHÔNG phải body: { ... }
});
```

> **Lý do**: Backend đọc phân trang từ query string (`req.query`), không phải từ request body (`req.body`).

### Danh sách hooks

| Hook                               | Endpoint                                 | Dùng trong Tab         |
| ---------------------------------- | ---------------------------------------- | ---------------------- |
| `useChemicalSkusList`              | `/v2/chemicalskus/get/list`              | `SkusTab`              |
| `useChemicalSuppliersList`         | `/v2/chemicalsuppliers/get/list`         | `SuppliersTab`         |
| `useChemicalInventoriesList`       | `/v2/chemicalinventories/get/list`       | `InventoriesTab`       |
| `useChemicalTransactionBlocksList` | `/v2/chemicaltransactionblocks/get/list` | `TransactionBlocksTab` |
| `useChemicalTransactionsList`      | `/v2/chemicaltransactions/get/list`      | `TransactionsTab`      |

Tất cả hooks đều có:

```typescript
placeholderData: keepPreviousData; // giữ data cũ khi chờ data mới
```

---

## 5. CHI TIẾT CÁC TAB

### 5.1 SkusTab — Danh mục SKU Hóa chất

**File:** `SkusTab.tsx`

**Mục đích:** Hiển thị toàn bộ danh sách hóa chất cấp phân loại (tổng), cho phép tìm kiếm và xem chi tiết.

**Đối tượng dữ liệu** (`ChemicalSku`):

| Trường                      | Kiểu   | Mô tả                                     |
| --------------------------- | ------ | ----------------------------------------- |
| `chemicalSkuId`             | string | ID dạng `SKU-CHEM-xxx`                    |
| `chemicalName`              | string | Tên hóa chất                              |
| `chemicalCASNumber`         | string | Số CAS theo tiêu chuẩn quốc tế            |
| `chemicalBaseUnit`          | string | Đơn vị (ml, g, bottle...)                 |
| `chemicalTotalAvailableQty` | number | Tồn kho tổng (tính từ tất cả chai)        |
| `chemicalReorderLevel`      | number | Ngưỡng tồn kho tối thiểu                  |
| `chemicalHazardClass`       | string | Phân loại nguy hiểm (Độc hại, Dễ cháy, Ăn mòn...) |

**Interaction:**

- Click vào hàng → mở `SkuDetailPanel` (panel bên phải)
- Button "Thêm Hóa chất" → chưa implement

---

### 5.2 SuppliersTab — Danh sách Nhà cung cấp

**File:** `SuppliersTab.tsx`

**Mục đích:** Quản lý thông tin các nhà cung cấp hóa chất.

**Đối tượng dữ liệu** (`ChemicalSupplier`):

| Trường                      | Kiểu     | Mô tả                                                           |
| --------------------------- | -------- | --------------------------------------------------------------- |
| `chemicalSupplierId`        | string   | ID dạng `SUP-xxx`                                               |
| `supplierName`              | string   | Tên nhà cung cấp                                                |
| `supplierTaxCode`           | string   | Mã số thuế                                                      |
| `supplierStatus`            | enum     | `Active`, `Inactive`, `Blacklisted`                             |
| `supplierEvaluationScore`   | number   | Điểm đánh giá NCC (0–100)                                       |
| `supplierContactPerson`     | array    | Danh sách liên hệ `[{contactName, contactEmail, contactPhone}]` |
| `supplierIsoCertifications` | string[] | Danh sách chứng chỉ ISO                                         |

**Badge trạng thái:**

| Giá trị       | Nhãn hiển thị   | Màu     |
| ------------- | --------------- | ------- |
| `Active`      | Đang hoạt động  | Xanh lá |
| `Inactive`    | Ngừng hoạt động | Xám     |
| `Blacklisted` | Danh sách đen   | Đỏ      |

---

### 5.3 InventoriesTab — Tồn kho Vật lý (Lọ/Chai)

**File:** `InventoriesTab.tsx`

**Mục đích:** Hiển thị danh sách toàn bộ chai/lọ hóa chất vật lý trong kho, trạng thái từng chai.

**Đối tượng dữ liệu** (`ChemicalInventory`):

| Trường                | Kiểu     | Mô tả                           |
| --------------------- | -------- | ------------------------------- |
| `chemicalInventoryId` | string   | Barcode/ID chai, dạng `BTL-xxx` |
| `chemicalSkuId`       | string   | Liên kết tới SKU                |
| `lotNumber`           | string   | Số lô sản xuất                  |
| `storageBinLocation`  | string   | Vị trí lưu trữ vật lý           |
| `currentAvailableQty` | number   | Lượng còn lại trong chai        |
| `inventoryStatus`     | enum     | Trạng thái hiện tại             |
| `expDate`             | datetime | Hạn sử dụng in trên vỏ          |
| `openedDate`          | datetime | Ngày mở nắp lần đầu             |
| `openedExpDate`       | datetime | Hạn sử dụng sau khi mở nắp      |

**Badge trạng thái chai:**

| Giá trị       | Nhãn hiển thị | Màu        |
| ------------- | ------------- | ---------- |
| `New`         | Mới           | Xanh lá    |
| `InUse`       | Đang dùng     | Xanh dương |
| `Quarantined` | Kiểm dịch     | Vàng       |
| `Empty`       | Hết           | Xám        |
| `Expired`     | Hết hạn       | Đỏ         |
| `Disposed`    | Đã huỷ        | Xám        |

---

### 5.4 TransactionBlocksTab — Phiếu Xuất/Nhập Kho

**File:** `TransactionBlocksTab.tsx`

**Mục đích:** Hiển thị danh sách các phiếu giao dịch (Header), mỗi phiếu đại diện cho một đợt nhập/xuất/điều chỉnh kho. Cho phép tạo phiếu mới.

**Đối tượng dữ liệu** (`ChemicalTransactionBlock`):

| Trường                       | Kiểu     | Mô tả                                        |
| ---------------------------- | -------- | -------------------------------------------- |
| `chemicalTransactionBlockId` | string   | Mã phiếu, dạng `TRB-xxx`                     |
| `transactionType`            | enum     | Loại phiếu: `IMPORT`, `EXPORT`, `ADJUSTMENT` |
| `referenceDocument`          | string   | Số chứng từ tham chiếu (PO, Request...)      |
| `createdBy`                  | string   | ID người tạo phiếu                           |
| `createdAt`                  | datetime | Thời điểm tạo                                |

**Badge loại phiếu:**

| Giá trị      | Nhãn       | Màu        |
| ------------ | ---------- | ---------- |
| `IMPORT`     | Nhập kho   | Xanh lá    |
| `EXPORT`     | Xuất kho   | Đỏ         |
| `ADJUSTMENT` | Điều chỉnh | Xanh dương |

**Modal Tạo Phiếu (`CreateBlockModal`):**

Giao diện tạo phiếu được thiết kế phân chia thành 2 phần (Tabs/Views) để hỗ trợ cả việc quản lý chi tiết lẫn in ấn tổng hợp:

1. **Danh sách Chi tiết (Details View):**
    - Quản lý **từng thao tác vật lý nhỏ nhất** (Line Items).
    - Cho phép chọn nhiều dòng trên cùng 1 chai/lọ (`chemicalInventoryId`) nếu cần xuất bù cho nhiều chỉ tiêu (`analysisId`) khác nhau (Quan hệ 1:1 giữa Dòng Item và Analysis).
    - Có thể dùng nút "Duplicate" để nhân bản nhanh 1 chai đang chọn lên dòng mới hoặc quét lại máy quét QR code.
    - Điền số lượng, mã phân tích (nếu EXPORT), ghi chú cho từng dòng riêng biệt.

2. **Danh sách Tổng Hợp (Summary View):**
    - Gom nhóm (Group by) tự động theo mã chai/lọ (`chemicalInventoryId`). Mỗi chai chỉ xuất hiện **1 lần duy nhất**.
    - Cột **Tổng Giao Dịch** tự cộng dồn `changeQty`.
    - Cột **Các Chỉ Tiêu (Analyses)** tự động nối chuỗi các mã phân tích (VD: `ANL-101, ANL-102`).
    - Đây là nguồn dữ liệu chính để đối chiếu nhanh và kích hoạt chức năng **In Tem** (đối với phiếu Nhập).

3. Submit → gọi API `POST /v2/chemicaltransactionblocks/createfull`

**Payload gửi lên API tạo phiếu:**

```json
{
    "chemicalTransactionBlock": {
        "transactionType": "EXPORT",
        "referenceDocument": "REQ-001"
    },
    // Gửi danh sách phẳng (Flat list) các Line Items từ Details View
    "chemicalTransactions": [
        {
            "chemicalInventoryId": "BTL-xxx",
            "chemicalSkuId": "SKU-CHEM-xxx",
            "chemicalName": "...",
            "casNumber": "...",
            "changeQty": -50,
            "unit": "ml",
            "actionType": "SUPPLEMENTAL",
            "analysisId": "ANL-101",
            "note": "..."
        },
        {
            "chemicalInventoryId": "BTL-xxx", // Cùng mã chai
            "chemicalSkuId": "SKU-CHEM-xxx",
            "chemicalName": "...",
            "casNumber": "...",
            "changeQty": -10,
            "unit": "ml",
            "actionType": "SUPPLEMENTAL",
            "analysisId": "ANL-102", // Nhưng khác chỉ tiêu
            "note": "..."
        }
    ]
}
```

> **Lưu ý về `changeQty`:**
>
> - `EXPORT` → changeQty là **số âm** (`-Math.abs(...)`)
> - `IMPORT` → changeQty là **số dương** (`+Math.abs(...)`)
> - `ADJUSTMENT` → changeQty là giá trị **người dùng nhập** (có thể âm hoặc dương)

---

### 5.5 TransactionsTab — Lịch sử Giao dịch

**File:** `TransactionsTab.tsx`

**Mục đích:** Hiển thị toàn bộ log chi tiết giao dịch hóa chất (line-item), không phân biệt phiếu.

**Đối tượng dữ liệu** (`ChemicalTransaction`):

| Trường                       | Kiểu   | Mô tả                                    |
| ---------------------------- | ------ | ---------------------------------------- |
| `chemicalTransactionId`      | string | ID log, dạng `TXN-TRB-xxx-01`            |
| `chemicalTransactionBlockId` | string | Liên kết về phiếu Header                 |
| `actionType`                 | enum   | Loại hành động chi tiết                  |
| `chemicalName`               | string | Tên hóa chất (snapshot tại thời điểm GD) |
| `casNumber`                  | string | Số CAS (snapshot)                        |
| `chemicalInventoryId`        | string | Mã chai/lọ                               |
| `changeQty`                  | number | Lượng thay đổi (âm = giảm, dương = tăng) |
| `unit`                       | string | Đơn vị                                   |
| `testName`                   | string | Tên phép thử liên quan (nếu EXPORT)      |
| `analysisId`                 | string | ID phân tích liên quan                   |
| `note`                       | string | Ghi chú                                  |

**Badge `actionType`:**

| Giá trị         | Nhãn         | Màu        |
| --------------- | ------------ | ---------- |
| `INITIAL_ISSUE` | Xuất ban đầu | Đỏ         |
| `SUPPLEMENTAL`  | Bổ sung thêm | Cam        |
| `RETURN`        | Hoàn trả     | Xanh dương |
| `WASTE`         | Thải bỏ      | Xám        |
| `IMPORT`        | Nhập kho     | Xanh lá    |
| `EXPORT`        | Xuất kho     | Đỏ         |
| `ADJUSTMENT`    | Điều chỉnh   | Xanh dương |

**Hiển thị `changeQty` có màu:**

- Dương (`> 0`) → xanh lá, có dấu `+`
- Âm (`< 0`) → đỏ

---

### 5.6 AuditBlocksTab & AuditDetailsTab — Kiểm kê kho

**Mục đích:** Hỗ trợ thực hiện kiểm kê định kỳ, so khớp số lượng thực tế tại kho với số lượng trên hệ thống.

**Modal Chỉnh sửa / Tạo đợt kiểm kê (`AuditBlockEditModal`):**

- **Cơ chế Quét QR**: Hỗ trợ quét mã vạch chai/lọ để tự động thêm vào danh sách kiểm đếm. Hệ thống sẽ tự tra cứu thông tin SKU và Số lượng hệ thống (System Qty) của chai đó.
- **Chống trùng lặp (Duplicate Prevention)**:
    - Một mã chai (`chemicalInventoryId`) chỉ được phép xuất hiện **duy nhất 1 lần** trong 1 phiếu kiểm kê.
    - Khi quét QR: Nếu mã đã có, hệ thống sẽ báo lỗi và không thêm dòng.
    - Khi nhập tay: Nếu nhập mã đã tồn tại ở dòng khác, hệ thống sẽ cảnh báo và từ chối cập nhật.
- **Tính toán chênh lệch**: Số lượng thực tế (`actualAvailableQty`) sẽ được so sánh với số lượng hệ thống để tính ra `varianceQty`.

---

## 6. CÁC PANEL CHI TIẾT (Detail Panels)

Mỗi Tab đều có một panel chi tiết mở ra bên phải màn hình khi người dùng click vào một hàng trong bảng.

| Panel                         | Dùng trong Tab       | Dữ liệu hiển thị                                                 |
| ----------------------------- | -------------------- | ---------------------------------------------------------------- |
| `SkuDetailPanel`              | SkusTab              | Chi tiết SKU + danh sách chai và NCC liên quan (gọi `/get/full`) |
| `SupplierDetailPanel`         | SuppliersTab         | Chi tiết NCC + danh sách SKU cung cấp                            |
| `InventoryDetailPanel`        | InventoriesTab       | Chi tiết chai + thông tin SKU, NCC                               |
| `TransactionBlockDetailPanel` | TransactionBlocksTab | Chi tiết phiếu + danh sách line-items                            |
| `TransactionDetailPanel`      | TransactionsTab      | Chi tiết 1 log + thông tin SKU, phiếu, chai                      |
| `AuditBlockDetailPanel`       | AuditBlocksTab       | Chi tiết đợt kiểm kê + kết quả so khớp                           |

---

## 7. CÁC MODAL CHỈNH SỬA

| Modal                 | Mục đích                       |
| --------------------- | ------------------------------ |
| `SkuEditModal`        | Tạo/Sửa thông tin SKU hóa chất |
| `SupplierEditModal`   | Tạo/Sửa thông tin nhà cung cấp |
| `InventoryEditModal`  | Sửa thông tin chai/lọ vật lý   |
| `AuditBlockEditModal` | Tạo/Sửa đợt kiểm kê            |

---

## 8. GHI CHÚ KỸ THUẬT

### Lý do dùng POST thay vì GET cho list

Backend sử dụng `POST` cho các endpoint `getList` để cho phép truyền filter phức tạp trong tương lai (JSON body), nhưng **tham số phân trang** (`page`, `itemsPerPage`, `search`, `sortColumn`, `sortDirection`) được backend đọc từ `req.query` (query string của URL), vì vậy frontend phải truyền qua `query` trong axios, không phải `body`.

### Tại sao cần stableKey không dùng replacer

Hàm `stableKey` trong `chemicalKeys.ts` dùng `JSON.stringify(obj)` thuần túy (không có replacer). Trước đó, `JSON.stringify(obj, Object.keys(obj).sort())` được dùng với ý định sort key nhưng vô tình lọc ra mọi nested property (vì mảng replacer chỉ whitelist key ở level root), khiến mọi cache key đều là `{"query":{}}` — không trigger được API mới.

### Pattern keepPreviousData

```typescript
placeholderData: keepPreviousData;
```

Được thêm vào mọi hook list để tránh hiện skeleton loading mỗi khi chuyển trang. Data cũ được giữ nguyên cho đến khi data mới về, tạo trải nghiệm smooth hơn.
