# Tài liệu Đặc tả Logic UI/UX Kéo thả Quản lý Vị trí Lưu mẫu (Samples Storage)

Tài liệu này mô tả chi tiết logic giao diện, kéo thả, và đồng bộ dữ liệu của component `StorageLocationMap.tsx`.

---

## 1. Mục đích & Bố cục Giao diện

Bản đồ Vị trí Lưu mẫu cung cấp giao diện trực quan dạng chia đôi (Split View) cho phép nhân viên kho phân bổ và thay đổi vị trí bảo quản của các mẫu thử trong kho một cách nhanh chóng bằng thao tác kéo thả hoặc chọn hàng loạt.

```
+----------------------------------------------------------------------------------------+
|                                       TOOLBAR                                          |
|  [Search Input] [Product Type Filter]                                                  |
+----------------------------------------------------------------------------------------+
|                                  DND WORKSPACE                                         |
|  +-------------------------------------+  +-----------------------------------------+  |
|  | LEFT: UNASSIGNED SAMPLES            |  | RIGHT: STORAGE CABINETS/SHELVES         |  |
|  | - Header & total unassigned count   |  | - Dynamic Cabinets Grid                 |  |
|  | - Bulk Selection controls           |  | - Item count badge per Cabinet          |  |
|  | - Card list (Sample ID + Name)      |  | - Cabinet Card (Droppable Zone)         |  |
|  | - Compact Pagination (50/page)      |  | - Click Header -> 90% View Modal        |  |
|  +-------------------------------------+  +-----------------------------------------+  |
+----------------------------------------------------------------------------------------+
```

---

## 2. Chi tiết Logic Hoạt động UI/UX

### 2.1. Panel bên trái: Mẫu chưa xếp vị trí (Unassigned Samples)
*   **Dữ liệu đầu vào**: Lấy danh sách mẫu có `sampleStorageLoc` bằng `null` thông qua API của `useSamplesList` với tham số phân trang.
*   **Thanh Tìm kiếm**: Nhập mã mẫu (`sampleId`) hoặc tên mẫu. Tìm kiếm được debounce 300ms.
*   **Dropdown Bộ lọc Loại Sản Phẩm (Product Type)**:
    *   Lấy dữ liệu từ danh sách loại mẫu thử (`sampleType`).
    *   Dropdown được cấu hình phân trang giới hạn **20 items/trang** để tối ưu hiệu năng render.
*   **Phân trang**:
    *   Mặc định hiển thị **50 mẫu/trang**.
    *   Nút phân trang được thu gọn ở chân panel trái để tiết kiệm diện tích.
*   **Chọn hàng loạt (Bulk Move)**:
    *   Nhấp chọn checkbox hoặc nhấp trực tiếp vào vùng text của card mẫu đều kích hoạt chọn/bỏ chọn.
    *   Khi có mẫu được chọn, bảng điều khiển trượt xuống hiển thị số lượng mẫu đã chọn, nút "Chọn tất cả"/"Bỏ chọn tất cả" và Dropdown danh sách các tủ kệ. 
    *   Chọn tủ kệ và ấn nút "Chuyển" sẽ gọi API bulk update để di chuyển toàn bộ các mẫu được tích chọn sang tủ đó.

### 2.2. Panel bên phải: Kệ tủ / Vị trí Lưu trữ (Storage Cabinets)
*   **Nguồn dữ liệu**: Danh sách kệ tủ được lấy động từ API enum `/v2/enum/get/list?enumType=sampleStorageLoc`.
    *   *Fallback*: Nếu API chưa trả về hoặc trống, hệ thống sử dụng danh sách tủ mặc định (`Tủ Lạnh A`, `Tủ Lạnh B`, `Tủ Đông C`, `Kệ Khô 1`, `Kệ Khô 2`).
    *   *Phân loại tủ*: Tên tủ chứa từ "lạnh" sẽ có kiểu tủ mát (`cold`), chứa từ "đông" sẽ có kiểu tủ đông (`frozen`), các từ còn lại xếp vào kệ khô (`dry`).
*   **Modal Chi tiết Tủ (Cabinet Detail Modal)**:
    *   Khi nhấp vào tiêu đề của một hộp tủ, Modal chi tiết sẽ mở ra với kích thước chiếm **90% width/height màn hình**.
    *   Modal hiển thị danh sách các mẫu đang lưu giữ trong tủ đó dưới dạng bảng (Table) chi tiết kèm phân trang đầy đủ.

---

## 3. Cơ chế Kéo Thả (Drag and Drop)

Component sử dụng thư viện `@dnd-kit/core` để hiện thực kéo thả:

### 3.1. Thiết kế Card Draggable & Drag Overlay
*   Mỗi thẻ mẫu thử hiển thị dạng `DraggableSampleCard`. Trình lắng nghe kéo thả được gán độc lập vào **Drag Handle icon** (biểu tượng 6 dấu chấm) để không gây xung đột với sự kiện click chọn card.
*   Khi đang kéo, thẻ card gốc được làm mờ đi (`opacity: 0.5`) và đứng yên, còn `<DragOverlay>` sẽ hiển thị một bản sao card rõ nét (`opacity: 1`) di chuyển mượt mà theo con trỏ chuột.

### 3.2. Cô lập Droppable Container (`DroppableContainer`)
Để tránh lỗi dnd-kit bị mất ref hoặc đăng ký chậm do component cha re-render liên tục khi update state, panel bên trái được bọc trong một component con biệt lập:
```typescript
function DroppableContainer({ id, htmlId, className, activeClassName, children }) {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} id={htmlId} className={`${className} ${isOver ? activeClassName : ""}`}>
            {children}
        </div>
    );
}
```
Component này tự quản lý ref của chính nó và kích hoạt lớp phủ màu nền `bg-primary/5 border-primary` của toàn bộ panel trái khi card đang được kéo hover qua.

### 3.3. Thuật toán Phát hiện Va chạm Tùy chỉnh (`customCollisionDetection`)
Để giải quyết triệt để vấn đề dnd-kit đo sai/lệch tọa độ của vùng panel trái trên viewport (do scroll container hoặc dialog transform), hệ thống sử dụng thuật toán va chạm tùy chỉnh dựa trên tọa độ thực tế của DOM:

1.  **Truy vấn DOM Trực tiếp**: Sử dụng `document.getElementById` lấy ra phần tử panel trái (`unassigned-samples-container`) và gọi `getBoundingClientRect()` để lấy tọa độ viewport chuẩn xác tuyệt đối tại thời điểm kéo thả.
2.  **So khớp Tọa độ Con trỏ (Pointer In-bounds)**:
    *   Nếu có tọa độ chuột (`args.pointerCoordinates`), kiểm tra xem con trỏ chuột có nằm trong vùng bao của panel trái hay không (cộng thêm biên đệm `30px padding buffer` để dễ thả). Nếu có, ưu tiên nhận diện là thả về `"unassigned"`.
3.  **So khớp Diện tích Chồng Lấn (Rect Overlap Area)**:
    *   Nếu con trỏ chuột không xác định được, kiểm tra diện tích giao nhau giữa hình chữ nhật của card đang kéo (`collisionRect`) và panel trái.
    *   Nếu **diện tích giao nhau chiếm từ 35% diện tích card trở lên**, lập tức kích hoạt nhận diện là thả về `"unassigned"`.
4.  **Fallback**: Nếu card không nằm đè/gần panel trái, chạy thuật toán va chạm mặc định `pointerWithin` -> `rectIntersection` -> `closestCenter` để tìm ô tủ gần nhất bên phải.

---

## 4. Tương tác API & Đồng bộ Hóa Dữ liệu

Khi thả thẻ card vào một vùng thành công, ứng dụng thực hiện quy trình cập nhật tối ưu (Optimistic UI Update):

### 4.1. Kéo sang Kệ Tủ (Thả vào tủ `targetLocName`)
*   **Giao diện cập nhật ngay**: Xóa card khỏi danh sách bên trái (`pendingItems`), thêm card vào danh sách bên phải (`retainedItems`) với thông tin vị trí mới.
*   **API Gọi đồng thời**: Gọi mutation cập nhật của `/v2/samples/update/bulk` truyền payload:
    ```json
    {
      "sampleIds": ["MÃ_MẪU"],
      "updateData": {
        "sampleStorageLoc": "TÊN_TỦ",
        "sampleStatus": "Retained"
      }
    }
    ```
*   **Revert/Rollback**: Nếu API gọi thất bại, hệ thống tự động hoàn tác (rollback) trạng thái cục bộ nhờ cơ chế invalidation của React Query.

### 4.2. Kéo về Panel Trái (Thả vào vùng "Chưa xếp vị trí" - target `unassigned`)
*   **Giao diện cập nhật ngay**: Xóa card khỏi tủ bên phải, thêm card vào đầu danh sách `pendingItems`.
*   **API Gọi đồng thời**: Gọi mutation cập nhật của `/v2/samples/update/bulk` truyền payload:
    ```json
    {
      "sampleIds": ["MÃ_MẪU"],
      "updateData": {
        "sampleStorageLoc": null,
        "sampleStatus": "Distributed"
      }
    }
    ```
