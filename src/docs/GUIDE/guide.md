# PHẦN 4: TÀI LIỆU HƯỚNG DẪN SỬ DỤNG 

## I. Phân hệ Quản lý Khách hàng và Kinh doanh (CRM)

### 1. Đăng nhập hệ thống

* **Bước 1:** Truy cập vào địa chỉ URL của hệ thống LIMS-CRM.
* **Bước 2:** Tại màn hình đăng nhập, nhập chính xác **Email** và **Mật khẩu** tài khoản nội bộ.
* **Bước 3:** Click nút **[Đăng nhập]**. Hệ thống sẽ chuyển hướng bạn đến trang Dashboard chính.

### 2. Quản lý Khách hàng (CLIENTS)

#### 2.1. Thêm mới khách hàng

* **Bước 1:** Từ Sidebar (thanh menu bên trái), chọn **[Bán hàng (CRM)]** -> **[Khách hàng]**.
* **Bước 2:** Click nút **[+ Thêm khách hàng]** ở góc trên bên phải màn hình.
* **Bước 3:** Tại Modal nhập liệu:
* Nhập **Mã số thuế** của công ty khách hàng.
* Click vào nút **[Kính lúp]** (tra cứu). Hệ thống tự động lấy dữ liệu và điền các trường: **Tên đơn vị**, **Địa chỉ**, **Tên viết tắt**.
* Nhập bổ sung **Số điện thoại** và **Email** của đơn vị.
* Tại mục **Người liên hệ**: Click **[+ Thêm người liên hệ]** để điền Tên, Chức vụ và SĐT của người đại diện làm việc trực tiếp.


* **Bước 4:** Click nút **[Lưu]** để hoàn tất thêm vào danh mục.

#### 2.2. Chỉnh sửa thông tin khách hàng

* **Bước 1:** Tại danh sách khách hàng, tìm khách hàng cần cập nhật.
* **Bước 2:** Click vào **Icon cây bút (Edit)** ở hàng tương ứng.
* **Bước 3:** Thay đổi các thông tin cần thiết trong Modal hiện ra.
* **Bước 4:** Click nút **[Lưu thay đổi]**.

### 3. Quản lý Báo giá (QUOTES)

#### 3.1. Lập báo giá mới

* **Bước 1:** Chọn **[Bán hàng (CRM)]** -> **[Báo giá]**. Click nút **[+ Tạo báo giá]**.
* **Bước 2:** Tại giao diện lập báo giá:
* Chọn **Khách hàng** từ danh sách thả xuống (có thể gõ tìm kiếm theo tên/MST).
* Tại phần **Danh sách mẫu & chỉ tiêu**: Click **[+ Thêm mẫu mới]**.
* Nhập **Tên mẫu** (Ví dụ: Nước thải sau xử lý) và chọn **Loại nền mẫu** phù hợp.
* Click nút **[+ Thêm chỉ tiêu]**: Gõ tìm kiếm các chỉ tiêu kỹ thuật. Hệ thống tự động hiển thị: **Phương pháp thử**, **Đơn giá**, **Thuế suất** và **TAT** (Thời gian trả kết quả) dựa trên cấu hình ma trận giá.


* **Bước 3:** Kiểm tra tổng tiền ở phía dưới giao diện. Nhập **% Chiết khấu** (nếu có thỏa thuận).
* **Bước 4:** Click nút **[Lưu báo giá]**.

#### 3.2. Xuất Báo giá PDF

* **Bước 1:** Tại danh sách báo giá, click vào hàng tương ứng của báo giá muốn xuất.
* **Bước 2:** Click vào nút có **Biểu tượng file PDF (Xuất báo giá PDF)**.
* **Bước 3:** Hệ thống hiển thị Modal xem trước (Preview).
* **Bước 4:** Click nút **[Tải xuống]** hoặc icon Download trên trình xem để lưu file PDF về máy tính.

#### 3.3. Tạo Đơn hàng nhanh từ Báo giá

* **Bước 1:** Ngay tại giao diện chi tiết hoặc UI danh sách của Báo giá, tìm và click nút **[Chuyển thành Đơn hàng]**.
* **Bước 2:** Click **[Xác nhận]** tại Modal thông báo.
* **Bước 3:** Hệ thống tự động tạo một Đơn hàng mới, kế thừa toàn bộ thông tin khách hàng, danh sách mẫu và giá từ báo giá gốc.
* **Bước 4:** Màn hình chuyển sang giao diện **Chi tiết Đơn hàng** để tiếp tục quy trình xử lý.

### 4. Quản lý Đơn hàng & Cổng khai báo dành cho khách hàng

#### 4.1. Gửi link Phiếu gửi mẫu cho khách hàng

* **Bước 1:** Tại giao diện **Chi tiết đơn hàng**, tìm trường **"Link phiếu gửi mẫu"**.
* **Bước 2:** Click nút **[Copy Link]** (đường dẫn chứa mã token định danh).
* **Bước 3:** Nhân viên kinh doanh gửi link này cho khách hàng (qua Zalo, Email...).

#### 4.2. Khách hàng cập nhật thông tin và In phiếu (Thực hiện trên Link công khai)

* **Bước 1:** Khách hàng click vào link nhận được để mở giao diện cập nhật.
* **Bước 2:** Khách hàng nhập chi tiết thông tin mẫu thực tế: **Ký hiệu mẫu**, **Mô tả tình trạng**, **Khối lượng**, **Yêu cầu bảo quản**.
* **Bước 3:** Click nút **[Lưu phiếu gửi mẫu]**. Hệ thống ghi nhận dữ liệu vào LIMS.
* **Bước 4:** Click nút **[In phiếu gửi mẫu]** (hoặc Xuất PDF).
* **Bước 5:** File PDF Phiếu gửi mẫu tự động tải xuống. Khách hàng in ra, ký tên/đóng dấu và gửi kèm cùng mẫu thử tới phòng Lab.


## II. Phân hệ Quản lý tiếp nhận và xử lý mẫu (RECEIVING & SAMPLE PROCESSING)

### 1. Đăng nhập hệ thống

* **Bước 1:** Truy cập vào địa chỉ URL của hệ thống LIMS.
* **Bước 2:** Tại màn hình đăng nhập, nhập chính xác **Email** và **Mật khẩu** tài khoản nội bộ.
* **Bước 3:** Click nút **[Đăng nhập]**. Hệ thống sẽ chuyển hướng bạn đến trang Dashboard chính.

### 2. Xử lý yêu cầu và Tạo Phiếu tiếp nhận (RECEIPT CREATION)

**Mục đích:** Hoàn thiện thông tin kỹ thuật của mẫu và sinh mã định danh chính thức (TNM, SP) để đưa vào phòng Lab.

#### 2.1. Kiểm soát và Cập nhật thông tin yêu cầu

* **Bước 1:** Tại tab **[Yêu cầu tiếp nhận]**, tìm yêu cầu vừa được tạo từ đơn hàng.
* **Bước 2:** Click vào bản ghi yêu cầu để mở giao diện chi tiết:
* Kiểm tra sự khớp lệch giữa hồ sơ khách hàng gửi (Phiếu gửi mẫu) và mẫu vật lý thực tế.
* Nhập các thông tin kỹ thuật bổ sung cho từng mẫu: **Trạng thái vật lý** (Rắn/Lỏng), **Khối lượng/Thể tích**, **Điều kiện bảo quản**.


* **Bước 3 (Xử lý ngoại lệ):** Nếu phát hiện mẫu không đạt quy chuẩn hoặc thiếu hồ sơ:
* Đánh dấu trạng thái **[Chờ bổ sung thông tin]**.
* Hệ thống sẽ dừng quy trình và thông báo cho bộ phận Sales/CSKH.



#### 2.2. Tạo Phiếu tiếp nhận chính thức (Create Full Receipt)

* **Bước 1:** Sau khi thông tin đã chuẩn xác, click nút **[Tạo hồ sơ tiếp nhận]** ở góc dưới màn hình.
* **Bước 2:** Hệ thống thực hiện lệnh **Atomic Transaction**:
* Tự động sinh mã Hồ sơ: **TNM[Năm][Tháng][Ngày][Số thứ tự]** (VD: TNM26A23001).
* Tự động sinh mã Mẫu: **SP...** (VD: SP26A23001-001).
* Tự động Copy toàn bộ chỉ tiêu từ Đơn hàng sang bảng Phân tích (`analyses`).


* **Bước 3:** Chuyển trạng thái hồ sơ sang **[Đã tiếp nhận]** và đẩy dữ liệu sang tab **[Đang xử lý]**.

---

## 3. Mã hóa mẫu và In tem nhãn (CODING & LABELING)

### 3.1. In tem mã vạch (Barcode/QR)

* **Bước 1:** Tại giao diện hồ sơ đã tiếp nhận, chọn nút **[In tem mẫu]**.
* **Bước 2:** Hệ thống hiển thị Modal tùy chọn in:
* Chọn khổ giấy in (mặc định là giấy chịu hóa chất/nước).
* Chọn danh sách các mẫu cần in tem.


* **Bước 3:** Click **[Xác nhận In]**. Máy in tem nhãn sẽ xuất ra tem chứa: Mã vạch (Barcode), Mã SP, Tên mẫu và Ngày nhận.
* **Bước 4:** Thực hiện dán tem trực tiếp lên vật chứa mẫu.

### 3.2. Chụp ảnh lưu vết tiếp nhận

* **Bước 1:** Click nút **[Chụp ảnh mẫu]** (hoặc Upload ảnh).
* **Bước 2:** Thực hiện chụp ảnh tình trạng niêm phong, nhãn gốc của khách hàng để làm bằng chứng pháp lý.
* **Bước 3:** Ảnh được tự động lưu vào bảng `document.files` và gắn link trực tiếp vào mẫu (`sampleId`).

---

## 4. Gửi Email thông báo tiếp nhận (ACKNOWLEDGMENT)

**Mục đích:** Xác nhận chính thức với khách hàng về danh sách mẫu và phương pháp thử sẽ thực hiện.

* **Bước 1:** Click nút **[Gửi Email tiếp nhận]** (Icon thư).
* **Bước 2:** Hệ thống tự động lấy Email từ thông tin liên hệ và render nội dung theo Template HTML chuẩn.
* **Bước 3:** Kiểm tra nội dung email bao gồm: **Bảng danh sách mẫu**, **Tình trạng mẫu khi nhận**, **Ảnh chụp đính kèm** và file PDF **Phiếu tiếp nhận mẫu**.
* **Bước 4:** Click **[Gửi]**. Hệ thống cập nhật trạng thái hồ sơ sang **[Chờ bàn giao phòng Lab]**.

---

**Lưu ý quan trọng:** * Mọi thay đổi thông tin hành chính của hồ sơ sau bước này phải được ghi nhật ký trong mảng `resultHistory` (Audit Trail).

* Nếu `isBlindCoded = true`, toàn bộ thông tin định danh khách hàng sẽ bị ẩn đối với Kỹ thuật viên khi bàn giao mẫu.

Tôi đã hoàn thiện chi tiết quy trình tiếp nhận theo đúng các thao tác kỹ thuật và nghiệp vụ. Bạn có muốn tôi tiếp tục viết hướng dẫn cho **Phần Vận hành tại Phòng thử nghiệm (Nhập kết quả và Kiểm soát thiết bị)** không?