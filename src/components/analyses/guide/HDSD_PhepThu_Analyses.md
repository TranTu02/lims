# HƯỚNG DẪN SỬ DỤNG: QUẢN LÝ PHÉP THỬ (ANALYSES)

Tài liệu này hướng dẫn chi tiết quy trình quản lý phép thử (Analyses) trong hệ thống LIMS, bao gồm cách tiếp nhận mẫu phân tích, điền kết quả, kiểm tra vật tư và duyệt kết quả phát hành.

---

## MỤC LỤC

1. Tổng quan Module Phép thử
2. Theo dõi & Quản lý tiến độ (Analyses List)
3. Điền Số liệu & Tính toán kết quả (Result Data Entry)
4. Cấp phát & Tiêu hao Vật tư hóa chất (Consumables)
5. Soát xét & Phê duyệt (TechReview / Approve)

---

## 1. Tổng quan Module Phép thử

Sau khi bộ phận Lễ tân (Reception) hoàn tất quá trình nhận mẫu và bóc tách các chỉ tiêu cần kiểm tra, hệ thống sẽ tự động sinh ra các **Phép thử (Analyses)**.
Mỗi Phép thử đại diện cho 1 chỉ tiêu kiểm tra duy nhất trên 1 nền mẫu nhất định.

- **Quyền hạn**: Module này dành cho Nhân sự phòng Lab (Lab Technician), Quản lý Lab (Tech Manager), và QA/QC.
- **Lợi ích**: Dễ dàng theo dõi tiến độ từng phép thử độc lập; Kiểm soát chất lượng riêng rẽ; Truy xuất nguồn gốc hóa chất đã dùng.

---

## 2. Theo dõi & Quản lý tiến độ (Analyses List)

Màn hình đầu tiên khi truy cập module **Phép thử** (Analyses) là danh sách tổng hợp. Tại đây, KTV và Quản lý phòng có thể giám sát khối lượng công việc.

### Chức năng chính:

- **Thanh điều hướng nhanh**: Xem các phép thử theo từng bộ lộc: analysisId, sampleId, parameterName...
- **Bộ lọc trạng thái linh hoạt**: Có thể click chọn từng tab trạng thái:
    - `Pending`: Chờ phân công hoặc chờ KTV xử lý.
    - `Testing`: KTV đang tiến hành phân tích.
    - `TechReview`: Đã hoàn tất và chờ Quản lý kiểm duyệt sơ bộ.
    - `Approved`: Đã phê duyệt, sẵn sàng cấp giấy chứng nhận (Certificate).
- **Phân công Kỹ thuật viên**: Quản lý thao tác để gán KTV tương ứng với từng kỹ thuật hoặc chỉ tiêu.

---

## 3. Điền Số liệu & Tính toán kết quả (Result Data Entry)

Kỹ thuật viên chọn 1 Phép thử cụ thể để mở **Panel Chi Tiết** thao tác xử lý kết quả.

### Các bước thao tác:

1.  Nhấp đúp hoặc bấm `Edit` trên Phép thử cần báo cáo.
2.  Kiểm tra các thông tin cấu hình Phương pháp được kế thừa từ thư viện **Matrix**:
    - `methodLOD` (Limit of Detection) - Giới hạn phát hiện.
    - `methodLOQ` (Limit of Quantification) - Giới hạn định lượng.
      _(Đây là các Snapshot được lưu tại thời điểm cấp mẫu, đảm bảo tính vẹn toàn dữ liệu - KTV có thể ghi đè/sửa đổi nếu cấu hình chạy thực tế thay đổi so với mặc định)._
3.  Nhập dữ liệu vào các ô:
    - **Kết quả (Result)**: Thông số đo lường.
    - **Độ Khônng Đảm Bảo Đo (Uncertainty)**: Dung sai của phép thử, nếu có.
4.  Lưu thông tin tạm thời hoặc chuyển trạng thái sang `TechReview` để Trưởng phòng kiểm duyệt.

---

## 4. Cấp phát & Tiêu hao Vật tư hóa chất (Consumables)

Mỗi phép thử có thể sử dụng các sinh phẩm, hóa chất từ **Kho Hóa chất (Inventory)**. Quản lý hao hụt ở đây giúp giảm thiểu thất thoát và tuân thủ tiêu chuẩn ISO 17025.

### Quy trình sử dụng:

1.  Bên phải giao diện chi tiết, tìm mục **Vật tư sử dụng**.
2.  Hệ thống liệt kê các hóa chất đã cấp phát qua tính năng _Phân bổ (Allocate)_.
3.  Để cấp phát thêm: Bấm vào **"Mở form Cấp phát"**.
    - Dữ liệu liên kết sang module Inventory, lấy đúng LOT hóa chất và lô còn hạn sử dụng.
    - Sau khi duyệt _Transaction Block_ bên kho, hóa chất được tự động gắn mã tham chiếu lại `analysisId` đang thử.
4.  Xem lịch sử hao hụt ghi nhận chi tiết, giúp truy vết lại lỗi phân tích nếu sinh phẩm có vấn đề.

---

## 5. Soát xét & Phê duyệt (TechReview / Approve)

Khi KTV đã đưa kết quả lên, hệ thống yêu cầu Tech Manager hoặc QA/QC kiểm duyệt lại.

### Các bước thực hiện:

1.  Tại danh sách, lọc các phép thử có trạng thái `TechReview`.
2.  Đánh giá lại **Result**, **methodLOD/methodLOQ** và **Consumables** đã dùng có khớp phương pháp chưa.
3.  Có 2 luồng xử lý:
    - 👉 **Yêu cầu Retest (Thử nghiệm lại)**: Nếu nghi ngờ số liệu (sai số kỹ thuật, lỗi ghi chép), người quản lý nhập lý do vào Ghi chú và bấm "Retest". Phép thử tự động lùi về trạng thái `Testing` hoặc `Pending`.
    - 👉 **Phê duyệt (Approve)**: Nút Approval chỉ hiện cho tài khoản có quyền. Khi bấm "Phê duyệt", dữ liệu bị khoá, không ai được sửa ngoại trừ tài khoản QA cấp cao (trong trường hợp đặc biệt).
4.  Khi Phép thử được `Approved`, nó sẽ được tính vào cơ sở dữ liệu để xuất phiếu Phân tích (COA) tổng thể cho khách hàng tại Lễ tân.

---

_(Tài liệu này được đồng bộ cùng **Bubble Hướng dẫn sử dụng trực quan** bên trong màn hình hệ thống)._
