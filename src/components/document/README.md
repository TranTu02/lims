# Document Module (Trung tâm Tài liệu)

## 1. Giới thiệu chức năng

Module `DocumentCenter` là nơi quản lý toàn bộ các tập tin (Files) và tài liệu nghiệp vụ (Documents) của hệ thống LIMS. Nó cho phép người dùng upload tài liệu, gán các trường siêu dữ liệu (metadata như Trạng thái, Phân loại, Từ khóa, Mã), cũng như tìm kiếm, xem chi tiết và đặc biệt là xem trước (preview) file trực tiếp trên trình duyệt mà không nhất thiết phải tải về.

## 2. Kiến trúc và Các Component chính

| Component                  | Mô tả                                                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DocumentCenter.tsx`       | Màn hình chính hiển thị danh sách tài liệu và file dưới dạng bảng. Hai chế độ xem: **Tài liệu** (Documents) và **Files**. Tích hợp bộ lọc phân loại (tabs), tìm kiếm (Search), phân trang (Pagination), và preview inline. |
| `DocumentUploadModal.tsx`  | Modal tạo tài liệu mới. Hỗ trợ 2 tab: upload file mới hoặc liên kết file ID đã có. Toàn bộ labels/placeholders sử dụng i18n keys `documentCenter.uploadModal.*`.                                                           |
| `DocumentPreviewModal.tsx` | Modal xem trước file (PDF, ảnh, Office). z-index 200, chiều cao 95vh, backdrop-blur-md che phủ toàn bộ UI bao gồm header. Click vùng ngoài để đóng.                                                                        |
| `DocumentDetailPanel.tsx`  | Panel bên phải hiển thị thông tin chi tiết tài liệu/file khi được chọn.                                                                                                                                                    |

## 3. Các API Service và Logic kết nối

Việc thiết kế cấu trúc API ở Frontend được chia làm hai mảng rõ rệt phản ánh kiến trúc của Backend:

- **`src/api/documents.ts`**: Cung cấp các phương thức thao tác API với thực thể **Document**. Định nghĩa kiểu dữ liệu `DocumentInfo`. Lưu trữ các metadata (Thông tin cấu trúc doanh nghiệp/nghiệp vụ). Endpoint đặc trưng: `/v2/documents/create`, `/v2/documents/get/list`.
- **`src/api/files.ts`**: Quản lý API tương tác với **File** vật lý (với dạng file tĩnh). Endpoint đặc trưng: `/v2/files/upload`. File này chứa helper function `buildFileUploadFormData()` tạo cấu trúc `FormData` bao gồm file blob stream và array các metadata để đẩy lên server.
    > Dữ liệu response trong các API module này đều đi qua một custom helper function là `assertSuccess()` để trích xuất `data` / `meta` ngay lập tức và đồng bộ cơ chế xử lý lỗi ném ra.

## 4. Cơ chế Xem trước (Preview) File

### 4.1 DocumentPreviewModal

- **z-index**: `200` — đảm bảo che phủ toàn bộ UI kể cả header navigation
- **Chiều cao**: `95vh`, max-width `6xl`
- **Backdrop**: `bg-black/70 backdrop-blur-md` — blur toàn bộ nền
- **Đóng modal**: Click vùng ngoài hoặc nút X

### 4.2 Luồng sinh URL tải tệp

1. Người dùng bấm yêu cầu xem (Preview) ở Frontend.
2. Ứng dụng gọi REST Hook (`/v2/documents/get/url` hoặc `/v2/files/get/url`).
3. Dịch vụ lưu trữ Storage (S3/MinIO) tạo ra Presigned URL có giới hạn thời gian.
4. URL được trả về cho Frontend.

### 4.3 Chi tiết cơ chế Render WebView

- **PDF & Ảnh**: Render qua `<iframe>` hoặc `<img>` trực tiếp.
- **Microsoft Office**: Sử dụng `https://view.officeapps.live.com/op/embed.aspx?src=...`
- **Fallback**: `window.open(url, "_blank")` nếu không render được.

## 5. i18n (Đa ngôn ngữ)

Toàn bộ text hiển thị trong module sử dụng hệ thống i18n với namespace `documentCenter.*`:

| Key Prefix                     | Mô tả                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `documentCenter.title`         | Tiêu đề trang                                                                       |
| `documentCenter.tabs.*`        | Labels các tab phân loại                                                            |
| `documentCenter.col.*`         | Labels cột bảng (title, status, ref, date, actions, fileName, type, size)           |
| `documentCenter.viewMode.*`    | Labels chế độ xem (documents, files)                                                |
| `documentCenter.preview.*`     | Labels modal xem trước (title, openNew, preview, download)                          |
| `documentCenter.uploadModal.*` | Labels modal tải lên (title, desc, documentTitle, dropzone, uploading, saving, ...) |
| `documentCenter.validation.*`  | Thông báo lỗi validation (missingFile, missingTitle)                                |
| `documentCenter.createSuccess` | Toast thành công tạo tài liệu                                                       |
| `documentCenter.fileUploaded`  | Toast thành công tải file                                                           |

## 6. File Type Badge (Tab Files)

Cột **Loại** ở tab Files hiển thị badge rút gọn:

1. **Ưu tiên**: Lấy extension từ `fileName` (ví dụ: `DOC.docx` → `DOCX`)
2. **Fallback**: Lấy suffix từ `mimeType`, truncate tối đa 8 ký tự + "…"

Điều này tránh trường hợp MIME type dài như `VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT` chiếm hết không gian bảng.

## 7. Quy chuẩn Icon (Iconography Standard)

- **Xem/Preview tài liệu (Read-only):** Sử dụng `FileText` (Thay thế cho `Eye` cũ để đồng bộ với định dạng văn bản).
- **Soạn thảo/Khởi tạo biên bản:** Sử dụng `FilePenLine` (Sử dụng biểu tượng trang giấy kèm bút để ám chỉ hành động nhập liệu/sửa đổi).

## 8. Thư viện sử dụng

- **@tanstack/react-query (v5)**: Fetching, mutation, cache invalidation
- **Lucide-React**: Icon SVG (Search, Upload, FileText, FilePenLine, Download, ...)
- **Sonner**: Toast notifications
- **shadcn/ui**: Tables, Badges, Tabs, Select, Input, Button, Modal
