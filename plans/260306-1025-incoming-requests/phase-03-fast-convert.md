# Phase 03: Logic Chuyển đổi siêu tốc (Fast-Convert)

Status: ⬜ Pending
Dependencies: phase-02-ui-list

## Objective

Tính năng 1-Click "Tạo nhanh" thông tin `incomingRequests` thành cấu trúc `Receipt -> Samples -> Analyses`.

## Requirements

### Functional

- [ ] Thêm Action "Tạo Phiếu Nhanh" (Lightning bolt icon ⚡) trên mỗi dòng của bảng danh sách.
- [ ] Tạo API Hook `useIncomingRequestConvert` (hoặc Mutation).
- [ ] Mở 1 Modal Review trước khi Post:
      Trong modal show review tổng thể: Số mẫu tạo, số chỉ tiêu tạo, kèm form "Ngày/Giờ nhận" thực tế.
- [ ] Gửi body data đúng định dạng lên API để nó insert 3 bảng. Cập nhật `linkedOrderId` / `receiptId` cho `incomingRequests` hoặc ẩn đi sau khi convert thành công.

### Non-Functional

- [ ] Invalidate Queries sau khi Convert Success để Refetch lại bảng "Yêu cầu chưa tiếp nhận" và list "Đang xử lý".
- [ ] Chống lỗi, Handle Error (báo `sonner` toast với `awf-error-translator` logic).

## Implementation Steps

1. [ ] Thiết kế `FastConvertModal.tsx`.
2. [ ] Tích hợp API convert.
3. [ ] Hoàn thành Flow luân chuyển trạng thái (Lab Flow 1,2,3).

## Files to Create/Modify

- `src/components/reception/FastConvertModal.tsx`
- `src/api/incomingRequests.ts` (Thêm Mutation Convert)
- `src/components/reception/IncomingRequestsTable.tsx` (Bổ sung actions)

---

All Phases Completed.
