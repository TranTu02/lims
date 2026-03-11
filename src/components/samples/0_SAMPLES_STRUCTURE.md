# Components: Samples Module Documentation (`src/components/samples/`)

**Version:** 1.0.0 | **Cập nhật:** 25/02/2026

---

## I. TỔNG QUAN

Module `samples/` quản lý hiển thị và tương tác với **Mẫu thử nghiệm (Samples)** ở cấp độ tổng thể — độc lập với phiếu nhận. Khác với `reception/SampleDetailModal.tsx` (xem mẫu trong ngữ cảnh phiếu nhận), module này cung cấp giao diện quản lý mẫu riêng biệt với CRUD đầy đủ.

---

## II. CẤU TRÚC FILE

```
src/components/samples/
├── SamplesTable.tsx          # ★ Bảng danh sách mẫu (phân trang, filter, sort)
├── SampleDetailModal.tsx     # Modal xem chi tiết mẫu (standalone, dùng API riêng)
├── SampleUpsertModal.tsx     # Modal tạo/sửa mẫu (Create + Update dùng chung)
└── SampleDeleteModal.tsx     # Modal xác nhận xóa mẫu
```

---

## III. CHI TIẾT TỪNG COMPONENT

### 3.1 `SamplesTable.tsx` — Bảng danh sách mẫu (17.5KB)

**Vai trò:** Hiển thị tất cả mẫu trong hệ thống (cross-receipt).

**Chức năng:**

- **Phân trang:** Pagination với SIZE options
- **Tìm kiếm:** Search by sampleId, receiptId
- **Lọc:** Filter theo sampleStatus
- **Sắp xếp:** Sort theo cột

**Cột hiển thị:**
| Cột | Field | Ghi chú |
|:---|:---|:---|
| Mã mẫu | `sampleId` | PK, clickable → mở Detail |
| Mã phiếu | `receiptId` | FK liên kết phiếu nhận |
| Loại mẫu | `sampleTypeName` | — |
| Trạng thái | `sampleStatus` | Badge semantic color |
| Lượng mẫu | `sampleVolume` | — |
| Ngày tạo | `createdAt` | Format dd/MM/yyyy |

**Data Source:** `useSamplesList()` từ `@/api/samples.ts`

**Khác biệt với Reception:**

- Hiển thị mẫu từ TẤT CẢ phiếu nhận
- Types dùng `SampleListItem` từ `@/types/sample.ts` (không phải `ReceiptSample` từ `receipt.ts`)
- API dùng `samplesGetList` (không phải `receiptsGetFull`)

---

### 3.2 `SampleDetailModal.tsx` — Chi tiết mẫu standalone (14KB)

**Vai trò:** Xem chi tiết một mẫu dựa trên API `samplesGetFull`.

**Khác biệt với `reception/SampleDetailModal.tsx`:**

| Điểm           | `reception/SampleDetailModal`             | `samples/SampleDetailModal`        |
| :------------- | :---------------------------------------- | :--------------------------------- |
| **Context**    | Trong phiếu nhận, data từ `ReceiptSample` | Standalone, data từ `SampleDetail` |
| **API**        | Dùng data đã có trong receipt             | Gọi `samplesGetFull({ sampleId })` |
| **Edit**       | Cập nhật qua `receiptsUpdate()`           | Cập nhật qua `samplesUpdate()`     |
| **Analyses**   | Dùng `ReceiptAnalysis` type               | Dùng `SampleAnalysis` type         |
| **Kích thước** | 37KB (đầy đủ chức năng)                   | 14KB (nhỏ gọn hơn)                 |

**Chức năng:**

- Hiển thị thông tin mẫu: sampleId, sampleTypeName, sampleStatus, sampleVolume, physicalState...
- Hiển thị danh sách phép thử (analyses)
- Thêm phép thử mới trực tiếp vào mẫu qua ô tìm kiếm (Matrix SearchDropdown), gọi api `analysesCreate`
- Liên kết tới phiếu nhận (receiptId)

**Data Source:** `useSampleFull()` hook

---

### 3.3 `SampleUpsertModal.tsx` — Tạo/Sửa mẫu (15KB)

**Vai trò:** Form modal cho cả Create và Update sample.

**Chức năng:**

- Nếu có `sampleId` prop → chế độ Edit (loads existing data)
- Nếu không có → chế độ Create

**Form Fields:**
| Field | Bắt buộc | Type | Ghi chú |
|:---|:---|:---|:---|
| receiptId | ✅ (Create) | text | Liên kết phiếu nhận |
| sampleTypeId | ✅ (Create) | select | Chọn từ danh mục loại mẫu |
| sampleClientInfo | ❌ | text | Thông tin mẫu từ khách |
| sampleVolume | ❌ | text | Lượng mẫu |
| sampleStatus | ❌ (Edit) | select | Chỉ sửa được khi Update |
| sampleStorageLoc | ❌ (Edit) | text | Vị trí lưu kho |

**API:**

- Create: `useSampleMutationCreate()`
- Update: `useSampleMutationUpdate()`

---

### 3.4 `SampleDeleteModal.tsx` — Xóa mẫu (4KB)

**Vai trò:** Dialog xác nhận xóa mẫu.

**Chức năng:**

- Hiển thị mã mẫu sắp xóa
- Yêu cầu xác nhận trước khi xóa
- Gọi `useSampleMutationDelete()` khi confirm
- Toast success/error

---

## IV. TYPES SỬ DỤNG

Module này sử dụng types từ `@/types/sample.ts`:

```typescript
// List
SampleListItem {
    sampleId, receiptId, sampleTypeName?, sampleStatus?, sampleVolume?, createdAt?
}

// Detail
SampleDetail {
    sampleId, receiptId,
    sampleTypeId?, sampleTypeName?, productType?,
    sampleClientInfo?, sampleInfo?, sampleReceiptInfo?,
    sampleStatus?, sampleVolume?, sampleWeight?,
    samplePreservation?, sampleStorageLoc?,
    sampleRetentionDate?, sampleDisposalDate?,
    sampleIsReference?, samplingInfo?, physicalState?,
    parentSampleId?, custodyLog?, retentionServiceFee?,
    analyses: SampleAnalysis[]
}

// Analysis (nested trong SampleDetail)
SampleAnalysis {
    analysisId, sampleId, matrixId?, parameterId?, parameterName?,
    technicianId?, technicianIds?, equipmentId?,
    analysisStatus?, analysisResult?, analysisResultStatus?,
    analysisStartedAt?, analysisCompletedAt?,
    analysisUnit?, protocolCode?, analysisDeadline?,
    ...etc
}

// Status enums
SampleStatus = "Received" | "Analyzing" | "Stored" | "Disposed"
AnalysisStatus = "Assigned" | "Testing" | "Completed"
AnalysisResultStatus = "NotEvaluated" | "Pass" | "Fail"
```

---

## V. QUY TẮC KHI SỬA/THÊM COMPONENT

1. **Types:** Import từ `@/types/sample.ts`, KHÔNG từ `@/types/receipt.ts`.
2. **API:** Import hooks từ `@/api/samples.ts`.
3. **i18n:** Keys dùng namespace `lab.samples.*`.
4. **Status Values:** Import `SAMPLE_STATUS_VALUES`, `ANALYSIS_STATUS_VALUES` từ `@/types/sample.ts` để render Select options.
5. **Không trùng lặp:** Nếu cần sửa logic xem mẫu TRONG phiếu nhận → sửa `reception/SampleDetailModal.tsx`. Module này chỉ cho xem mẫu STANDALONE.
