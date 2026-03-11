# Components: Reception Module Documentation (`src/components/reception/`)

**Version:** 1.0.0 | **Cập nhật:** 25/02/2026

---

## I. TỔNG QUAN

Module `reception/` xử lý toàn bộ nghiệp vụ **Tiếp nhận mẫu** — từ tạo phiếu nhận, xem chi tiết, quản lý danh sách mẫu + phép thử, đến xóa phiếu. Đây là module trọng yếu nhất của hệ thống LIMS vì nó là điểm bắt đầu của toàn bộ quy trình xét nghiệm.

---

## II. CẤU TRÚC FILE

```
src/components/reception/
├── SampleReception.tsx       # ★ Container chính — Trang tiếp nhận mẫu
├── ReceiptsTable.tsx         # Bảng danh sách phiếu nhận (phân trang, filter, sort)
├── CreateReceiptModal.tsx    # Modal tạo phiếu nhận mới (form phức tạp)
├── ReceiptDetailModal.tsx    # Modal xem/sửa chi tiết phiếu nhận
├── SampleDetailModal.tsx     # Modal xem/sửa chi tiết mẫu thử nghiệm
└── ReceiptDeleteModal.tsx    # Modal xác nhận xóa phiếu
```

---

## III. CHI TIẾT TỪNG COMPONENT

### 3.1 `SampleReception.tsx` — Container Page

**Vai trò:** Layout wrapper cho toàn trang Tiếp nhận mẫu.

**Chức năng:**

- Render `ReceiptsTable` (danh sách phiếu)
- Quản lý state các modal: Create, Detail, Delete
- Truyền callbacks cho table (onRowClick → mở Detail, onDelete → mở Delete)

**Dependencies:** `ReceiptsTable`, `CreateReceiptModal`, `ReceiptDetailModal`, `ReceiptDeleteModal`

---

### 3.2 `ReceiptsTable.tsx` — Bảng danh sách phiếu (25KB)

**Vai trò:** Hiển thị danh sách phiếu nhận dạng bảng với đầy đủ tính năng.

**Chức năng:**

- **Phân trang:** Pagination với `PAGINATION_SIZE` options
- **Tìm kiếm:** Search by receipt code, client name
- **Lọc:** Filter theo `receiptStatus`
- **Sắp xếp:** Sort theo cột (receiptCode, receiptDate, receiptStatus...)
- **Hiển thị:** Badge trạng thái (màu semantic), ngày tháng format, client info
- **Actions:** Click row → mở Detail, nút Delete, nút Create

**Data Source:** `useReceiptsList()` hook từ `src/api/receipts.ts`

**Props chính:**

```typescript
onOpenDetail: (receiptId: string) => void;
onOpenCreate: () => void;
onDelete: (receiptId: string) => void;
```

---

### 3.3 `CreateReceiptModal.tsx` — Tạo phiếu nhận (71KB)

**Vai trò:** Form phức tạp nhất của hệ thống — cho phép tạo phiếu nhận với đầy đủ thông tin.

**Chức năng chính:**

- **Thông tin phiếu:** Mã phiếu, ngày nhận, hạn trả, ưu tiên, phương thức giao
- **Thông tin khách hàng:** Chọn client (autocomplete), contact, sender
- **Danh sách mẫu:** Thêm/xóa nhiều mẫu, mỗi mẫu có:
    - Tên mẫu, loại mẫu, thông tin khách cung cấp
    - Danh sách phép thử (analyses) — chọn từ Matrix catalog
    - Thông tin sản phẩm (sampleInfo) — dynamic key-value pairs
    - Thông tin thử nghiệm (sampleReceiptInfo) — dynamic key-value pairs
- **Ảnh đính kèm:** Upload ảnh mẫu nhận
- **Cấu hình báo cáo:** Ngôn ngữ, số bản cứng, gửi bản mềm
- **Kiểm tra điều kiện:** Seal, nhiệt độ
- **Blind coding:** Tùy chọn ẩn danh mẫu

**Pattern sử dụng:**

- `useReceiptMutationCreateFull()` — Tạo toàn bộ phiếu + mẫu + phép thử trong 1 API call
- Form state quản lý bằng `useState` (không dùng react-hook-form do form quá dynamic)
- Matrix lookup qua `useMatricesList()` từ library API

**Lưu ý thiết kế:**

- Cho phép thêm unlimited samples và analyses
- Dynamic fields (sampleInfo, sampleReceiptInfo) dùng `DraggableInfoTable` component
- Auto-calculate tổng chi phí dựa trên analyses đã chọn

---

### 3.4 `ReceiptDetailModal.tsx` — Chi tiết phiếu (65KB)

**Vai trò:** Hiển thị và cho phép chỉnh sửa chi tiết phiếu nhận.

**Layout:** Chia 2 phần chính:

1. **Thông tin phiếu (3/4 width):** Grid 3 cột hiển thị tất cả fields
2. **Ảnh đính kèm (1/4 width):** Image viewer + thumbnails

**Thông tin hiển thị:**
| Section | Fields |
|:---|:---|
| **Cơ bản** | receiptCode, receiptStatus (Badge), receiptDate, receiptDeadline |
| **Khách hàng** | clientName, clientPhone, clientEmail, clientAddress |
| **Phiếu** | receiptPriority, receiptDeliveryMethod, trackingNumber |
| **Hóa đơn** | invoiceInfo.taxName, invoiceInfo.taxCode |
| **Điều kiện** | conditionCheck.seal, conditionCheck.temp |
| **Báo cáo** | reportConfig.language, reportConfig.copies, reportConfig.sendSoftCopy |
| **Khác** | isBlindCoded, receptionistId/createdBy, receiptNote |

**Bảng Mẫu + Phép thử:**
Hiển thị tất cả samples và analyses trong 1 bảng flatten (mỗi analysis là 1 row). Cột:

- Mã mẫu (sampleId) — rowSpan cho mỗi nhóm mẫu
- Tên mẫu (sampleName) — rowSpan
- Loại mẫu (sampleTypeName) — rowSpan
- Mã phép thử (analysisId) — clickable, scroll to analysis
- Tên chỉ tiêu (parameterName)
- Mã phương pháp (protocolCode)
- KTV phân tích (technicianIds)
- Trạng thái (analysisStatus) — Badge
- Kết quả (analysisResult)

**Chế độ Edit:**

- Bật qua nút "Sửa" trên header
- Tất cả fields trở thành editable (Input, Select, Date picker)
- Save → `useReceiptMutationUpdate()`
- Cancel → revert về data gốc

**Tính năng ảnh:**

- Image viewer với navigation (prev/next)
- Thumbnail strip
- Upload/Delete ảnh
- Tìm ảnh liên quan
- Gửi email với ảnh đính kèm

---

### 3.5 `SampleDetailModal.tsx` — Chi tiết mẫu (37KB)

**Vai trò:** Hiển thị và chỉnh sửa chi tiết một mẫu cụ thể bên trong phiếu nhận.

**Layout:** 3 section chính:

**Section 1: Thông tin phiếu liên quan (1/3 width)**

- receiptCode, clientName, receiptDate

**Section 2: Thông tin mẫu (2/3 width) — Grid 3 cột**
| Field | Type | Editable |
|:---|:---|:---|
| sampleName | text | ✅ |
| sampleClientInfo | text | ✅ |
| sampleTypeName | text | ✅ |
| sampleStatus | Badge | ❌ (readonly) |
| samplePreservation | text | ✅ |
| physicalState | text | ✅ |
| sampleVolume | text | ✅ |
| sampleWeight | number | ✅ |
| sampleStorageLoc | text | ✅ |
| sampleRetentionDate | date | ✅ |
| sampleDisposalDate | date | ✅ |
| sampleNote | text (full-width) | ✅ |

**Section 3: Bảng sản phẩm & thử nghiệm**

- `DraggableInfoTable` cho sampleInfo (productDetails)
- `DraggableInfoTable` cho sampleReceiptInfo (testingInfo)

**Section 4: Danh sách phép thử**
Bảng analyses với các cột:
| Cột | Field | Editable |
|:---|:---|:---|
| Mã phép thử | analysisId | ✅ (Input) |
| Tên chỉ tiêu | parameterName | ✅ (Input) |
| Mã phương pháp | protocolCode | ✅ (Input) |
| Trạng thái | analysisStatus | ✅ (Select dropdown) |
| KTV phân tích | technicianIds | ✅ (Input) |
| Hạn trả KQ | analysisDeadline | ✅ (Date input) |
| Đơn vị | analysisUnit | ✅ (Input) |
| Kết quả | analysisResult | ✅ (Input) |
| Xóa | — | ✅ (Button, chỉ khi edit) |

**Thêm Phép thử (khi edit):**

- Có ô tìm kiếm (Matrix SearchDropdown) để chọn từ thư viện (dùng `useDebouncedValue` + `libraryApi`).
- Tự động điền LOD, LOQ, Protocol Code từ Matrix.

**Section 5: File đính kèm**

- Upload/quản lý files liên quan đến mẫu

---

### 3.6 `ReceiptDeleteModal.tsx` — Xóa phiếu (4KB)

**Vai trò:** Dialog xác nhận xóa phiếu nhận.

**Chức năng:**

- Hiển thị mã phiếu sắp xóa
- Yêu cầu xác nhận
- Gọi `useReceiptMutationDelete()` khi confirm
- Toast success/error

---

## IV. LUỒNG TƯƠNG TÁC GIỮA CÁC COMPONENT

```
SampleReception (Container)
  │
  ├─ ReceiptsTable
  │    ├─ Click row → ReceiptDetailModal.open(receiptId)
  │    ├─ Click "Tạo" → CreateReceiptModal.open()
  │    └─ Click "Xóa" → ReceiptDeleteModal.open(receiptId)
  │
  ├─ ReceiptDetailModal
  │    ├─ Click sampleId/analysisId → SampleDetailModal.open(sampleId, focusAnalysisId?)
  │    ├─ Edit + Save → receiptsUpdate()
  │    └─ Email → gửi mail với ảnh
  │
  ├─ SampleDetailModal
  │    ├─ Edit + Save → callback lên ReceiptDetailModal.handleSaveSample()
  │    └─ Delete analysis → cập nhật local state
  │
  ├─ CreateReceiptModal
  │    └─ Submit → receiptsCreateFull() → refresh table
  │
  └─ ReceiptDeleteModal
       └─ Confirm → receiptsDelete() → refresh table
```

---

## V. QUY TẮC KHI SỬA/THÊM COMPONENT TRONG MODULE NÀY

1. **Types:** Import từ `@/types/receipt.ts`. Mẫu dùng `ReceiptSample`, phép thử dùng `ReceiptAnalysis`.
2. **API:** Import hooks từ `@/api/receipts.ts` (`useReceiptsList`, `useReceiptMutationUpdate`...).
3. **i18n:** Keys nằm trong namespace `reception.*` và `lab.*`. Luôn dùng `String(t("key"))`.
4. **Null handling:** Mọi field đều phải handle `null` → hiển thị `"-"`.
5. **Status Badge:** Dùng helper `getReceiptStatusBadge()` và `getAnalysisStatusBadge()` trong `ReceiptDetailModal.tsx`.
6. **Edit mode:** State `isEditing` toggle giữa view/edit. Form lưu vào `editedReceipt`/`editedSample` state.
7. **Images:** Quản lý qua `fileApi` từ `@/api/files.ts`, files gắn với `receiptReceivedImageFileIds`.
