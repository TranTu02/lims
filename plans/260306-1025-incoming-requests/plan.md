# Plan: Module Yêu cầu chờ tiếp nhận (Incoming Requests)

Created: 2026-03-06T10:25:00+07:00
Status: 🟡 In Progress

## Overview

Dự án bổ sung thêm luồng hiển thị danh sách các **Yêu cầu Tiếp nhận (Incoming Requests)** nằm ở trước phần "Đang xử lý" và "Trả kết quả" trong module Tiếp nhận Mẫu (Reception).
Chức năng cốt lõi:

1. Xem thông tin tổng quan của các Yêu cầu: Mã đơn, Khách hàng, NVKD, Trạng thái đơn, Trạng thái thanh toán, Số lượng mẫu, Tổng số chỉ tiêu.
2. Nút "Tạo Nhanh" (Fast Create) từ 1-click để tự động sinh ra một `Receipt`, bao gồm `samples` và `analyses` từ thông tin đã có, giảm thiểu việc nhập liệu thủ công.

## Tech Stack

- Frontend: React 18+ (Vite), Shadcn/ui (Tailwindv4), react-query.
- Typings: TypeScript.
- Styles: `bg-background`, `text-muted-foreground`... theo FE_AGENT_RULES.
- Language: i18next (`t()`).

## Phases

| Phase | Name                                               | Status     | Progress |
| ----- | -------------------------------------------------- | ---------- | -------- |
| 01    | API Setup & Types                                  | ⬜ Pending | 0%       |
| 02    | Màn hình Danh sách UI                              | ⬜ Pending | 0%       |
| 03    | Logic Chuyển đổi siêu tốc (Fast-Convert) & Preview | ⬜ Pending | 0%       |

## Quick Commands

- Start Phase 1: `/design phase-01` hoặc `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
