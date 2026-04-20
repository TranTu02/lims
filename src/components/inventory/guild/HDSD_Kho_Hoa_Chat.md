# HƯỚNG DẪN SỬ DỤNG CHI TIẾT - MODULE QUẢN LÝ KHO HÓA CHẤT (LIMS)

Tài liệu này hướng dẫn chi tiết từng bước (step-by-step) toàn bộ quy trình nghiệm vụ cốt lõi của Kho Hóa chất, được thiết kế cho người dùng Hệ thống LIMS.

---

## BƯỚC 1: KHAI BÁO VÀ QUẢN LÝ DANH MỤC HÓA CHẤT (SKUs)

Trước khi hóa chất vật lý có thể được nhập vào kho, hệ thống cần biết thông tin cơ sở của loại hóa chất đó. Mọi định nghĩa về một loại hóa chất chung gọi là **SKU** (Stock Keeping Unit).

### 1.1. Thêm mới một Danh mục Hóa chất (SKU)

1. Tại Menu chính kho hóa chất, chọn Tab **Danh mục Hóa chất**.
1. Nhấn nút màu xanh **`+ Thêm Hóa chất`** ở góc trên bên phải màn hình.
1. Form nhập liệu sẽ xuất hiện. Bạn cần điền đầy đủ:

- **Mã SKU**: Để trống để hệ thống tự phát sinh mã (ví dụ: `SKU-CHEM-0001`), hoặc nhập mã tự quản lý (nếu có).
- **Tên hóa chất** (_Bắt buộc_): Nhập tên hiển thị chính thức của hóa chất (VD: `Hydrochloric Acid 37%`).
- **Số CAS**: Chuỗi phân định danh hóa chất toàn cầu (VD: `7647-01-0`). Giúp tra cứu tránh nhầm lẫn.
- **Đơn vị cơ sở** (_Bắt buộc_): Chọn đơn vị tính sẽ được dùng xuyên suốt cho hóa chất này (VD: `mL`, `g`, `L`, `kg`). **Lưu ý**: _Sau khi đã lưu và có giao dịch, đơn vị này sẽ không thể tự do thay đổi._
- **Phân loại GHS (Label)**: Chọn tính chất nguy hiểm (VD: `C-Corrosive` / `F-Flammable` / `T-Toxic`).
- **Ngưỡng tồn kho tối thiểu**: Nhập một con số (VD: `500`). Khi lượng tổng các chai trong kho thấp hơn mức này, hệ thống sẽ gạch chân đỏ để cảnh báo nhập thêm hàng.

1. Nhấn **`Lưu lại`**. Hóa chất mới sẽ xuất hiện trong màn hình Danh mục.

### 1.2. Tra cứu tồn kho tổng và Xem thông tin SKU

1. Tại bảng danh sách **Danh mục Hóa chất**, bạn có thể dùng thanh **Tìm kiếm** góc trên cùng để gõ tên hoặc mã CAS.
1. Bạn có thể sử dụng màng lọc **Phân loại** (ở Header của bảng) để chỉ hiển thị các hóa chất Dễ cháy, Ăn mòn...
1. **Xem Chi tiết**: Click chuột trái vào một dòng SKU bất kỳ. Một _Panel Chi tiết_ sẽ đẩy ra ở bên phải:

- Tại đây sẽ hiển thị thông tin thẻ SKU.
- Đặc biệt hiển thị **Tổng tồn kho**: Đây là tổng số ML/Gram của toàn bộ lọ/chai hiện tại đang có trong kho của hóa chất này.
- Cuối Panel sẽ hiển thị danh sách các **Lọ/Chai thực tế** của loại hóa chất này, số lô và vị trí đặt của từng chai để người dùng đi tìm ở kho cho chính xác.

---

## BƯỚC 2: QUẢN LÝ LỌ/CHAI HÓA CHẤT (INVENTORIES)

Sau khi khai báo SKU, khi hàng vật lý về kho (thông qua Phiếu Nhập), hệ thống sẽ tạo ra các thẻ Lọ/Chai để đại diện cho từng bình hóa chất vật lý.

### 2.1. Quản lý trạng thái và vị trí Lọ/Chai

1. Chuyển sang Tab **Quản lý Lọ/Chai**.
1. Tại đây hiển thị cụ thể từng bình hóa chất, với **Barcode riêng biệt** (VD: `BTL-00123`).
1. Click vào 1 hàng để mở Panel Chi tiết Lọ/Chai:

- Xem được **Trạng thái**: _Mới_ (Chưa mở nắp), _Đang sử dụng_, _Hết hạn_, hoặc _Đã rỗng_.
- Nhấn nút **`✏️ Sửa`** nếu bạn muốn cập nhật vị trí lưu kho thực tế trên kệ của hũ này (VD: Tủ Hóa Chất Tầng 2 - Khay A), hoặc cập nhật Hạn mở nắp thực tế sau khi khui bình.

### 2.2. In Tem Mã Vạch (Barcode QR Label)

Để quản lý kho số hóa, mọi chai lọ đều cần dán tem sinh ra từ hệ thống.

1. Trong Tab **Quản lý Lọ/Chai**, tích chọn vào **Checkbox** ở đầu các dòng lọ/chai vừa mới nhập kho mà bạn muốn in tem.
1. Ngay lập tức một thanh công cụ màu xanh nổi lên ở dưới. Nhấn vào nút **`🖨 In Tem`**.
1. Cửa sổ Review Tem sẽ hiển thị, kiểm tra lại layout (Tên hóa chất, Nồng độ, Barcode...).
1. Xác nhận lệnh in. Máy in tem chuyên dụng nối hệ thống sẽ nhả tem để bạn dán lên nắp/thân chai.

### 2.3. Tách lọ (Nội bộ)

- Nếu bạn lấy một can dung môi lớn (VD: 5 Lít) san ra 5 hũ nhỏ (mỗi hũ 1 Lít) để phát cho các phòng lab, bạn cần thao tác:
- Mở chi tiết can dung môi lớn -> Chọn nút **`✂️ Tách lọ`** -> Nhập số lượng hũ con và thể tích mỗi hũ -> Hệ thống sẽ tự động trừ đi can gốc và đẻ ra 5 Barcode mới cho 5 hũ nhỏ để In tem riêng.

---

## BƯỚC 3: TẠO VÀ XỬ LÝ PHIẾU XUẤT/NHẬP KHO (TRANSACTION BLOCKS)

Hệ thống kho LIMS chỉ tính lượng thay đổi thông qua Phiếu, không cho phép nhập số ảo.

### 3.1. Tạo Phiếu

1. Chuyển sang Tab **Phiếu Xuất/Nhập Kho**.
1. Nhấn nút **`+ Tạo phiếu`** màu xanh. Modal Form Tạo Phiếu mở ra.

### 3.2. Điền thông tin Chung cho phiếu

1. **Chọn Loại Phiếu**:

- Nhấp chọn **`Nhập kho (IMPORT)`**: Dùng khi hóa chất mới về mua mới.
- Nhấp chọn **`Xuất kho (EXPORT)`**: Dùng khi phòng lab xin xuất hóa chất để làm mẫu nghiệm, chiết xuất, chạy máy.
- Nhấp chọn **`Điều chỉnh (ADJUSTMENT)`**: Dùng khi bù trừ sau kiểm kê thực tế kho, nứt vỡ, hay cân sai.

1. **Số chứng từ tham chiếu**: Gõ mã Purchase Order (PO), mã Phiếu yêu cầu YC-LAB, hoặc bất kỳ mã theo dõi nguồn gốc bên ngoài nào.
1. **COA / Hóa đơn cấp phiếu**: Đính kèm File COA (Certificate Of Analysis) của nhà cung cấp từ máy tính. File này mặc định áp dụng chung cho mọi chai nằm trong phiếu.

### 3.3. Thao tác đưa các hóa chất vào Phiếu

Ở phần dưới cùng của Modal, bạn đưa hóa chất vào phiếu thông qua 2 cách:

- **CÁCH 1 (Siêu tốc - Chế độ Quét QR)**:
    - Nhấn vào nút **`📷 Quét QR`**. Con trỏ sẵn sàng tiếp nhận.
    - Dùng SÚNG QUÉT MÃ VẠCH (Barcode Scanner) bán tia vào tem nhãn dán trên các hũ hóa chất.
    - Hệ thống nghe thấy âm "_típ_" từ máy quét sẽ tự động ném bình đó vào danh sách form và lặp lại liên tục cho bình khác.
- **CÁCH 2 (Chọn thủ công)**:
    - Nhấn nút **`+ Chọn từ kho`**. Khung tìm kiếm mở ra tất cả các lọ hiện có trong kho.
    - Dùng thanh Search gõ tên, tick vào ô checkbox các lọ lấy ra, rồi nhấn "Đồng ý thêm".

### 3.4. Cấu hình Dòng Hóa chất (Line items)

Card chi tiết của từng loại hóa chất vừa đưa vào sẽ hiện ra trong form:

1. **Khai báo Số Lượng Giao dịch**:

- Luôn luôn điền SỐ DƯƠNG (VD: điền `50` cho mục đích xuất 50mL). Hệ thống tự hiểu Phiếu Xuất kho là âm tồn (-) và Phiếu Nhập kho là Tăng tồn (+).

1. **Khai báo Khối lượng tĩnh cả bì (Tuỳ chọn)**:

- Nếu bạn để chai hóa chất lên cân phân tích, điền lượng tổng (Gồm chất lỏng và vỏ chai). Tính năng này dùng rà soát định kỳ.

1. **Khai báo Analysis ID (CỰC KỲ QUAN TRỌNG VỚI PHIẾU XUẤT)**:

- Khi làm Phiếu Xuất Kho, mục **Mã Chỉ Tiêu (Analysis ID)** được đánh dấu SAO BẮT BUỘC (\*).
- Đây là liên kết truy xuất nguồn gốc: Bạn bắt buộc phải khai báo xuất lô bột/dung dịch này để chạy cho bài thử nghiệm/chỉ tiêu nào (VD: `ANL-2025-101`).
- Nếu 1 chai xuất ra chia thành 2 phần cho 2 mẫu báo cáo khác nhau: Nhấn nút **`Nhân bản`**. Card chai đó sẽ tách làm 2 dòng với cùng barcode nhưng bạn có thể điền 2 Analysis ID khác nhau.

### 3.5. Trình Duyệt Phiếu

Sau khi điền đủ vào các Card hóa chất dự kiến thay đổi.

1. Nhấn nút góc dưới **`💾 Tạo phiếu & Giao dịch`**.
1. Hệ thống cảnh báo và sinh ra một Phiếu.
1. Tình trạng phiếu lúc này là **`PENDING (Chờ Duyệt)`**. Hóa chất chưa hề bị trừ trong kho phần mềm cho đến khi được Duyệt chính thức.

---

## BƯỚC 4: DUYỆT PHIẾU VÀ TRÍCH XUẤT (IN PHIẾU PDF)

_Phần này thuộc về thẩm quyền của Quản lý Kho hoặc người được cấp quyền Duyệt kho._

### 4.1. Quy trình Xét Duyệt tự động FEFO

1. Mở Cửa sổ Tab **Phiếu Xuất/Nhập Kho**, bấm vào Hàng Phiếu đang có trạng thái `PENDING`.
1. Panel chi tiết hiển thị ở cột bên phải, kéo xuống góc dưới bấm: **`✓ Duyệt Phiếu`**.
1. Cửa sổ **Workflow Approval** hiển thị với thông số kiểm tra:

- **Pick-list (Gợi ý FEFO)**: Hệ thống tự động soi kiểm tra Lô Lọ/Chai mã vạch bạn đưa vào xem có còn tồn kho đủ để Trừ không. Đồng thời nó soát xem Lọ đó có tuân thủ quy tắc **Hết Hạn Trước thì phải Xuất Trước (FEFO)** không.
- Nếu vi phạm FEFO, hệ thống sẽ chèn dòng cảnh báo chữ màu cam, người duyệt có quyền bắt điều chỉnh nếu cần.

1. Khi toàn bộ đèn kiểm tra đều sáng Xanh, Quản lý nhấn lại nút **`✓ Xác nhận Duyệt (Approve)`** lần cuối.
1. Lúc này Hệ Thống thực thi: _Ghi vào Dữ liệu gốc Ledger - Tồn kho biến động tương ứng - Phiếu lên trạng thái APPROVED_. Đây là mức **CHỐNG TẨY XÓA TUYỆT ĐỐI**, sau lệnh này, mọi kết quả sai chỉ có thể được tạo bằng phiếu Điều chỉnh (ADJUSTMENT) bù qua.

### 4.2. In (Trích xuất PDF) Phiếu Kho chuyên dụng

1. Sau khi phiếu chuyển trạng thái Nhập/Xuất thành công (**APPROVED**). Quản lý kho click lại vào hàng của tên phiếu ở danh sách.
1. Trong thanh tiêu đề trên cùng Panel Chi tiết Phiếu có hiển thị Nút nhỏ **`📄 Trích xuất`** .
1. Nhấp vào nó, trình duyệt sẽ tự động gọi file API để biên dịch và Dowload _bản In Giấy PDF_ Phiếu Xuất Kho chuẩn mực, mang logo công ty với toàn bộ thông tin mã Chai, số dòng, nhân viên và khu vực ký tên trình ký vật lý đem bấm ghim hóa đơn lưu trữ kế toán.

---

## BƯỚC 5: KIỂM TRA LỊCH SỬ GIAO DỊCH VÀ XUẤT BÁO CÁO (LEDGER)

Mọi biến động của Kho sau vòng Đời được lưu tại Tab cao nhất về quyền kiểm toán.

### 5.1. Xem sổ Ledger

1. Chuyển sang Tab **Lịch sử Giao dịch** để có góc nhìn "Truy xuất nguồn gốc".
1. Bảng này không gom theo phiếu mà chẻ từng **Giao Dịch Đơn Thể** (Mỗi card hóa chất một dòng lịch sử with Timestamp, Id phiếu Gốc liên kết...).
1. Click để hiển thị Panel bên góc phải nhằm Audit xem: **Người nào Duyệt lúc mấy giờ, Mở bảng COA đính kèm gốc của nó là ảnh nào**.

### 5.2. Xuất Báo Cáo Tracking (Report)

LIMS cho phép bạn in sổ Tồn Kho theo lịch sử phục vụ Sở Y Tế lên tra xét định kỳ.

1. Vẫn đang ở view **Lịch sử Giao dịch**, ở Tool bar góc trên nhấn nút **`📥 Xuất báo cáo`**.
1. Một Form tùy chọn báo cáo sổ kho hiện ra.
1. Nhập **Bộ mốc thời gian Tracking**: Cung cấp `Từ ngày` - `Đến ngày`.
1. Viết Tiêu Đề Báo Cáo (VD: "Sổ theo dõi Nhập Xuất hóa chất Tháng 04/2026").
1. Bấm **`Xuất PDF`** hoặc **`Tải Excel`**. Các Log History xuất nhập kho sẽ được đóng gói File gọn gàng, tính tổng cột và lưu trữ an toàn.

---

_(Kết thúc quy trình luân chuyển Hóa Chất Chuẩn của hệ thống LIMS)_
