# TÀI LIỆU QUY TRÌNH NGHIỆP VỤ KHO HÓA CHẤT (SOPs)

## NGHIỆP VỤ 1: QUẢN LÝ DANH MỤC (MASTER DATA MANAGEMENT)

_Luồng này thực hiện khi phòng Lab cần sử dụng một loại hóa chất mới hoàn toàn chưa từng có trong kho._

**1. Khai báo mã Hóa chất (SKU):**

- **User:** Nhập thông tin hóa chất mới (Tên, Số CAS, Đơn vị, Ngưỡng cảnh báo tồn `chemicalReorderLevel`, Mức độ độc hại `chemicalHazardClass`).
- **System:** Kiểm tra dữ liệu. Nếu hợp lệ, lưu vào bảng `chemicalSkus` (Schema: `chemicalInventory`).
- **ID Prefix:** `SKU_` (VD: `SKU_HNO3`).

**2. Khai báo Nhà cung cấp (Vendor):**

- **User:** Thêm thông tin NCC, đính kèm chứng chỉ ISO của NCC để phục vụ thanh tra.
- **System:** Lưu vào bảng `chemicalSuppliers` (Schema: `chemicalInventory`) với trạng thái `Active`.
- **ID Prefix:** `SUP_` (VD: `SUP_001`).

**3. Khớp nối Năng lực cung cấp (Sourcing):**

- **User:** Cấu hình NCC A bán Hóa chất X với quy cách đóng gói (VD: Chai 500ml), mã Catalog là 12345.
- **System:** Lưu vào bảng nối `chemicalSku_chemicalSupplier` (Schema: `chemicalInventory`). Đây là cơ sở để sau này hệ thống tự động sinh Đơn đặt hàng (PO).
- **ID Prefix:** `SKS_` (VD: `SKS_001`).

---

## NGHIỆP VỤ 2: TỰ ĐỘNG CẢNH BÁO VÀ NHẬP KHO (INBOUND)

_Luồng quản lý từ lúc thiếu hụt hóa chất đến khi hàng về tận kho._

**1. Cảnh báo thiếu hụt (Reorder Alert):**

- **System:** Job chạy ngầm liên tục so sánh `chemicalTotalAvailableQty` và `chemicalReorderLevel` trong bảng `chemicalSkus`. Nếu **Tồn < Cảnh báo**, đẩy thông báo cho bộ phận Mua hàng.

**2. Thực hiện Nhập kho (Goods Receipt - Maker/Checker):**

- **Bước 1: Đề xuất Nhập (Maker - Thủ kho):**
    - Thủ kho cầm Hóa đơn/COA, nhập thông tin lô hàng.
    - **System:**
        - Tạo phiếu nhập `chemicalTransactionBlocks` (Loại `IMPORT`, Trạng thái `DRAFT`).
        - Ghi các dòng dự kiến nhập vào `chemicalTransactionBlockDetails` (Lưu thông tin Lot, Hãng, Hạn dùng, COA...).
- **Bước 2: Phê duyệt (Checker - Quản lý kho/Kế toán):**
    - Kiểm tra tính hợp lệ của chứng từ và dữ liệu nhập liệu. Bấm "Approve".
- **Bước 3: Thực thi hệ thống (Execution - Tự động):**
    - Chuyển trạng thái Block sang `APPROVED`.
    - **Sinh mã QR/Barcode:** Tự động sinh N bản ghi vào `chemicalInventories` (Trạng thái `New`). **Prefix: `BTL_`**.
    - **Chốt sổ cái:** Ghi N dòng vào `chemicalTransactions` (Hành động: `IMPORT_NEW`). **Prefix: `TXN_`**.
    - **Cập nhật tồn:** Cộng dồn số lượng vào `chemicalSkus`.
    - In tem nhãn QR để dán lên từng chai.

---

## NGHIỆP VỤ 3: XUẤT KHO CẤP PHÁT (OUTBOUND & ALLOCATION)

_Đây là nghiệp vụ quan trọng nhất, liên kết trực tiếp với hoạt động kiểm nghiệm của KTV._

**1. Tính toán nhu cầu (BOM Calculation):**

- **System:** Khi Trưởng Lab giao 10 chỉ tiêu (`analyses`) cho KTV. Hệ thống đọc bảng cấu hình `matrixChemicals` để tính ra tổng lượng hóa chất cần thiết. Trích xuất ra "Phiếu yêu cầu xuất kho nội bộ".

**2. Chạy thuật toán FEFO (First Expire, First Out):**

- **System:** Quét bảng `chemicalInventories` để tìm các chai hóa chất phù hợp. Thứ tự ưu tiên bốc hàng:
    1.  Chai đang dùng dở (`chemicalInventoryStatus` = `InUse`).
    2.  Chai có Hạn sử dụng (`expDate`) gần nhất.
    3.  Lượng tồn trong chai (`currentAvailableQty`) còn ít nhất.

**3. Quy trình Xuất kho 3 bước (Physical Issuing - Maker/Checker):**

- **Bước 1: Đề xuất Xuất (Maker - KTV/Thủ kho):**
    - Dựa trên gợi ý FEFO, hệ thống tạo phiếu xuất `chemicalTransactionBlocks` (Loại `EXPORT`, Trạng thái `DRAFT`).
    - Lưu danh sách chai dự kiến bốc vào `chemicalTransactionBlockDetails`. Lúc này tồn kho vật lý **chưa bị trừ**.
- **Bước 2: Phê duyệt & Cấp phát (Checker - Thủ kho/Quản lý):**
    - Thủ kho quét mã QR thực tế trên chai để xác nhận đúng chai hệ thống yêu cầu. Bấm "Approve".
- **Bước 3: Thực thi hệ thống (Execution - Tự động):**
    - Chuyển trạng thái Block sang `APPROVED`.
    - **Trừ kho vật lý:** Cập nhật `currentAvailableQty` và `chemicalInventoryStatus` (từ `New` -> `InUse`) trong `chemicalInventories`.
    - **Ghi sổ cái:** Insert dữ liệu từ Details sang `chemicalTransactions` (Hành động: `INITIAL_ISSUE`). **Prefix: `TXN_`**.
    - **Cập nhật tồn tổng:** Trừ tồn kho trong `chemicalSkus`.
    - **Đồng bộ LIMS:** Bắn mảng JSON vào cột `consumablesUsed` của bảng `analyses`.

---

## NGHIỆP VỤ 4: XỬ LÝ NGOẠI LỆ TRONG PHÒNG LAB (EXCEPTIONS)

_Xử lý các tình huống phát sinh ngoài định mức khi KTV thực hiện phép thử._

**1. Yêu cầu xin cấp thêm (Supplemental Request):**

- **Nguyên nhân:** KTV làm đổ mẫu, máy lỗi cần chạy lại, định mức BOM không đủ...
- **User:** KTV bấm nút "Xin thêm hóa chất" trên hệ thống, nhập lý do bắt buộc. Trưởng Lab ký duyệt e-signature.
- **System:** Lặp lại Quy trình 3 (Xuất kho). Nhưng dòng lịch sử trong `chemicalTransactions` sẽ ghi `actionType` là `SUPPLEMENTAL`. Đoạn JSON bắn vào `analyses` cũng có cờ (flag) là Xin thêm để QA dễ dàng truy vết tại sao bài test này lại tốn hóa chất hơn bình thường.

**2. Trả lại hóa chất / Hủy phép thử (Returns):**

- **Trường hợp 1 (Trả nguyên trạng):** KTV chưa bóc tem chai hóa chất -> Hệ thống tạo `chemicalTransactions` với `actionType` = `RETURN`. Cộng trả lại tồn kho vào `chemicalInventories` (Status quay về `New`) và `chemicalSkus`.
- **Trường hợp 2 (Đổ rác thải - Waste):** KTV đã lấy hóa chất ra cốc (beaker), dư không xài hết. **Tuyệt đối không đổ lại chai gốc.** Hệ thống tạo `chemicalTransactions` với `actionType` = `WASTE`. Không cộng lại tồn kho. Cập nhật cảnh báo vào sổ quản lý rác thải nguy hại.

---

## NGHIỆP VỤ 5: KIỂM KÊ VÀ XỬ LÝ HẠN SỬ DỤNG (AUDIT & EXPIRATION)

_Bảo vệ tính chính xác của dữ liệu kho so với vật lý thực tế._

**1. Kiểm soát Hạn sử dụng (Expiration Management):**

- **System:** Job chạy ngầm hàng đêm lúc 00:00 quét bảng `chemicalInventories`.
    - Nếu `expDate` (Hạn in trên vỏ) hoặc `openedExpDate` (Hạn sau khi mở nắp) < Ngày hiện tại: Đổi `chemicalInventoryStatus` thành `Expired`.
    - Hệ thống tự động loại các chai này khỏi thuật toán FEFO (Không cho phép xuất kho nữa).

**2. Quy trình Kiểm kê chuẩn (Inventory Audit):**

- **Bước 1: Khởi tạo đợt kiểm kê (Audit Planning):**
    - **User:** Tạo phiếu `chemicalAuditBlocks` (Trạng thái `DRAFT`). Chọn phạm vi (`auditScope`: Tủ A, hoặc Loại Độc hại...).
    - **System:** Thực hiện **Snapshot** dữ liệu tồn kho hiện tại vào bảng `chemicalAuditDetails` (Cột `systemAvailableQty`).
- **Bước 2: Thực hiện kiểm đếm (Field Auditing):**
    - **User (KTV):** Cầm tablet/máy quét đi tới kệ hàng. Quét mã chai (`isScanned` = true) và nhập số lượng cân/đo thực tế (`actualAvailableQty`).
    - **System:** Tự động tính `varianceQty` (Độ lệch).
- **Bước 3: Phê duyệt & Điều chỉnh (Approval & Adjustment):**
    - **Checker (Quản lý):** Xem các dòng có `varianceQty` != 0. Yêu cầu giải trình hoặc bấm "Comfirm Audit".
    - **System Logic (Khi chốt):**
        - Chuyển Audit sang `COMPLETED`.
        - Tự động sinh 1 phiếu `chemicalTransactionBlocks` (Loại `ADJUSTMENT`) liên kết với Audit này.
        - Cập nhật thể tích thực tế vào `chemicalInventories`.
        - Ghi sổ cái `chemicalTransactions` để lưu vết hao hụt/dư thừa.
        - Điều chỉnh tồn tổng trong `chemicalSkus`.

---

### TÓM LẠI: LỢI ÍCH CỦA BỘ NGHIỆP VỤ NÀY

Bộ tài liệu nghiệp vụ này kết hợp với Database Schema V3 mang lại:

1. **Dễ dàng In phiếu:** Do bảng `chemicalTransactions` đã được lưu theo dạng Snapshot Flattened, Thủ kho có thể truy xuất phiếu Xuất/Nhập ngay lập tức (Chỉ với 1 câu lệnh SELECT WHERE).
2. **Sẵn sàng đối phó Thanh tra (Audit-Ready):** Mọi "đường đi" của hóa chất, từ khi nhận hàng (kèm COA), mở nắp ngày nào, dùng cho phép thử nào, ai làm đổ, độ hao hụt bay hơi ra sao... đều được minh bạch và không thể tẩy xóa.
3. **Hệ thống Schema & ID chuẩn hóa:** Sử dụng Schema `chemicalInventory` riêng biệt và bộ ID Prefix gạch dưới `_` mạnh mẽ (`SKU_`, `SUP_`, `BTL_`, `TRB_`, `TXN_`).
