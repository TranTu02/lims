# Phase 01: API Setup & Types

Status: ⬜ Pending
Dependencies: None

## Objective

Xác định cấu trúc dữ liệu cho `IncomingRequest` trong Typescript và thiết lập API client để lấy dữ liệu.

## Requirements

### Functional

- [ ] Interface `IncomingRequest` với các trường tương đương DBSchema `crm.incomingRequests` hoặc kết hợp với dữ liệu mẫu từ `LAB_API_DOCUMENTATION`.
- [ ] Hook `useIncomingRequestsList(filters)` để fetch dữ liệu ra màn hình danh sách.
- [ ] Khai báo Query Keys.
- [ ] Cấu hình URL endpoint phù hợp, lấy theo chuẩn LIMS: `/v2/incoming-orders/` (theo `LAB_FLOW.md`).

### Non-Functional

- [ ] Tuân thủ TypeScript Strict type (không `any`).
- [ ] Bám sát FE Agent Rules (0_TYPES_STRUCTURE.md, QUERY_KEYS...).

## Implementation Steps

1. [ ] Đọc lại `DATABASE.md` đoạn `incomingRequests` để list đầy đủ field.
2. [ ] Tạo `src/types/incomingRequest.ts`.
3. [ ] Tạo file `src/api/incomingRequests.ts`.
4. [ ] Khai báo `incomingRequestsKeys` trong `src/config/query-keys.ts` (nếu cần).

## Files to Create/Modify

- `src/types/incomingRequest.ts` - Typings.
- `src/api/incomingRequests.ts` - Query Hooks & Mutate.
- `src/config/query-keys.ts` - Thêm query keys.

## Notes

- `incomingRequests` chứa trường `samples` (jsonb[]). Trong đó mỗi sample chứa list `analyses`. Cần đếm tổng số mẫu và tổng số chỉ tiêu từ mảng này.

---

Next Phase: `phase-02-ui-list.md`
