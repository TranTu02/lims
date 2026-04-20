# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG - THƯ VIỆN (LIBRARY)

**Cập nhật lần cuối:** 2026-04-18
**Đối tượng sử dụng:** Quản trị viên phòng Lab / Người có quyền quản lý thư viện

---

## TỔNG QUAN

Module **Thư viện (Library)** là trung tâm lưu trữ toàn bộ dữ liệu danh mục tĩnh của hệ thống LIMS, bao gồm: `Chỉ tiêu (Parameters)`, `Ma trận chỉ tiêu (Matrices)`, `Biểu mẫu (Protocols)`, `Loại mẫu (Sample Types)`, v.v.

Tài liệu này hướng dẫn chi tiết quy trình quản lý **Chỉ tiêu (Parameters)** - thành phần cốt lõi để xây dựng cấu trúc bảng báo giá và kiểm nghiệm.

Một **Chỉ tiêu** (VD: Vitamin C) trong LIMS không đứng độc lập mà bao gồm một hoặc nhiều **Ma trận chỉ tiêu** (VD: Vitamin C trong Thực phẩm, Vitamin C trong Nước...). Mỗi Ma trận sẽ định nghĩa Phương pháp, LOD, LOQ, BOM hóa chất và Giá tiền riêng lẻ.

Quy tắc bắt buộc: **Phải tạo thông tin chung của Chỉ tiêu trước (Lưu lại) -> Sau đó mới có thể cấu hình chi tiết các Ma trận bên trong.**

---

## PHẦN 1: QUẢN LÝ CHỈ TIÊU (PARAMETERS)

### 1. Xem danh sách Chỉ tiêu

- Truy cập vào **Library (Thư viện)** -> Chọn tab **Chỉ tiêu**.
- Màn hình chính phân chia rõ ràng thành 2 khu vực:
    1. **Bảng Danh sách (Bên trái):** Hiển thị hàng loạt các Chỉ tiêu (ID, Tên, Trạng thái...).
    2. **Tấm điều khiển (Bên phải):** Khi nhấn vào bất kỳ một hàng Chỉ tiêu nào ở bảng bên trái, khung bên phải sẽ hiển thị danh sách các **Ma trận chỉ tiêu** đang thuộc quyền sở hữu của Chỉ tiêu đó.

### 2. Khởi tạo Chỉ tiêu

Để thêm mới một Chỉ tiêu vào hệ thống:

1. Tại bảng "Danh sách chỉ tiêu", nhấn nút **+ Tạo mới** ở góc trên cùng bên phải.
1. Màn hình **Tạo chỉ tiêu** sẽ hiện diện. Bạn cần điền các thông tin:

- **Tên chỉ tiêu phân tích (Bắt buộc):** Tên hiển thị chung.
- **Vị trí phụ trách:** Nhóm thực hiện phép thử này (VD: CHEM01 - Hóa 1).
- **ID nhóm kỹ thuật viên:** Dùng cho việc nhóm các chỉ tiêu cho một Role/Team cụ thể.
- **Từ khóa tìm kiếm:** Cách nhau bằng dấu phẩy (Dùng cho chức năng Search nâng cao).
- **Trạng thái:** Active hoặc Inactive.
- **Ghi chú:** Các lưu ý đặc biệt.

1. _Lưu ý: Ở bước này, phần cấu hình "Ma trận" ở bên phải đang bị khóa. Bạn bắt buộc phải ấn nút **Lưu** góc dưới cùng tay phải để khởi tạo Only Record Chỉ tiêu trước._

### 3. Cấu hình Ma trận Chỉ tiêu (Matrices)

Ngay sau khi thao tác **Lưu** ở Bước 2 thành công (Hoặc mở chế độ Chỉnh sửa 1 Chỉ tiêu đã có sẵn):

1. Bên góc phải màn hình, nhấn nút **+ Thêm ma trận**.
1. Một Form popup **Tạo mới ma trận chỉ tiêu** cực kỳ chi tiết sẽ bung ra. Đây là nơi bạn định danh các thông số khoa học:

- **Thông tin cơ bản / Đơn giá:**
    - _Đơn giá (Chưa thuế), Thuế suất (%), Đơn giá (Sau thuế)_ (Dùng sau này cho Invoice/Quotation).
- **Ngưỡng / Giới hạn:**
    - _LOD (Limit of Detection), LOQ (Limit of Quantitation)._
    - _GHK (Ngưỡng quy chuẩn)._
    - _Thời gian trả kết quả (Ngày)._
- **Phương pháp / Nền mẫu:**
    - Chọn _Loại mẫu_, _Tên loại mẫu_.
    - Liên kết với _Mã phương pháp_ đã được ban hành trong hệ thống Library. Nhập tay _Mã hiệu phương pháp_ và _Nguồn..._
- **Phạm vi công nhận (VILAS/TDC):**
    - Đánh dấu các thông số hoặc Click để kích hoạt VILAS/TDC nếu phương pháp của ma trận này được công nhận ISO 17025 tại phòng Lab.
- **Hóa chất (BOM):**
    - Định mức hóa chất sẽ được tiêu hao khi làm mẫu này.
    - Có thể Import trực tiếp từ nút _Nạp từ Phương pháp_ phía trên.

1. Nhấn **Lưu** để cập nhật 1 Ma trận mới thành công dưới Chỉ tiêu cha.

---

_(Các quy trình về Protocol, Sample Type... sẽ được cập nhật ở các tài liệu tiếp theo)_
