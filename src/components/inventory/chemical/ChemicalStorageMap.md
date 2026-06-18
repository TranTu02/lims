# Tài liệu Đặc tả Logic UI/UX Kéo thả Quản lý Chai/Lọ Hóa chất (Chemical Storage)

Tài liệu này mô tả chi tiết logic giao diện, kéo thả, và đồng bộ dữ liệu của component `ChemicalStorageMap.tsx`.

---

## 1. Mục đích & Bố cục Giao diện

Bản đồ Kệ chứa Hóa chất cung cấp giao diện trực quan dạng chia đôi (Split View) cho phép nhân viên phòng thí nghiệm phân bổ và sắp xếp vị trí bảo quản của các chai/lọ hóa chất vào các kệ tủ một cách dễ dàng bằng thao tác kéo thả hoặc chọn hàng loạt.

```
+----------------------------------------------------------------------------------------+
|                                       TOOLBAR                                          |
|  [Search Input] [Chemical Type Filter]                                                 |
+----------------------------------------------------------------------------------------+
|                                  DND WORKSPACE                                         |
|  +-------------------------------------+  +-----------------------------------------+  |
|  | LEFT: UNASSIGNED CHEMICALS          |  | RIGHT: STORAGE SHELVES/BINS             |  |
|  | - Header & total unassigned count   |  | - Dynamic Shelves Grid                  |  |
|  | - Bulk Selection controls           |  | - Item count badge per Shelf            |  |
|  | - Card list (Chemical ID + Name)    |  | - Shelf Card (Droppable Zone)           |  |
|  | - Compact Pagination (50/page)      |  | - Click Header -> 90% View Modal        |  |
|  +-------------------------------------+  +-----------------------------------------+  |
+----------------------------------------------------------------------------------------+
```

---

## 2. Chi tiết Logic Hoạt động UI/UX

### 2.1. Panel bên trái: Chai lọ chưa xếp vị trí (Unassigned Chemicals)
*   **Dữ liệu đầu vào**: Lấy danh sách hóa chất có `storageBinLocation` bằng `null` thông qua API của `useChemicalInventoriesList` với tham số phân trang.
*   **Thanh Tìm kiếm**: Nhập tên hóa chất, SKU hoặc mã hóa chất. Tìm kiếm được debounce 300ms.
*   **Dropdown Bộ lọc Loại Hóa Chất (Chemical Type)**:
    *   Lấy dữ liệu từ danh sách loại hóa chất (`chemicalType`).
    *   Dropdown được cấu hình phân trang giới hạn **20 items/trang** để tối ưu hiệu năng render.
*   **Phân trang**:
    *   Mặc định hiển thị **50 hóa chất/trang**.
    *   Nút phân trang được thu gọn ở chân panel trái để tiết kiệm diện tích.
*   **Chọn hàng loạt (Bulk Move)**:
    *   Nhấp chọn checkbox hoặc nhấp trực tiếp vào vùng text của card hóa chất đều kích hoạt chọn/bỏ chọn.
    *   Khi có hóa chất được chọn, bảng điều khiển trượt xuống hiển thị số lượng hóa chất đã chọn, nút "Chọn tất cả"/"Bỏ chọn tất cả" và Dropdown danh sách các vị trí kệ. 
    *   Chọn kệ và ấn nút "Chuyển" sẽ gọi API bulk update để di chuyển toàn bộ các chai lọ được tích chọn sang kệ đó.

### 2.2. Panel bên phải: Kệ tủ / Vị trí Lưu trữ (Storage Shelves)
*   **Nguồn dữ liệu**: Danh sách kệ tủ được lấy động từ API enum `/v2/enum/get/list?enumType=storageBinLocation`.
    *   *Fallback*: Nếu API chưa trả về hoặc trống, hệ thống sử dụng danh sách kệ mặc định (`Kệ A`, `Kệ B`, `Kệ C`).
    *   *Phân loại tủ*: Tên kệ chứa từ "lạnh" sẽ có kiểu tủ mát (`cold`), chứa từ "đông" sẽ có kiểu tủ đông (`frozen`), các từ còn lại xếp vào kệ khô (`dry`).
*   **Modal Chi tiết Kệ (Shelf Detail Modal)**:
    *   Khi nhấp vào tiêu đề của một kệ tủ, Modal chi tiết sẽ mở ra với kích thước chiếm **90% width/height màn hình**.
    *   Modal hiển thị danh sách các chai lọ đang lưu trữ trên kệ đó dưới dạng bảng (Table) chi tiết kèm phân trang đầy đủ.

---

## 3. Cơ chế Kéo Thả (Drag and Drop)

Component sử dụng thư viện `@dnd-kit/core` để hiện thực kéo thả:

### 3.1. Thiết kế Card Draggable & Drag Overlay
*   Mỗi thẻ hóa chất hiển thị dạng `DraggableChemicalCard`. Trình lắng nghe kéo thả được gán độc lập vào **Drag Handle icon** (biểu tượng 6 dấu chấm) để không gây xung đột với sự kiện click chọn card.
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

1.  **Truy vấn DOM Trực tiếp**: Sử dụng `document.getElementById` lấy ra phần tử panel trái (`unassigned-chemicals-container`) và gọi `getBoundingClientRect()` để lấy tọa độ viewport chuẩn xác tuyệt đối tại thời điểm kéo thả.
2.  **So khớp Tọa độ Con trỏ (Pointer In-bounds)**:
    *   Nếu có tọa độ chuột (`args.pointerCoordinates`), kiểm tra xem con trỏ chuột có nằm trong vùng bao của panel trái hay không (cộng thêm biên đệm `30px padding buffer` để dễ thả). Nếu có, ưu tiên nhận diện là thả về `"unassigned"`.
3.  **So khớp Diện tích Chồng Lấn (Rect Overlap Area)**:
    *   Nếu con trỏ chuột không xác định được, kiểm tra diện tích giao nhau giữa hình chữ nhật của card đang kéo (`collisionRect`) và panel trái.
    *   Nếu **diện tích giao nhau chiếm từ 35% diện tích card trở lên**, lập tức kích hoạt nhận diện là thả về `"unassigned"`.
4.  **Fallback**: Nếu card không nằm đè/gần panel trái, chạy thuật toán va chạm mặc định `pointerWithin` -> `rectIntersection` -> `closestCenter` để tìm ô tủ gần nhất bên phải.

---

## 4. Tương tác API & Đồng bộ Hóa Dữ liệu

Khi thả thẻ card vào một vùng thành công, ứng dụng thực hiện quy trình cập nhật tối ưu (Optimistic UI Update):

### 4.1. Kéo sang Kệ Tủ (Thả vào kệ `targetLocName`)
*   **Giao diện cập nhật ngay**: Xóa card khỏi danh sách bên trái (`pendingItems`), thêm card vào danh sách bên phải (`assignedItems`) với thông tin vị trí mới.
*   **API Gọi đồng thời**: Gọi mutation cập nhật của `/v2/chemicalinventories/update/bulk` truyền payload:
    ```json
    [
      {
        "chemicalInventoryId": "MÃ_CHAI_LỌ",
        "storageBinLocation": "TÊN_KỆ"
      }
    ]
    ```
*   **Revert/Rollback**: Nếu API gọi thất bại, hệ thống tự động hoàn tác (rollback) trạng thái cục bộ nhờ cơ chế invalidation của React Query.

### 4.2. Kéo về Panel Trái (Thả vào vùng "Chưa xếp vị trí" - target `unassigned`)
*   **Giao diện cập nhật ngay**: Xóa card khỏi tủ bên phải, thêm card vào đầu danh sách `pendingItems`.
*   **API Gọi đồng thời**: Gọi mutation cập nhật của `/v2/chemicalinventories/update/bulk` truyền payload:
    ```json
    [
      {
        "chemicalInventoryId": "MÃ_CHAI_LỌ",
        "storageBinLocation": null
      }
    ]
    ```
