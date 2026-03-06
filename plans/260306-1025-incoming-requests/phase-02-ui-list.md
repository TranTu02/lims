# Phase 02: Màn hình Danh sách UI

Status: ⬜ Pending
Dependencies: phase-01-api-setup

## Objective

Tạo giao diện hiển thị danh sách các Yêu cầu (IncomingRequests) ở tab đầu tiên trong mục Tiếp Nhận Mẫu.

## Requirements

### Functional

- [ ] Responsive Data Table với các cột: Mã đơn hàng (`requestId` hoặc `orderId`), Khách hàng, NVKD, Tình trạng đơn hàng, Tình trạng thanh toán, Số lượng mẫu, Tổng số chỉ tiêu.
- [ ] Tính toán số mẫu (`samples.length`) và số chỉ tiêu (reduce trên `samples[].analyses.length` từ array JSON).
- [ ] Bổ sung các `Badge` màu sắc cho các trạng thái đơn & trạng thái thanh toán.
- [ ] Thêm i18n key cho tất cả tiêu đề cột và trạng thái.

### Non-Functional

- [ ] Tuân thủ Theme & UI Standards: Shadcn `DataTable`, Tailwind CSS v4 variables (không dùng `bg-white`, chỉ dùng `bg-background`).
- [ ] Xử lý None/Null an toàn (Dùng Optional Chaining và Nullish Coalescing `?? "-"`).

## Implementation Steps

1. [ ] Cập nhật file routing `src/config/navigation.ts` hoặc các Tab ở `src/pages/ReceptionPage.tsx` để thêm Tab "Yêu cầu chở xử lý".
2. [ ] Tạo màn hình list và table tương ứng `src/components/reception/IncomingRequestsTable.tsx`.
3. [ ] Bổ sung dịch thuật (i18n translation object) cho `incomingRequests`.

## Files to Create/Modify

- `src/components/reception/IncomingRequestsTable.tsx`.
- `src/pages/reception/ReceptionPage.tsx` (Thêm Tab).
- Các file locale `vi.json` / `en.json` (nếu không truy cập được trực tiếp thì để note lại cho user).

---

Next Phase: `phase-03-fast-convert.md`
