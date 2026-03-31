# Shipment Management System Documentation (Shipment Logic)

Tài liệu này chi tiết hóa logic xử lý vận đơn (shipment) trong hệ thống LIMS, tập trung vào việc tích hợp với các đơn vị vận chuyển (Viettel Post) và quản lý địa chỉ theo các cấp bậc hành chính (Tỉnh/Huyện/Xã).

## 1. Thành phần Hệ thống (Components)

| Component | Chức năng chính |
| :--- | :--- |
| `ShipmentManagerModal.tsx` | Component cha quản lý Modal, chuyển đổi giữa tạo mới và xem lịch sử vận đơn. |
| `ShipmentActionForm.tsx` | Form tạo mới vận đơn, tích hợp logic `AddressSplitter` để xử lý địa chỉ. |
| `ShipmentContextView.tsx` | Hiển thị thông tin vận đơn hiện tại gắn với Receipt (Tracking No, Trạng thái). |
| `ShipmentLabelPrint.tsx` | Renderer in nhãn nhiệt (100x100mm), hỗ trợ Barcode (Tracking) và QR Code (Shipment ID). |

---

## 2. Logic Xử lý Địa chỉ (Address Logic)

Hệ thống hỗ trợ 2 chế độ địa chỉ (Address Mode):
- **Trước sáp nhập (OLD - 4 cấp)**: Tỉnh, Huyện, Xã, Số nhà/Ngõ. Dùng cho Viettel Post (Legacy data).
- **Sau sáp nhập (NEW - 3 cấp)**: Tỉnh, Huyện/Xã, Số nhà.

### A. Tự động Tách địa chỉ (Address Splitter)
Khi người dùng nhập chuỗi địa chỉ lớn và nhấn **"Fill xuống"** (`handleFill`):
- Hệ thống tách chuỗi theo dấu `,`, loại bỏ các phần tử chứa "Việt Nam".
- Tự động điền các ô input thành phần dựa trên thứ tự ngược từ cuối chuỗi (Tỉnh -> Huyện -> Xã -> Số nhà).

### B. Kiểm tra Địa chỉ (Address Validation)
Đây là bước **bắt buộc** đối với chế độ "Trước sáp nhập" (OLD) để đảm bảo backend nhận được ID hợp lệ:
- Gọi API `/v2/shipments/getAddress/parse` với query `shipmentCarrier=VIETTEL_POST&addressType=OLD`.
- **Kết quả Hợp lệ**: Khi backend trả về đầy đủ `provinceId`, `districtId`, và `wardId`.
- **Phản hồi người dùng**:
    - **Xanh (Thành công)**: Hiển thị đầy đủ ID và Tên hành chính tương ứng.
    - **Vàng (Cảnh báo)**: Báo lỗi theo tầng (Nếu thiếu Quận/Huyện thì báo nhận diện được Tỉnh nhưng sai Huyện...).

### C. Cơ chế Reset Validity
Để đảm bảo tính nhất quán (Data Integrity), flag `isValid` sẽ tự động chuyển về `false` khi:
1. Người dùng thay đổi Address Mode (Pre <-> Post).
2. Người dùng nhấn lại nút "Fill xuống".
3. Người dùng **tự ý sửa tay** vào các ô input nhỏ (Xã, Huyện, Tỉnh).

---

## 3. Cấu trúc Dữ liệu Payload (JSONB Snapshots)

Khi gửi API tạo vận đơn, địa chỉ không được gửi dưới dạng string đơn thuần mà được đóng gói thành một **JSONB Snapshot**.

### Object: `ShipmentAddressSnapshot`
```json
{
  "address": "Số nhà 12, Ngõ 1",
  "wardId": 497,
  "wardName": "Phường Trung Văn",
  "districtId": 25,
  "districtName": "Quận Nam Từ Liêm",
  "provinceId": 1,
  "provinceName": "Hà Nội"
}
```

### Snapshot Quy định:
- `shipmentSender`: Snapshot thông tin người gửi (mặc định IRDOP).
- `shipmentReceiver`: Snapshot thông tin người nhận báo cáo từ Receipt (`reportRecipient`).
- `shipmentProduct`: Tự động tạo nội dung dựa trên `orderId` và `receiptId`.
- `shipmentOrder`: Chứa dịch vụ vận chuyển (`orderService`) và hình thức thanh toán (mặc định `payment: 3`).

---

## 4. Ràng buộc Tạo đơn (Submission Rules)

Trước khi thực hiện `mutate` API, hệ thống thực hiện các kiểm tra sau:
1. **Validation Rule**: Nếu `mode === "pre"`, cả địa chỉ Người gửi và Người nhận đều phải có `isValid === true`. Nếu không, sẽ hiển thị `toast.error` yêu cầu kiểm tra lại.
2. **Ghép đơn**: Nếu chọn `ghep_don`, hệ thống kiểm tra sự tồn tại của `attachShipmentId` trên server trước khi cho phép gửi.
3. **Product Mapping**: Mọi mẫu thử (`samples`) trong Receipt được map thành `shipmentItems` với cân nặng và loại mẫu tương ứng.

---

## 5. Logic In nhãn (Print Logic)

- **Barcode**: Luôn ưu tiên hiển thị `shipmentTrackingNumber`. Nếu chưa có, dùng `shipmentId` làm định danh tạm thời.
- **Address Formatting**: Do địa chỉ lưu dưới dạng JSONB, `ShipmentLabelPrint` sử dụng hàm `formatAddress` để nối các trường (address, ward, district, province) thành chuỗi hiển thị trên nhãn in.
- **Kích thước**: Chuẩn hóa cho giấy in nhiệt 100x100mm, Layout phân thành 4 khu vực: Mã vạch, Người gửi/nhận, Chi tiết hàng hóa, Ghi chú.
