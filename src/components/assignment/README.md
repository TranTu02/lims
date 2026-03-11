# MODULE PHÂN CÔNG KỸ THUẬT VIÊN (TECHNICIAN ASSIGNMENT)

## 1. Tổng quan Nghiệp vụ

Module Phân công Kỹ thuật viên (Technician Assignment) là nơi các Quản lý (Manager) hoặc Phụ trách Kỹ thuật (Tech Lead) thực hiện phân công các chỉ tiêu phân tích (Analyses) cho Kỹ thuật viên (KTV) hoặc một Nhóm kỹ thuật (Identity Group).

Các tính năng chính:

- **Danh sách Chỉ tiêu**: Hiển thị các chỉ tiêu đang ở trạng thái `Pending` hoặc `Ready` chờ được phân công. Danh sách hỗ trợ tìm kiếm, phân trang và sắp xếp.
- **Kéo thả chọn nhiều hàng (Drag-to-select)**: Cho phép thao tác quét chuột nhanh để chọn nhiều dòng chỉ tiêu cùng lúc, nâng cao hiệu suất làm việc.
- **Phân công theo Cá nhân**: Tra cứu và phân công cho một KTV cụ thể dựa vào `identityId`.
- **Phân công theo Nhóm**: Phân công cho cả một Nhóm (Identity Group). Hệ thống sẽ tự động map `technicianGroupId`, `technicianGroupName`, Trưởng nhóm (`technicianId`), và danh sách Thành viên (`technicianIds`).
- **Cập nhật hàng loạt (Bulk Update)**: Gửi request cập nhật 1 lần (Atomic) xuống Database để đảm bảo tính nhất quán qua API `/v2/analyses/update/bulk`.

---

## 2. Cấu trúc Thư mục và File

| File                                 | Chức năng (Nhiệm vụ chính)                                                                     |
| :----------------------------------- | :--------------------------------------------------------------------------------------------- |
| `TechnicianAssignmentManagement.tsx` | Component hiển thị giao diện chính (Table, Filter, Drag-to-select) và quản lý trạng thái chọn. |
| `TechnicianAssignmentModal.tsx`      | Modal giao diện thực hiện phân công KTV sau khi đã chọn xong các chỉ tiêu. Chứa logic API.     |

---

## 3. Chi tiết các Component

### `TechnicianAssignmentManagement.tsx`

- **State Selection**: Duy trì danh sách `selectedIds`.
- **Drag-to-Select Logic**: Sử dụng các sự kiện `onMouseDown`, `onMouseEnter`, `onMouseUp` để tính toán khoảng chọn (`startIndex` và `endIndex`), qua đó tick chọn hàng loạt các checkbox mà không cần click từng dòng. Quản lý trạng thái bằng `selectionBox`.
- **Dữ liệu Hiển thị**: Gọi API `useAnalysesList` với query `analysisStatus = ["Pending", "Ready"]`.
- **Cột hiển thị**:
    1. Mã mẫu (`sampleCode`).
    2. Chỉ tiêu (`parameterName`).
    3. KTV phụ trách (`assignTechnician`).
    4. Nhóm phụ trách (`assignedGroup` / `technicianGroupName`).
    5. KTV liên quan (`relatedTechnicians` / `technicianIds`).
    6. Trạng thái (`analysisStatus`).

### `TechnicianAssignmentModal.tsx`

- **Giao diện Tabs**: Chia làm 2 chế độ (`mode = technician | group`).
    - **Tab KTV Cá nhân**: Load danh sách KTV qua `useIdentitiesList` (Query: `identityRoles = ["ROLE_TECHNICIAN"]`).
    - **Tab Theo Nhóm**: Load danh sách nhóm qua `useIdentityGroupsList` (Query: `identityGroupMainRole = ["ROLE_TECHNICIAN"], option = "full", itemsPerPage = 100`).
- **Logic Mapping**:
    - Khi phân công **Nhóm**: Map thông tin sang `technicianGroupId`, `technicianGroupName`, Trưởng nhóm (`technicianId`), Thành viên (`technicianIds`). Request data đảm bảo phủ 4 trường này.
    - Khi phân công **Cá nhân**: Xóa dữ liệu Nhóm cũ (hoặc override `technicianGroupId = null`, `technicianGroupName = null`), lưu `technicianId` và mảng 1 thành viên `technicianIds`.
- **Bulk Update API**: Gửi mảng `body` qua mutator `useAnalysesUpdateBulk`.

---

## 4. Cấu trúc API & Dữ liệu Database (Database Sync)

### 4.1. Identity Groups API

Cấu trúc gọi nhóm kỹ thuật:

```typescript
{
    identityGroupMainRole: ["ROLE_TECHNICIAN"],
    option: "full",
    itemsPerPage: 100
}
```

_Lưu ý: Parameter `option: "full"` rất quan trọng để Backend phản hồi kèm snapshot của Trưởng nhóm (`inCharge`) và mảng thành viên (`identities`), phục vụ việc bind dữ liệu update Bulk và render danh sách Badge thành viên._

### 4.2. Bulk Update API

Khi xác nhận phân công nhóm (Update Bulk Body):

```json
[
    {
        "analysisId": "ID_CHI_TIEU_1",
        "technicianGroupId": "ID_NHOM_VI_SINH",
        "technicianGroupName": "Nhóm Vi Sinh",
        "technicianId": "ID_TRUONG_NHOM",
        "technicianIds": ["ID_TV1", "ID_TV2", "ID_TV3"]
    }
]
```

### 4.3 Liên kết API Database

- `lab.analyses`: Bảng lưu thông tin chỉ tiêu nhận phân công (Có `technicianGroupId`, `technicianGroupName`, `technicianId`, `technicianIds`).
- `identity.identityGroups`: Bảng chứa danh sách nhóm (Sử dụng API `identity-groups`).
- `identity.identities`: Bảng chứa danh sách User thực tế (Cấp phát nhân sự).

---

## 5. Các lưu ý & Best Practices

1. **Drag selection**: Rất nhạy với các event propagation. Trong thẻ `<TableRow>`, các event chọn/kéo cần ngăn chặn nổi bọt (prevent propagation) khi user click vào nút button nội bộ hoặc link để tránh chọn lộn xộn.
2. **Hiển thị thông tin nhóm**: Luôn dùng snapshot từ bảng `analyses` (như `technicianGroupName` và mảng `technicians`) thay vì query Lookup qua API phụ, giúp trang List tải nhanh.
3. **Atomic API**: Luôn gửi danh sách ở dạng `Array<{analysisId}>` thay vì một Object chứa mảng, để Backend có thể xử lý song song từng record với các thông tin độc lập hoặc đồng nhất một cách dễ dàng.
