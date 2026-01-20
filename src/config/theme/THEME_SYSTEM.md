# HỆ THỐNG GIAO DIỆN & THEME (THEME SYSTEM)

**Phiên bản:** 2.0.0
**Ngày cập nhật:** 20/01/2026
**Công nghệ:** Tailwind CSS v4, CSS Variables, Shadcn UI

---

## I. TỔNG QUAN

Hệ thống sử dụng cơ chế **Semantic Tokens** (Token ngữ nghĩa) thông qua CSS Variables. Giao diện hỗ trợ 3 chế độ (Modes):

1.  **Light Mode (Default):** Giao diện sáng chuẩn.
2.  **Dark Mode:** Giao diện tối, sử dụng không gian màu `oklch` để đảm bảo độ tương phản chuẩn.
3.  **System/Nature Mode:** Giao diện xanh (Green-based) lấy cảm hứng từ thiên nhiên.

---

## II. BẢNG TOKEN CHI TIẾT (TOKEN REFERENCE)

Developer bắt buộc sử dụng các Class Tailwind ánh xạ tới biến CSS dưới đây. Tuyệt đối không hardcode mã màu.

### 1. Base Colors (Nền & Chữ cơ bản)

| Token CSS              | Class Tailwind            | Light (Hex) | Dark (Oklch) | System (Nature) | Mô tả                       |
| :--------------------- | :------------------------ | :---------- | :----------- | :-------------- | :-------------------------- |
| `--background`         | `bg-background`           | `#f5f5f5`   | `0.145 0 0`  | `#f8faf9`       | Nền chính của trang/body.   |
| `--foreground`         | `text-foreground`         | `#1a1a1a`   | `0.985 0 0`  | `#1a2e1a`       | Màu chữ chính.              |
| `--card`               | `bg-card`                 | `#ffffff`   | `0.145 0 0`  | `#ffffff`       | Nền Card, Modal, Panel.     |
| `--card-foreground`    | `text-card-foreground`    | `#1a1a1a`   | `0.985 0 0`  | `#1a2e1a`       | Chữ trên nền Card.          |
| `--popover`            | `bg-popover`              | `#ffffff`   | `0.145 0 0`  | `#ffffff`       | Nền Popover, Tooltip, Menu. |
| `--popover-foreground` | `text-popover-foreground` | `#1a1a1a`   | `0.985 0 0`  | `#1a2e1a`       | Chữ trên nền Popover.       |

### 2. Semantic Actions (Màu hành động)

| Token CSS                | Class Tailwind              | Light     | Dark        | System    | Mô tả                       |
| :----------------------- | :-------------------------- | :-------- | :---------- | :-------- | :-------------------------- |
| `--primary`              | `bg-primary`                | `#0058a3` | `0.985 0 0` | `#2d7a3e` | Màu chủ đạo (Action chính). |
| `--primary-foreground`   | `text-primary-foreground`   | `#ffffff` | `0.205 0 0` | `#ffffff` | Chữ trên nền Primary.       |
| `--secondary`            | `bg-secondary`              | `#3366cc` | `0.269 0 0` | `#4a9960` | Màu phụ (Badge, btn phụ).   |
| `--secondary-foreground` | `text-secondary-foreground` | `#ffffff` | `0.985 0 0` | `#ffffff` | Chữ trên nền Secondary.     |
| `--tertiary`             | `bg-tertiary`               | `#89cff0` | N/A         | `#7ec699` | Màu cấp 3 (Optional).       |
| `--muted`                | `bg-muted`                  | `#f0f0f0` | `0.269 0 0` | `#e8f3ea` | Nền vô hiệu hóa/phụ.        |
| `--muted-foreground`     | `text-muted-foreground`     | `#52525b` | `0.8 0 0`   | `#4a5a4a` | Chữ phụ, label, hint.       |
| `--accent`               | `bg-accent`                 | `#e9ebef` | `0.269 0 0` | `#d4e4d7` | Nền hover row.              |

### 3. Status Colors (Trạng thái)

| Token CSS              | Class Tailwind            | Light     | Dark      | System    | Mô tả                            |
| :--------------------- | :------------------------ | :-------- | :-------- | :-------- | :------------------------------- |
| `--destructive`        | `bg-destructive`          | `#d4183d` | _oklch_   | `#c53030` | Lỗi, Xóa, Nguy hiểm.             |
| `--success`            | `bg-success`              | `#52c41a` | _oklch_   | `#38a169` | Thành công, Hoàn thành.          |
| `--warning`            | `bg-warning`              | `#faad14` | `#facc15` | `#d69e2e` | Cảnh báo, Chờ xử lý.             |
| `--warning-foreground` | `text-warning-foreground` | `#1a1a1a` | `#000000` | `#1a1a1a` | Chữ tương phản trên nền Warning. |

### 4. Layout & Borders

- `--border` (`border-border`): Màu đường kẻ phân chia layout.
- `--input` (`border-input`): Màu đường viền ô nhập liệu.
- `--ring` (`ring-ring`): Màu vòng sáng focus ring.
- `--radius`: Bo góc chuẩn (`0.625rem`).

### 5. Sidebar Component Tokens

Khu vực Sidebar có hệ màu riêng biệt để tách khối với Main Content:

- `--sidebar`: Nền Sidebar.
- `--sidebar-foreground`: Chữ chính Sidebar.
- `--sidebar-primary`: Màu active item/logo.
- `--sidebar-accent`: Màu hover item.

### 6. Chart Colors (Biểu đồ)

Hỗ trợ 5 màu chuẩn cho biểu đồ (`--chart-1` đến `--chart-5`), tự động đổi theo theme để đảm bảo hài hòa.

---

## III. QUY TẮC SỬ DỤNG (RULES)

1.  **Luôn dùng Variables:** Không bao giờ viết `#0058a3` trong code. Hãy viết `bg-primary`.
2.  **Opacity Modifier:** Hỗ trợ opacity channel (`bg-primary/50`, `text-foreground/90`).
3.  **Background Layers:**
    - App Wrapper: `div.h-screen.bg-background.text-foreground`
    - Main Content: `bg-transparent` (để lộ nền App Wrapper).
    - Sidebar: `bg-sidebar`.
4.  **Radius:** Sử dụng `rounded-[var(--radius)]` cho card, dialog để đồng nhất bo góc.

---

## IV. CẤU HÌNH KỸ THUẬT

- **File nguồn:** `src/app/globals.css`.
- **Config:** `tailwind.config.js` (Mapping custom property).
- **Theme Provider:** `ThemeContext.tsx`
    - Logic System Theme: Khi chọn System, add class `.system` (Nature) trực tiếp, không detect OS pref.
