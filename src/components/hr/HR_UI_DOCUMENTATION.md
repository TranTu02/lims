# TÀI LIỆU HƯỚNG DẪN MODULE HR (QUẢN LÝ NHÂN SỰ)

Module HR (`src/components/hr`) là trung tâm quản lý danh tính, phân quyền và hồ sơ của toàn bộ nhân viên/người dùng trong hệ thống LIMS. Tài liệu này cung cấp cái nhìn chi tiết nhất về cấu trúc UI, logic hoạt động và cách thức kết nối với API.

## 1. TỔNG QUAN KIẾN TRÚC UI (SIDE-PANEL LAYOUT)

Từ phiên bản mới nhất, module HR đã chuyển đổi từ kiến trúc hiển thị Modal-based sang **Side-panel Layout (Giao diện 2 cột)**.

### Mục đích của sự thay đổi
- **Tối ưu thao tác**: Người dùng có thể duyệt qua danh sách nhân sự (trái) và xêm ngay chi tiết (phải) mà không bị che khuất màn hình hay phải đóng/mở popup liên tục.
- **Không gian mở rộng**: Cho phép hiển thị lượng lớn thông tin về nhân sự (danh bạ, vị trí chuyên môn, tài liệu cá nhân) một cách trực quan, rõ ràng.

### Flow hoạt động
1. User truy cập `/hr`, trang render component chính: `IdentityContainer`.
2. `IdentityContainer` chia làm 2 phần khi có một hàng (row) được chọn:
   - **Bên trái (2/3 chiều rộng)**: `IdentityTable` chứa danh sách, phân trang, thanh công cụ tìm kiếm.
   - **Bên phải (1/3 chiều rộng)**: `IdentityDetailPanel` chứa thông tin chi tiết đầy đủ (fetch qua `useIdentityFull`).

---

## 2. CÁC COMPONENT CỐT LÕI

### 2.1. `IdentityContainer` (`src/components/hr/IdentityContainer.tsx`)
- **Vai trò**: Là Container/Page cấp cao nhất điều phối trạng thái của toàn bộ module.
- **Quản lý State**:
  - `activeTab`: Lọc danh sách nhân sự (Tất cả, theo loại entity...).
  - `search`, `page`, `itemsPerPage`: Điều khiển phân trang và tìm kiếm cho `IdentityTable`.
  - `detailId`: Lưu ID nhân sự đang được bôi đen (chọn) để hiển thị ở Panel chi tiết.
  - `editId`, `deleteId`, `createOpen`: Quản lý các popup tạo mới/chỉnh sửa/xóa.
- **API Cache**: Gọi hook `useQuery` với khóa `identitiesKeys.list` để lấy danh sách rút gọn.

### 2.2. `IdentityTable` (`src/components/hr/IdentityTable.tsx`)
- **Vai trò**: Bảng hiển thị thông tin trích xuất của nhân sự (Tên, Email, Vị trí chuyên môn, Trạng thái).
- **Tính năng Row Selection**:
  - Cung cấp Prop `selectedId` và sự kiện `onSelectRow`.
  - Tự động thay đổi background và highlight Avatar/Role Badge của người đang được chọn.
- **Hành động khác**: Các nút Edit và Delete vẫn tồn tại ở cột cuối để thao tác nhanh.

### 2.3. `IdentityDetailPanel` (`src/components/hr/IdentityDetailPanel.tsx`)
- **Vai trò**: Hiển thị thông tin sâu nhất về một nhân sự.
- **API Binding**: Gọi `useIdentityFull(identityId)` để lấy thêm các bảng liên kết như:
  - Thông tin cá nhân mới: NID (CCCD), Số điện thoại, Địa chỉ, Nhóm nhân sự (`identityGroupId`).
  - Danh sách hồ sơ liên quan (bằng cấp, chứng chỉ) qua trường `documents`.
- **Cấu trúc hiển thị**:
  1. **Header**: Avatar lớn, tên, ID, badge trạng thái, cùng 2 nút `Edit` và `Delete`.
  2. **Thông tin liên hệ**: Email, Phone, Address (Sử dụng các icon chuyên nghiệp từ `lucide-react`).
  3. **Thông tin định danh**: CCCD/NID, Bí danh, Nhóm nhân sự và **Vị trí chuyên môn**.
  4. **Hồ sơ năng lực**: Render danh sách các `documents` liên kết.

### 2.4. Các Modal Thao tác Dữ liệu
- **`IdentityCreateModal` / `IdentityUpdateModal`**: 
  - Hiển thị form gồm thông tin cơ bản và bảng chọn `Vị trí` (Checkboxes).
  - Tích hợp `IdentityDocumentManager` để tải lên/chọn hồ sơ năng lực (`PERSONNEL_RECORD`).
  - Tích hợp `IdentityGroupSelect` cho phép map nhân sự vào các tổ chức/phòng ban (`identityGroupId`).
- **`IdentityDeleteModal`**: Xác nhận trước khi API `/v2/identities/delete` được gọi.

---

## 3. LOGIC XỬ LÝ "VỊ TRÍ" VÀ PHÂN QUYỀN (ROLES)

Một trong những hệ thống quan trọng nhất của LIMS là xử lý quyền hạn. Module HR quản lý các vị trí này một cách đặc thù.

### 3.1. Cấu trúc Dữ liệu `identityRoles` (Mảng Chuỗi)
- Dữ liệu vị trí trả về từ API dạng mảng chuỗi (`text[]`), ví dụ: `["ROLE_ADMIN", "ROLE_TECHNICIAN"]`.
- Để đồng bộ hóa frontend với database, các khóa (keys) được định nghĩa tĩnh trong `src/utils/roles.ts`:
  ```ts
  export const roleKeys = [
    "ROLE_SUPER_ADMIN",
    "ROLE_ADMIN",
    "ROLE_MANAGER",
    "ROLE_TECHNICIAN",
    "ROLE_QC",
    "ROLE_CSKH",
    "ROLE_VALIDATOR",
    //...
  ] as const;
  ```

### 3.2. Hiển thị qua `IdentityRoleBadges`
- Component `IdentityRoleBadges` được cập nhật để map từ mã `ROLE_...` sang tên tiếng Việt (ví dụ `ROLE_TECHNICIAN` -> `Kỹ thuật viên`) thông qua I18n của dự án (`src/config/i18n/locales/vi.ts`).
- **Highlight Effect**: Tự động chuyển tông màu phù hợp với dòng đang được chọn trong Table.

### 3.3. Xử lý lưu và cập nhật
- Khi hiển thị Form, mảng `identityRoles` sẽ được map thành một Object dạng `Record<RoleKey, boolean>` để render thành danh sách Checkbox.
- Khi nhấn **Lưu (Save/Create)**, đối tượng boolean trên lại được filter và đưa về định dạng mảng (`["ROLE_A", "ROLE_B"]`) rồi truyền vào property `identityRoles` của API Body.

---

## 4. QUẢN LÝ HỒ SƠ NĂNG LỰC (DOCUMENTS)

HR Module cung cấp tính năng tải lên và liên kết tài liệu vào tài khoản cá nhân, phục vụ việc chứng minh năng lực ISO 17025.

- **Component**: `IdentityDocumentManager` dùng chung logic Search/Picker của document.
- **Phân loại**: Upload File trên form này mặc định truyền metadata `documentType: "PERSONNEL_RECORD"`.
- **Hiển thị**: Khi xem trên `IdentityDetailPanel`, backend (thông qua `identitiesGetFull`) sẽ JOIN với bảng `documents` dựa trên danh sách `identityDocumentIds` lưu trong HR và trả về cục Json `documents: [...]`. Giao diện sẽ lặp mảng này để hiển thị các file trực quan.

---

## 5. TÍCH HỢP ĐA NGÔN NGỮ (I18N)

Toàn bộ UI sử dụng chuẩn phân tích thẻ của thư viện `react-i18next`. Các trường quan trọng:
- `hr.dashboard.*`: Tiêu đề trang, tab.
- `hr.fields.*`: Các trường tĩnh trên form (ví dụ: `Tên`, `Mật khẩu`, `Vị trí`, `CCCD/NID`).
- `hr.roles.ROLE_*`: Mapping vị trí hệ thống ra tiếng địa phương (ví dụ `hr.roles.ROLE_TECHNICIAN` tương đương `Kỹ thuật viên`).

---

## 6. DANH SÁCH API HOOKS LIÊN QUAN (`src/api/identities.ts`)

| Hook / Hàm API | Ý nghĩa | Ứng dụng trong module |
|----------------|---------|-----------------------|
| `useIdentitiesList` | Fetch mảng data ngắn gọn | Dùng cho bảng `IdentityTable` |
| `useIdentityFull` | Fetch toàn bộ JSON liên kết | Khởi động khi Panel `IdentityDetailPanel` mở, dựa trên ID. |
| `identitiesCreate` | Gọi POST `/create` | Thực thi từ Form Create |
| `identitiesUpdate` | Gọi POST `/update` | Thực thi từ Form Update (Sửa Name, Phone, Roles...) |
| `identitiesDelete` | Gọi POST `/delete` (Soft-delete) | Thực thi từ Form Delete |

---

## 7. QUY TRÌNH PHÁT TRIỂN / MỞ RỘNG (BEST PRACTICES)

Nếu cần bổ sung thêm một trường thông tin mới cho Nhân sự (Ví dụ: `bankAccountNumber`):
1. **Khởi tạo Database**: Thêm trường mới vào database và API Schema (hỗ trợ trong `IdentityUpdateBody`).
2. **Cập nhật Interface**: Tại `src/api/identities.ts`, thêm `bankAccountNumber` vào kiểu dữ liệu `IdentityListItem` và form truyền lên.
3. **Cập nhật Form**: Thêm component `<Input />` tương ứng trong `IdentityCreateModal` và `IdentityUpdateModal`. Map biến tương ứng ở `useState<FormState>`.
4. **Hiển thị Panel**: Vào `IdentityDetailPanel.tsx`, thêm khối tĩnh hiển thị thông tin này (có thể thêm icon của Lucide-react cho đẹp mắt).
5. **Dịch thuật**: Viết bổ sung vào file `/locales/vi.ts`.
