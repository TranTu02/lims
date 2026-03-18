    # LUỒNG HOẠT ĐỘNG MODULE LAB (QUẢN LÝ PHÒNG THÍ NGHIỆM)

    Tài liệu này mô tả chi tiết các luồng nghiệp vụ trong Module Lab, bao gồm Quản lý Nhận mẫu (Receipt), Mẫu (Sample) và Phân tích (Analysis), tập trung vào cách xử lý dữ liệu, phân quyền và bảo mật.

    ---

    ## 1. Quản lý Nhận mẫu (`Receipt Management`)

    **File nguồn**: `BLACK/LAB/2_Receipt.js`
    **Kế thừa từ**: `LabEntity` (`BLACK/LAB/1_labEntities.js`)

    ### A. Bảng điều khiển Xử lý (`getProcessingReceptionsDetail`)

    **Mục tiêu**: Lấy danh sách phiếu nhận mẫu (Receipts) và toàn bộ thông tin mẫu/chỉ tiêu liên quan để hiển thị trên bảng điều khiển (Dashboard) cho nhân viên xử lý.

    1.  **Xác thực người dùng (`Authenticate`)**:
        - Gọi `Entity.getEntity(token)` để lấy thông tin phiên làm việc.

    2.  **Kiểm tra quyền (`Permission Check`)**:
        - Gọi `checkPermit("lab.receipts", "READ")`.
        - **Quyền Số Thập Phân (0.5 - LIMIT)**: Cho phép truy vấn (Query), việc lọc dữ liệu sẽ thực hiện ở bước sau.
        - **Quyền Số Nguyên (1 - FULL)**: Cho phép truy vấn toàn bộ dữ liệu.

    3.  **Truy vấn Phiên nhận mẫu (`Query Receipts`)**:
        - `SELECT * FROM lab.receipts WHERE "receiptStatus" IN ('Pending', 'Processing', ...)`
        - Hỗ trợ phân trang (`LIMIT`, `OFFSET`).

    4.  **Lấy thông tin Mẫu liên quan (`Fetch Related Samples`)**:
        - Từ danh sách `receiptId` lấy được -> Truy vấn danh sách `sampleId`.
        - **Vòng lặp (Parallel)**: Gọi `Sample.getFullById` cho từng mẫu để lấy thông tin chi tiết (bao gồm cả chỉ tiêu phân tích).

    5.  **Gộp dữ liệu (`Map Data`)**:
        - Kết hợp thông tin Phiếu nhận + Danh sách Mẫu đầy đủ (lồng nhau).

    6.  **Lọc dữ liệu đầu ra (`Output Filtering`)**:
        - Gọi `entity.filterDataResponse` để loại bỏ các trường không được phép xem.
        - **Xử lý Quyền Decimal (0.5)**: Nếu user chỉ có quyền xem hạn chế (LIMIT), hệ thống sẽ ẩn (mask to null) thông tin của các phiếu/mẫu **không thuộc về** user đó (không phải người tạo, người phụ trách, kỹ thuật viên...).
        - **Xử lý Quyền Integer (1)**: Giữ nguyên toàn bộ dữ liệu.

    ---

    ### B. Xem chi tiết đầy đủ (`getFullById`)

    **Mục tiêu**: Lấy thông tin chi tiết của một Phiếu nhận mẫu cụ thể, bao gồm tất cả các cấp con (Mẫu, Chỉ tiêu, Báo cáo).

    1.  **Xác thực & Kiểm tra quyền**: Tương tự như trên.

    2.  **Truy vấn Phiếu nhận mẫu (`Query Receipt`)**:
        - `SELECT * FROM lab.receipts WHERE "receiptId" = $1`.

    3.  **Lấy dữ liệu cấp con (`Fetch Children`)**:
        - Truy vấn bảng `lab.samples` để lấy danh sách ID mẫu thuộc phiếu này.
        - Gọi `Sample.getFullById` cho từng ID mẫu.

    4.  **Áp dụng bộ lọc (`Apply Filtering`)**:
        - Gọi `Receipt.filterData({ instance, entity })`.
        - Hàm này ủy quyền cho `entity.filterDataResponse` để thực hiện lọc đệ quy từ cấp cha xuống cấp con.
        - Đảm bảo tính nhất quán về quyền hạn (Ví dụ: Nếu user bị chặn xem `lab.analyses`, thông tin chỉ tiêu trong mẫu cũng sẽ bị ẩn).

    ---

    ## 2. Quản lý Mẫu (`Sample Management`)

    **File nguồn**: `BLACK/LAB/2_Sample.js`

    ### A. Danh sách Mẫu cần xử lý (`getProcessingSamples`)

    1.  **Xác thực & Kiểm tra quyền (`lab.samples`)**:
        - Quyền `0.5` (LIMIT): Cho phép query (lọc sau).
        - Quyền `1` (FULL): Hiển thị toàn bộ.

    2.  **Truy vấn Mẫu (`Query Samples`)**:
        - `SELECT * FROM lab.samples ...` (Phân trang, lọc theo trạng thái).

    3.  **Chi tiết hóa (`Hydrate Details`)**:
        - Với mỗi mẫu, gọi `Sample.getFullById` để lấy thông tin chỉ tiêu phân tích (`Analysis`) đi kèm.

    4.  **Lọc dữ liệu (`Filter`)**:
        - Gọi `entity.filterDataResponse`.
        - **Kiểm tra Sở hữu (`Ownership Check`)**: Với mỗi mẫu, hệ thống kiểm tra các trường sở hữu như `technicianId` (KTV chính) hoặc `technicianIds` (Danh sách KTV phụ).
        - **Masking**: Nếu user không phải là KTV của mẫu đó VÀ quyền là `0.5`, dữ liệu sẽ bị ẩn (`null`).

    ---

    ### B. Xem chi tiết Mẫu đầy đủ (`getFullById`)

    1.  **Truy vấn Mẫu**: `SELECT * FROM lab.samples WHERE "sampleId" = $1`.

    2.  **Lấy danh sách Chỉ tiêu (`Fetch Analyses`)**:
        - Truy vấn bảng `lab.analyses` để lấy danh sách ID chỉ tiêu thuộc mẫu này.
        - Gọi `Analysis.getFullById` cho từng chỉ tiêu.

    3.  **Lấy báo cáo (`Fetch Reports`)**:
        - Gọi `Report.getList({ sampleId })` để lấy các báo cáo kết quả liên quan.

    4.  **Kết hợp (`Combine`)**:
        - Tạo object Mẫu chứa: Thông tin mẫu + Danh sách Chỉ tiêu (Full) + Danh sách Báo cáo.

    5.  **Lọc dữ liệu (`Apply Filtering`)**:
        - Gọi `Sample.filterData({ instance, entity })`.
        - Lọc thông tin mẫu dựa trên quyền sở hữu.
        - Đệ quy lọc tiếp các object con (Analysis, Report).

    ---

    ## 3. Quản lý Chỉ tiêu Phân tích (`Analysis Management`)

    **File nguồn**: `BLACK/LAB/2_Analysis.js`

    ### A. Danh sách Kiểm nghiệm (`getProcessingTests`)

    1.  **Xác thực & Kiểm tra quyền (`lab.analyses`)**.

    2.  **Truy vấn Chỉ tiêu**: `SELECT * FROM lab.analyses ...`.

    3.  **Chi tiết hóa (`Hydrate`)**: Gọi `Analysis.getFullById` cho từng chỉ tiêu.

    4.  **Lọc dữ liệu (`Filter`)**:
        - **Kiểm tra Kỹ thuật viên**: So khớp `technicianId` hoặc mảng `technicianIds` với ID của user hiện tại.
        - **Masking**: Ẩn thông tin các chỉ tiêu mà user không được phân công thực hiện (nếu quyền là LIMIT).

    ---

    ### B. Chi tiết Chỉ tiêu đầy đủ (`getFullById`)

    1.  **Truy vấn Chỉ tiêu**: `SELECT * FROM lab.analyses ...`.

    2.  **Lấy thông tin Kỹ thuật viên (`Fetch Technician`)**:
        - Từ `technicianId` -> Truy vấn bảng `identity.identities` để lấy tên, email KTV.
        - Từ `technicianIds` (Array) -> Truy vấn danh sách KTV phụ.

    3.  **Kết hợp**: Object Chỉ tiêu + Thông tin KTV.

    4.  **Lọc dữ liệu (`Apply Filtering`)**:
        - Gọi `Analysis.filterData({ instance, entity })`.
        - Lọc thông tin chỉ tiêu dựa trên quyền sở hữu.
        - **Quan trọng**: Tự động lọc các thông tin riêng tư của KTV (số điện thoại, email cá nhân) nếu user hiện tại không có quyền xem bảng `identity.identities`.

    ---

    ### C. Tạo Lab Report Document (`generateLabReport`)
    
    1.  **Xác thực & Kiểm tra quyền**: Kiểm tra quyền `WRITE` đối với `lab.analyses`.
    2.  **Tạo PDF**: Gọi script Playwright để dựng template PDF từ nội dung `html` truyền vào.
    3.  **Tải lên Storage**: Lưu file vào bộ nhớ MinIO/AWS thông qua `File.upload` (lưu kèm `commonKeys` là danh sách các `analysisId` để tiện truy xuất).
    4.  **Khởi tạo Document**: Tạo đối tượng Document (`document.documents`) link tới `fileId` tương ứng. Gắn metadata `refType = 'LabReport'` và `jsonContent = { analysisIds }`.
    5.  **Cập nhật dữ liệu hàng loạt (`Bulk Update`)**: 
        - Sử dụng Transaction để update đồng thời giá trị `analysisDocumentId` của tất cả các `analysisId` được chỉ định trỏ tới ID Document mới tạo.

    ---

    ## 4. Quy trình Tạo mới, Cập nhật & Xóa (`Create, Update & Delete Operations`)


    ### A. Quy trình Tạo mới (`Create Flow`)

    **File nguồn**: `BLACK/LAB/1_labEntities.js`
    **Phương thức**: `LabEntity.create({ data })`

    1.  **Kiểm tra Quyền (`Permission Check`)**: `checkPermit(sourceTable, "WRITE")`.
        - Nếu user có quyền thao tác (`WRITE` permit >= 2), cho phép tiếp tục.

    2.  **Khởi tạo `id` và metadata**:
        - Tự động sinh `id` hoặc PKey tương ứng (vd: `requestId`, `receiptId`) qua `generateBaseId()`.
        - Reset các trường metadata hệ thống: `createdAt = NOW()`, `createdById = userId`, `modifiedAt = NOW()`, `modifiedById = userId`, `deletedAt = null`.

    3.  **Thực thi Tạo mới (`Execute Insert`)**:
        - Ghi vào Database thông qua `Valkey.syncInfo`.
        - Cập nhật Cache.

    4.  **Trả về**: Một instance thực thể mới được tạo rỗng (`Object.create()`) kết hợp với data.

    ---

    ### B. Quy trình Cập nhật (`Update Flow`)

    **File nguồn**: `BLACK/LAB/1_labEntities.js`
    **Phương thức**: `LabEntity.prototype.update({ data })`

    1.  **Kiểm tra Quyền (`Permission Check`)**: `checkPermit(sourceTable, "WRITE")`.
        - Nếu quyền là **2.5** (WRITE LIMIT): Tiếp tục kiểm tra sở hữu.
        - Nếu quyền là **3** (WRITE FULL): Cho phép thực hiện ngay.

    2.  **Xác thực Sở hữu (`Ownership Validation`)**:
        - Gọi `validateOwnershipOrThrow({ data: this, sourceTable, action: "WRITE" })`.
        - **Nếu quyền là số thập phân (2.5)**:
            - Kiểm tra xem user có phải là owner của bản ghi này không (dựa trên `technicianId`, `createdById`...).
            - **Không phải owner**: Ném lỗi `403 Forbidden` ("Restricted: you can only write your own data").
        - **Nếu quyền là số nguyên (3)**: Bỏ qua bước này.

    3.  **Thực thi Cập nhật (`Execute Update`)**:
        - Cập nhật vào Database thông qua `Valkey.syncInfo` (để đồng bộ cache).
        - Cập nhật thời gian sửa đổi (`modifiedAt`) và người sửa (`modifiedById`).

    4.  **Trả về**: Instance đã cập nhật.

    ---

    ### C. Quy trình Xóa (`Delete Flow`)

    **File nguồn**: `BLACK/LAB/1_labEntities.js`
    **Phương thức**: `LabEntity.prototype.delete()`

    1.  **Kiểm tra Quyền (`Permission Check`)**: `checkPermit(sourceTable, "DELETE")`.
        - Nếu quyền là **6.5** (DELETE LIMIT): Tiếp tục.
        - Nếu quyền là **7** (DELETE FULL): Tiếp tục.

    2.  **Xác thực Sở hữu (`Ownership Validation`)**:
        - Gọi `validateOwnershipOrThrow({ data: this, sourceTable, action: "DELETE" })`.
        - **Nếu quyền là số thập phân (6.5)**:
            - Kiểm tra ownership.
            - **Không phải owner**: Ném lỗi `403 Forbidden`.
        - **Nếu quyền là số nguyên (7)**: Bỏ qua.

    3.  **Thực thi Xóa mềm (`Execute Soft Delete`)**:
        - Không xóa vĩnh viễn khỏi DB.
        - Set `deletedAt = NOW()` và `deletedById = userId`.
        - Cập nhật Cache.

    4.  **Trả về**: `true`.

    ---

    ## 5. Lọc Dữ liệu Tập trung (`Centralized Data Filtering`)

    **File nguồn**: `BLACK/LAB/1_labEntities.js`
    **Phương thức**: `LabEntity.filterData({ instance, entity })`

    ### Mục đích

    - Đóng vai trò là điểm tập trung duy nhất để lọc dữ liệu đầu ra cho toàn bộ module Lab.
    - Được gọi tự động trong `getById` ngay sau khi lấy dữ liệu từ DB và trước khi trả về.

    ### Logic

    ```javascript
    static filterData({ instance, entity }) {
        if (!instance || !entity) return instance;
        // Ủy quyền cho hàm lọc cốt lõi của Entity
        return entity.filterDataResponse(instance);
    }
    ```

    ### Hỗ trợ Lọc Nâng cao (`Advanced Filtering Support`) - Trong `getList`

    Tất cả các thực thể Lab (Receipts, Samples, Analyses) đều hỗ trợ cú pháp lọc nâng cao thông qua tham số `otherFilters`:

    - **IS NULL / IS NOT NULL**:
        - Truyền chuỗi `"IS NULL"` hoặc `"IS NOT NULL"` vào giá trị lọc.
        - Ví dụ: `{ column: "completedAt", value: "IS NOT NULL" }` (Lấy các mẫu đã hoàn thành).

    - **BETWEEN**:
        - Truyền chuỗi `"BETWEEN '2023-01-01' AND '2023-01-31'"` (không phân biệt hoa thường).
        - Hệ thống tự động phân tích cú pháp và sử dụng tham số hóa (`$1`, `$2`) để ngăn chặn SQL Injection.

    - **Bảo mật**: Chỉ cho phép lọc trên các cột đã được định nghĩa trong `filterConfig.allowedColumns`.

    ### Hỗ trợ Truy vấn Tùy chọn Lọc Động (`Dynamic Filter Options - getFilterOptions`)

    Để UI hiển thị các Dropdown (chọn lọc) một cách thông minh, hệ thống cung cấp logic tập trung thông qua `getFilterOptions`:

    - **Mục tiêu**: Lấy danh sách các giá trị phân biệt (distinct / group by) của một cột cụ thể (như `analysisStatus`), kèm theo số lượng (Count) của mỗi giá trị, dựa trên phạm vi tập dữ liệu đã bị giới hạn bởi `otherFilters`.
    - **Endpoint API**: `POST /v2/[module]/get/options`
    - **Logic chạy**:
        1. Bóc tách `filterFrom` (cột muốn nhóm, vd `analysisStatus`).
        2. Validate xem cột đó có nằm trong `allowedColumns` không.
        3. Ghép các điều kiện lọc tĩnh từ `otherFilters` vào mệnh đề `WHERE` an toàn.
        4. (Tùy chọn) Chèn thêm `%textFilter%` qua cú pháp `ILIKE` nếu User gõ phím tìm kiếm ngay trong Dropdown.
        5. Lệnh thực thi: `SELECT "filterFrom" AS "filterValue", COUNT(*) FROM... GROUP BY...`.
    - **Kết quả trả về**: UI có thể bind thẳng API này vào component Filter dạng List/Dropdown để đếm ngược số Item trước khi User chọn (vd: `Ready (15)`, `Pending (3)`).

    ---

    ## 6. Sơ đồ Luồng: CRUD Mẫu với Quyền Số Thập Phân

    ---

    [Sơ đồ liên kết thực thể Lab mới]

    IncomingRequest (crm.incomingRequests) --(1:1)--> Receipt (lab.receipts)
    |
    --(1:N)--> Sample (lab.samples)
    |
    --(1:N)--> Analysis (lab.analyses)
    |
    --(1:N)--> Report (document.reports)

    ---

    ### A. LUỒNG ĐỌC (READ Flow)

    `GET /api/samples/list`

    1.  **checkPermit("lab.samples", "READ")**
        - Quyền = 0.5 → CHO PHÉP (ALLOW - sẽ lọc sau)
    2.  **Truy vấn DB**: `SELECT * FROM lab.samples`
    3.  **Kết quả**: [SP001 (technicianId=USR001), SP002 (technicianId=USR002)]
    4.  **Duyệt từng mẫu**: `getById` → `filterData` → `filterDataResponse`
        - SP001: checkOwnership → ĐÚNG → Giữ nguyên
        - SP002: checkOwnership → SAI → Mask to null
    5.  **Trả về**:

    ```json
    [
        { "sampleId": "SP001", "status": "pending", "...": "..." },
        { "sampleId": null, "status": null, "...": null }
    ]
    ```

    ### B. LUỒNG CẬP NHẬT (UPDATE Flow)

    `PATCH /api/samples/SP002` (Mẫu thuộc về USR002)

    1.  **checkPermit("lab.samples", "WRITE")**
        - Quyền = 2.5 (WRITE LIMIT)
    2.  **validateOwnershipOrThrow(SP002)**
        - technicianId=USR002 KHÁC USR001 → TỪ CHỐI
    3.  **Kết quả**: Trả về lỗi `403 Forbidden`

    ### C. LUỒNG XÓA (DELETE Flow)

    `DELETE /api/samples/SP001` (Mẫu thuộc về USR001)

    1.  **checkPermit("lab.samples", "DELETE")**
        - Quyền = 6.5 (DELETE LIMIT) → CHO PHÉP
    2.  **validateOwnershipOrThrow(SP001)**
        - technicianId=USR001 TRÙNG USR001 → CHO PHÉP
    3.  **Thực thi Xóa mềm**: `SET deletedAt = NOW()`
    4.  **Kết quả**: Trả về `true`

    ---

    ## 7. Quản lý Yêu cầu Tiếp nhận (`Incoming Request Management`)

    **File nguồn**: `BLACK/LAB/2_OrderIncoming.js`
    **Endpoint**: `/v2/incoming-orders/`
    **Bảng DB**: `crm.incomingRequests`

    ### Luồng xử lý chính

    1.  **Tiếp nhận (`Create`)**:
        - Lưu trữ thông tin từ khách hàng (Portal, Email) vào bảng `crm.incomingRequests`.
        - Gán `requestId` (Custom Text ID, VD: `REQ-2601-001`).
        - Các mẫu được lưu trong cột `samples` (JSONB array).

    2.  **Kiểm soát và Mapping (`Enrich & Sync`)**:
        - Khi truy vấn `getById`, hệ thống có thể đồng bộ thông tin từ CRM nếu có `orderId` liên kết.
        - Hỗ trợ làm giàu dữ liệu chỉ tiêu (`Parameter enrichment`) cho danh sách mẫu đính kèm.

    3.  **Chuyển đổi thành Phiếu nhận mẫu (`Convert to Receipt`)**:
        - Sau khi được duyệt, thông tin từ `IncomingRequest` sẽ được dùng để tạo `Receipt` trong module Lab.
        - Cột `receiptId` trong `IncomingRequest` sẽ được cập nhật để liên kết ngược lại.

    ---

    ## 8. Quản lý Báo cáo Kết quả (`Report Management`)

    **File nguồn**: `BLACK/LAB/2_Report.js` và `BLACK/LAB/2_Receipt.js`

    ### A. Tạo và Export Báo cáo PDF (`Export Report Flow`)

    Phương thức xử lý nằm trên đối tượng **Receipt**: `Receipt.exportReport()`

    1. **Tiếp nhận cấu trúc HTML**:
       Hệ thống nhận `headerHtml` và `contentHtml` tùy biến nguyên bản (không tác động/sửa đổi Font, màu chữ) từ trình soạn thảo trên UI.
    2. **Render PDF qua Playwright**:
       - Khởi tạo khung mẫu table `report-table-container` nhằm giữ nguyên layout: `<head>` với biến headerHtml và `<tbody>` với contentHtml. 
       - PDF sẽ tự kéo Header nhắc lại (repeat) trên mỗi trang.
       - Tự động sinh `documentId` (`DOC-...`) và `reportId` (`RPT-...`), set vào Margin lề trái của Footer template qua JS Evaluate.
    3. **Upload Storage & Cấp ID (`Upload && Map Document`)**:
       - Đẩy kết quả pdfBuffer lên DB (`File.upload`).
       - Generate 1 Record vào `document.documents` nhằm truy vết lưu trữ. Gắn `refType = 'AnalysisReport'`.
    4. **Generate Report Record**:
       - INSERT vào `lab.reports` với trạng thái Initial. Kể từ đây, UI Quản lý Báo Cáo có thể render record này ở dạng Danh sách.

    ### B. Xem Chi Tiết Báo Cáo (`Get Full Report`)

    Thông qua REST API `GET /v2/reports/get/full?reportId={id}`, hệ thống làm thao tác:
    - Tìm chi tiết thông tin Report.
    - JOIN ngược vào CSDL bảng `document.documents` (thông qua `jsonContent->>'reportId' = reportId`).
    - MAP file url cho UI từ `document.files` để Front-End có url xem trước/tải về ngay trên giao diện list/detail.
