# PHẦN 4: TÀI LIỆU HƯỚNG DẪN SỬ DỤNG 

## 1. Đăng nhập hệ thống

* **Bước 1:** Truy cập vào địa chỉ URL của hệ thống LIMS.
* **Bước 2:** Tại màn hình đăng nhập, nhập chính xác **Email** và **Mật khẩu** tài khoản nội bộ.
* **Bước 3:** Click nút **[Đăng nhập]**. Hệ thống sẽ chuyển hướng bạn đến trang Dashboard chính.

## 2. Quản lý Khách hàng (CLIENTS)

### 2.1. Thêm mới khách hàng

* **Bước 1:** Từ Sidebar (thanh menu bên trái), chọn **[Bán hàng (CRM)]** -> **[Khách hàng]**.
* **Bước 2:** Click nút **[+ Thêm khách hàng]** ở góc trên bên phải màn hình.
* **Bước 3:** Tại Modal nhập liệu:
* Nhập **Mã số thuế** của công ty khách hàng.
* Click vào nút **[Kính lúp]** (tra cứu). Hệ thống tự động lấy dữ liệu và điền các trường: **Tên đơn vị**, **Địa chỉ**, **Tên viết tắt**.
* Nhập bổ sung **Số điện thoại** và **Email** của đơn vị.
* Tại mục **Người liên hệ**: Click **[+ Thêm người liên hệ]** để điền Tên, Chức vụ và SĐT của người đại diện làm việc trực tiếp.


* **Bước 4:** Click nút **[Lưu]** để hoàn tất thêm vào danh mục.

### 2.2. Chỉnh sửa thông tin khách hàng

* **Bước 1:** Tại danh sách khách hàng, tìm khách hàng cần cập nhật.
* **Bước 2:** Click vào **Icon cây bút (Edit)** ở hàng tương ứng.
* **Bước 3:** Thay đổi các thông tin cần thiết trong Modal hiện ra.
* **Bước 4:** Click nút **[Lưu thay đổi]**.

## 3. Quản lý Báo giá (QUOTES)

### 3.1. Lập báo giá mới

* **Bước 1:** Chọn **[Bán hàng (CRM)]** -> **[Báo giá]**. Click nút **[+ Tạo báo giá]**.
* **Bước 2:** Tại giao diện lập báo giá:
* Chọn **Khách hàng** từ danh sách thả xuống (có thể gõ tìm kiếm theo tên/MST).
* Tại phần **Danh sách mẫu & chỉ tiêu**: Click **[+ Thêm mẫu mới]**.
* Nhập **Tên mẫu** (Ví dụ: Nước thải sau xử lý) và chọn **Loại nền mẫu** phù hợp.
* Click nút **[+ Thêm chỉ tiêu]**: Gõ tìm kiếm các chỉ tiêu kỹ thuật. Hệ thống tự động hiển thị: **Phương pháp thử**, **Đơn giá**, **Thuế suất** và **TAT** (Thời gian trả kết quả) dựa trên cấu hình ma trận giá.


* **Bước 3:** Kiểm tra tổng tiền ở phía dưới giao diện. Nhập **% Chiết khấu** (nếu có thỏa thuận).
* **Bước 4:** Click nút **[Lưu báo giá]**.

### 3.2. Xuất Báo giá PDF

* **Bước 1:** Tại danh sách báo giá, click vào hàng tương ứng của báo giá muốn xuất.
* **Bước 2:** Click vào nút có **Biểu tượng file PDF (Xuất báo giá PDF)**.
* **Bước 3:** Hệ thống hiển thị Modal xem trước (Preview).
* **Bước 4:** Click nút **[Tải xuống]** hoặc icon Download trên trình xem để lưu file PDF về máy tính.

### 3.3. Tạo Đơn hàng nhanh từ Báo giá

* **Bước 1:** Ngay tại giao diện chi tiết hoặc UI danh sách của Báo giá, tìm và click nút **[Chuyển thành Đơn hàng]**.
* **Bước 2:** Click **[Xác nhận]** tại Modal thông báo.
* **Bước 3:** Hệ thống tự động tạo một Đơn hàng mới, kế thừa toàn bộ thông tin khách hàng, danh sách mẫu và giá từ báo giá gốc.
* **Bước 4:** Màn hình chuyển sang giao diện **Chi tiết Đơn hàng** để tiếp tục quy trình xử lý.

## 4. Quản lý Đơn hàng & Cổng khai báo dành cho khách hàng

### 4.1. Gửi link Phiếu gửi mẫu cho khách hàng

* **Bước 1:** Tại giao diện **Chi tiết đơn hàng**, tìm trường **"Link phiếu gửi mẫu"**.
* **Bước 2:** Click nút **[Copy Link]** (đường dẫn chứa mã token định danh).
* **Bước 3:** Nhân viên kinh doanh gửi link này cho khách hàng (qua Zalo, Email...).

### 4.2. Khách hàng cập nhật thông tin và In phiếu (Thực hiện trên Link công khai)

* **Bước 1:** Khách hàng click vào link nhận được để mở giao diện cập nhật.
* **Bước 2:** Khách hàng nhập chi tiết thông tin mẫu thực tế: **Ký hiệu mẫu**, **Mô tả tình trạng**, **Khối lượng**, **Yêu cầu bảo quản**.
* **Bước 3:** Click nút **[Lưu phiếu gửi mẫu]**. Hệ thống ghi nhận dữ liệu vào LIMS.
* **Bước 4:** Click nút **[In phiếu gửi mẫu]** (hoặc Xuất PDF).
* **Bước 5:** File PDF Phiếu gửi mẫu tự động tải xuống. Khách hàng in ra, ký tên/đóng dấu và gửi kèm cùng mẫu thử tới phòng Lab.
