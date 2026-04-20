# HƯỚNG DẪN CHI TIẾT: LẬP BIÊN BẢN THỬ NGHIỆM (TEST PROTOCOL EDITOR)

Tài liệu này hướng dẫn chi tiết từng bước cách sử dụng công cụ **Test Protocol Editor** để lập biên bản thực nghiệm, ghi chép dữ liệu hóa chất và xuất báo cáo PDF phục vụ công tác ISO/IEC 17025.

---

## 1. Cách truy cập tính năng

Hệ thống cho phép bạn lập biên bản cho một hoặc nhiều phép thử cùng một lúc (Gom lô):

- **Cho 1 phép thử:** Tại danh sách ở các tab `Testing` hoặc `TechReview`, tìm đến phép thử cần làm, click vào icon **Tạo biên bản** (biểu tượng trang giấy và cây bút) ở cột Hành động.
- **Cho nhiều phép thử (Gom lô):**
    1. Tích chọn checkbox ở đầu dòng đối với các phép thử muốn đưa chung vào một biên bản.
    2. Bấm nút **"Lập biên bản (N)"** trên thanh công cụ (Toolbar) phía trên bảng.

---

## 2. Giao diện Trình soạn thảo (Editor)

Màn hình Editor được thiết kế dạng chia đôi:

- **Bên trái (70%):** Không gian soạn thảo văn bản phong phú (Rich Text) tương tự Microsoft Word.
- **Bên phải (30%):** Bảng công cụ hỗ trợ nghiệp vụ (Hóa chất, Biểu mẫu, Dữ liệu chỉ tiêu).

### 2.1. Thanh công cụ phía trên (Header Bar)

- **Editor Badge:** Hiển thị số lượng chỉ tiêu hiện đang có trong biên bản.
- **Chọn Phương pháp chính:** Nếu bạn gom lô nhiều chỉ tiêu có phương pháp khác nhau, hãy chọn phương pháp chính tại đây để hệ thống render đúng Tiêu đề biên bản.
- **Lưu dữ liệu:** Lưu lại nội dung đang soạn thảo và danh sách hóa chất vào Database (Lưu nháp).
- **Xuất PDF:** Đóng gói toàn bộ nội dung thành file PDF chính thức và lưu vào kho tài liệu của mẫu.
- **In Biên bản:** Mở hộp thoại in trực tiếp của trình duyệt (chỉ khả dụng sau khi đã Xuất PDF).

---

## 3. Các bước thực hiện chi tiết

### Bước 1: Khởi tạo nội dung (Templates)

Thay vì gõ từ đầu, hãy sử dụng các nguồn mẫu sẵn có:

1. Chuyển sang tab **Phương pháp** ở cột bên phải.
2. Sử dụng một trong hai cách:
    - **Chọn biểu mẫu từ Hệ thống:** Click để xem các file biểu mẫu (Word) đã được Quản lý Upload gắn với phương pháp này. Click chọn 1 file để hệ thống tự động chuyển đổi và đưa nội dung vào Editor.
    - **Tải file Word (.docx) từ máy tính:** Nếu bạn có mẫu riêng dưới máy, bấm nút này để tải lên. Hệ thống sẽ tự động đọc (Parse) nội dung file Word và hiển thị vào Editor (Lưu ý: Thao tác này sẽ ghi đè nội dung cũ đang có trong Editor).

### Bước 2: Nhập số liệu thực nghiệm

Sử dụng công cụ Editor bên trái để gõ nội dung:

- **Mục 1. Trình tự thử nghiệm:** Ghi lại các bước tiến hành thực tế.
- **Mục 2. Dữ liệu ghi nhận:** Ghi lại các số liệu cân, đo, đong, đếm thô.

### Bước 3: Chèn bảng chỉ tiêu tự động (Dynamic Tables)

Để tránh sai sót khi gõ lại kết quả, hãy sử dụng tính năng chèn bảng:

1. Tại tab bên phải, phần "Chỉ tiêu đã chọn", bấm **"Chèn bảng chỉ tiêu vào mẫu"**.
2. Một modal hiện ra, cho phép bạn chọn các cột thông tin sẽ hiển thị gồm:
    - **STT**: Số thứ tự.
    - **Mã mẫu**: Mã mẫu SMP-xxx.
    - **Mã chỉ tiêu**: Mã định danh duy nhất của phép thử.
    - **Tên chỉ tiêu**: Tên phép thử.
    - **PP thử**: Phương pháp thử nghiệm áp dụng (Protocol Code).
    - **Đơn vị**: Đơn vị đo.
    - **Kết quả**: Giá trị đo được cuối cùng.
3. Bấm **"Chèn ngay"** để đưa bảng vào vị trí con trỏ trong văn bản.

### Bước 4: Hiệu chỉnh Hóa chất tiêu hao

Tại tab **Hóa chất (BOM)** bên phải:

1. Hệ thống liệt kê tất cả các chai hóa chất/vật tư bạn đã lấy từ kho cho các chỉ tiêu này.
2. **Nhập số lượng:** Điền số lượng thực tế bạn đã tiêu dùng vào cột "Số lượng". Số liệu này sẽ được dùng để trừ kho và tính toán chi phí (COGS) sau này.
3. **Chèn bảng Hóa chất:** Bấm nút **"Chèn bảng Hóa chất"**. Một trình soạn thảo thu nhỏ hiện ra cho phép bạn sửa lại bảng hóa chất (gồm Tên, CAS, Số lô, Nhà SX, SL tiêu hao) trước khi bấm chèn vào biên bản chính.

---

## 4. Hoàn tất và Lưu trữ

1. **Kiểm tra định dạng:** Sử dụng thanh công cụ soạn thảo (In đậm, In nghiêng, Căn lề, Bảng) để trình bày biên bản chuyên nghiệp.
2. **Lưu dữ liệu:** Luôn bấm **"Lưu dữ liệu"** thường xuyên để tránh mất nội dung khi kết nối mạng không ổn định. Điều này cũng lưu luôn phần khai báo số lượng hóa chất ở Bước 4.
3. **Xuất PDF:** Khi biên bản đã hoàn thiện, bấm **"Xuất PDF"**.
    - Hệ thống sẽ tạo ra một bản ghi tài liệu (Document) chính thức gắn với các chỉ tiêu.
    - Sau khi xuất thành công, một biểu tượng file PDF sẽ xuất hiện bên cạnh phép thử tại Workspace để bạn và Quản lý có thể xem lại bất cứ lúc nào.

---

## 5. Lưu ý quan trọng

- **Đồng bộ tiêu đề:** Tên viện, Logo và Tiêu đề biên bản được hệ thống tự động khóa ở Header để đảm bảo đúng quy chuẩn ISO. Bạn có thể thay đổi Phương pháp chính để cập nhật dòng Method Title tương ứng.
- **Định dạng file:** Tính năng nhập file Word chỉ hỗ trợ định dạng `.docx` (không hỗ trợ `.doc` cũ).
- **Ảnh minh họa:** Nếu chèn hình ảnh vào Editor, hãy sử dụng tính năng kéo thả hoặc chèn ảnh từ toolbar. Nên resize ảnh vừa phải để file PDF có dung lượng tối ưu.
- **Bảo mật:** Mọi thao tác lưu và xuất bản đều được gắn log định danh Kỹ thuật viên thực hiện.

---

_Tài liệu hướng dẫn nội bộ LIMS - Technician Module_
