# HƯỚNG DẪN SỬ DỤNG: KHÔNG GIAN KỸ THUẬT VIÊN (TECHNICIAN WORKSPACE)

Tài liệu này cung cấp hướng dẫn nghiệp vụ chi tiết cho Kỹ thuật viên (Technician) cách thao tác xử lý mẫu phân tích hàng ngày trong phòng Lab. Module này được thiết kế để gom nhóm các tác vụ, giảm thiểu thao tác nhập liệu thủ công và tự động hóa yêu cầu vật tư.

---

## MỤC LỤC

1. Tổng quan Không gian KTV
2. Nhận phân công (Tiếp nhận mẫu)
3. Gợi ý & Yêu cầu Hóa chất (FEFO Allocation)
4. Nhập kết quả lô (Bulk Entry)
5. Lập Biên bản thử nghiệm (Protocol Editor)

---

## 1. Tổng quan Không gian KTV

Nơi duy nhất và tập trung dành cho Kỹ thuật viên để quán xuyến công việc. Thay vì phải đi qua nhiều menu, tất cả **Phép thử (Analyses) được giao** đều sẽ xuất hiện tại Workspace này.

### Cấu trúc Tabs:

- **Chờ nhận (Pending)**: Chỉ tiêu mới phân công, chờ KTV xác nhận.
- **Đã nhận bàn giao (HandedOver)**: Chỉ tiêu đã nhận mốc thời gian nhưng chưa chạy.
- **Đang thử nghiệm (Testing)**: Chỉ tiêu đang trong quá trình thực nghiệm, nhập số liệu.
- **Cần làm lại (ReTest)**: Bị quản lý/QC trả về do nghi ngờ số liệu (cần thử nghiệm lại).
- **Yêu cầu Hóa chất**: Khu vực quản lý và theo dõi trình trạng cung ứng phiếu xuất hóa chất từ Kho (Inventory) để phục vụ cho thử nghiệm.

---

## 2. Nhận phân công (Tiếp nhận mẫu)

Vào đầu ca làm việc, KTV vào tab **Chờ nhận (Pending)** để nắm bắt khối lượng công việc.

1. Khung tìm kiếm cho phép lọc theo mã mẫu (SMP-xxx) hoặc Phép thử.
2. Tại bảng (Table), KTV tích chọn (`Multi-select checkbox`) vào những phép thử dự định làm trong ngày.
3. Bấm nút **"Nhận chỉ tiêu"** hiển thị sẵn ở phía trên thanh công cụ (Toolbar).
4. Hệ thống sẽ gom chung các mẫu vừa chọn và đẩy sang tab **Đã nhận bàn giao**.
   _(Việc nhận bàn giao cũng đánh dấu Timestamp thời điểm KTV cầm mẫu vật lý trong tay)_.

Sau khi đã setup/xử lý mẩu thử nghiệm tĩnh, bấm một lần nữa ở tab Đã nhận -> chọn **"Bắt đầu thử nghiệm"**, hệ thống đưa mẫu sang trạng thái `Testing`.

---

## 3. Gợi ý & Yêu cầu Hóa chất (FEFO Allocation)

Điểm mạnh của Workspace là tính năng cấp phát hao mòn vật tư thông minh bằng thuật toán **FEFO (First Expired, First Out - Hết hạn trước xuất trước)**.

### Thao tác:

1. Ở tab **Testing**, chọn cùng lúc nhiều mẫu (VD: Nhiều mẫu thuộc cùng 1 lô kiểm duyệt kim loại).
2. Bấm nút **Gợi ý hóa chất FEFO**.
3. Modal mở ra, LIMS gọi sang hệ thống Kho (Inventory), đối chiếu Phương pháp thử nghiệm (Protocol Code) và gợi ý Danh sách các chai hóa chất có số Lot sắp hết hạn nhất. Lượng tiêu thụ được tính tự động dựa trên số List Phép thử bạn đã chọn.
4. KTV kiểm tra bảng tính toán tổng hợp. Nếu Đồng ý, bấm **"Gửi yêu cầu & Tạo phiếu xuất"**.
5. Phiếu này sẽ đẩy sang tab Hóa chất thông báo cho Thủ kho mang hóa chất đến ngay bàn phân tích.

---

## 4. Nhập kết quả lô (Bulk Entry)

Khi quá trình đo hoàn tất trên thiết bị (Máy sắc ký, chuẩn độ,...), KTV có thể dùng chức năng **Bulk Entry** để tiết kiệm thời gian gõ.

1. Tại tab `Testing`, tích chọn các Phép thử cùng loại vừa chạy xong.
2. Bấm nút **"Nhập kết quả lô (Bulk Entry)"**.
3. Màn hình mở ra 1 bảng dạng lưới trực quan tương tự Microsoft Excel.
4. Ở lưới này, KTV thả thông số trực tiếp dọc theo từng dòng:
    - Kết quả (Result)
    - LOD / LOQ (nếu có biến thiên thực tế)
5. Bấm Submmit. Toàn bộ các Phép thử này sẽ lập tức được lưu vào Database và chuyển qua trạng thái `TechReview`, chờ Quản lý kiểm duyệt.

---

## 5. Lập Biên bản thử nghiệm (Test Protocol Editor)

Nhiều phòng thí nghiệm (ISO/IEC 17025) yêu cầu báo cáo thử nghiệm nội bộ hoặc cần đính kèm các biểu mẫu đặc thù. Workspace cung cấp công cụ soạn thảo Biên bản vô cùng mạnh mẽ:

### 5.1. Mở tính năng Lập biên bản:

Bạn có 2 cách thao tác:

- **Với 1 chỉ tiêu duy nhất**: Ở cuối dòng của phép thử đó tại cột Hành động, click vào icon biểu tượng **Tạo biên bản** (File + Cây bút).
- **Với lô/nhiều chỉ tiêu**: Sử dụng Checkbox cột đầu tiên để đánh dấu nhiều Phép thử cùng lúc, sau đó đưa chuột lên thanh công cụ (Toolbar) và bấm **"Lập biên bản (N)"**.

### 5.2. Công cụ Trình soạn thảo (Editor):

Khi Test Protocol Editor mở lên, màn hình chia làm 2 phần: Trái (Rich Text Editor soạn thảo) và Phải (Các công cụ nghiệp vụ).
Bạn có thể sử dụng các tiện ích sau để xây dựng biên bản nhanh chóng:

- **Bộ chèn nhanh (Bảng Hóa chất / Chỉ tiêu):**
    - Bấm sang tab **Hóa chất (BOM)**: Chèn bảng các vật tư hóa chất dự kiến tiêu hao vào văn bản để làm báo cáo xuất.
    - Sử dụng nút **Chèn bảng chỉ tiêu vào mẫu**: Để chắp vá danh sách các mẫu test (đã chọn ở 5.1) kèm kết quả vào văn bản.
- **Xử lý Biểu mẫu (Templates)**:
    - Click sang tab **Phương pháp**.
    - 👉 **Chọn biểu mẫu từ Hệ thống**: Hệ thống sẽ liệt kê các file Document (Word/Biểu mẫu) được Upload và kết nối sẵn với _Phương pháp chính_ của phép thử. Chọn 1 mẫu bất kỳ để Editor tự động render ra.
    - 👉 **Tải file Word (.docx) vào biên bản**: Ở máy tính bạn có file nội dung dựng sẵn (Form tự làm, báo cáo trả tay)? Chỉ cần bấm nút này để ném file .docx lên. Trình soạn thảo sẽ Extract & Parse trực tiếp văn bản Word vào màn hình để bạn tự do sửa tiếp nội dung. (Lưu ý: Hành động này sẽ ghi đè toàn bộ nội dung Editor hiện tại).
- **Xuất khẩu / In ấn PDF**:
    - Click **Lưu dữ liệu**: Trạng thái và nội dung Biên bản sẽ được gắn dính vĩnh viễn với Phép thử để làm Evidence (Bằng chứng).
    - Dùng các phím **Xuất PDF** hoặc **In Biên bản** ở góc phải màn hình để xuất trực tiếp văn bản này ra để ký tươi (nếu Cấp trên hoặc hệ thống ISO yêu cầu bản cứng).

---

_(Tài liệu này được đồng bộ cùng **Bubble Hướng dẫn sử dụng trực quan** bên trong hệ thống)._
