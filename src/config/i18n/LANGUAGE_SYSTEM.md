# HỆ THỐNG ĐA NGÔN NGỮ (I18N SYSTEM)

**Phiên bản:** A.2
**Ngày cập nhật:** 20/01/2026
**Thư viện:** `i18next`, `react-i18next`

---

## I. CẤU TRÚC TỔ CHỨC

Toàn bộ cấu hình và file dịch nằm trong `src/config/i18n/`.

```bash
src/config/i18n/
├── index.ts              # Entry point: Init i18n instance, plugins detector
├── LANGUAGE_SYSTEM.md    # Tài liệu quy chuẩn này
└── locales/              # Folder chứa file ngôn ngữ (JSON structure exported as TS object)
    ├── vi.ts             # Tiếng Việt (Ngôn ngữ mặc định)
    └── en.ts             # Tiếng Anh
```

## II. QUY TẮC ĐẶT TÊN (NAMING CONVENTION)

1.  **Format Key:** `camelCase` (ví dụ: `identityName`, `createdAt`).
2.  **Cấu trúc Lồng nhau (Nested):** `Module` -> `SubModule/Entity` -> `Field`.
3.  **Không dùng Flat Keys:** Tránh đặt key ở root (trừ `common`).

### Ví dụ Cấu trúc Chuẩn (`vi.ts`)

```typescript
export default {
    // 1. Common: Các từ dùng chung, nút bấm, trạng thái chung
    common: {
        actions: "Thao tác",
        save: "Lưu lại",
        cancel: "Hủy bỏ",
        loading: "Đang tải...",
        status: "Trạng thái",
    },

    // 2. Auth & Identity: Liên quan tài khoản
    identity: {
        identities: {
            identityName: "Họ và tên",
            email: "Email",
            password: "Mật khẩu",
        },
        sessions: {
            ipAddress: "Địa chỉ IP",
        }
    },

    // 3. Nghiệp vụ LIMS (Chia theo Feature)
    technician: {
        workspace: {
            title: "Bàn làm việc KTV",
            todo: "Chưa thực hiện", // Key: technician.workspace.todo
        }
    },

    lab: {
        samples: { ... },
        receipts: { ... },
    }
};
```

## III. HƯỚNG DẪN SỬ DỤNG (USAGE)

### 1. Trong React Component

Sử dụng hook `useTranslation`.

```tsx
import { useTranslation } from "react-i18next";

export const MyComponent = () => {
    const { t } = useTranslation();

    return (
        <Button>
            {/* Truy xuất key theo đường dẫn dấu chấm */}
            {t("common.save")}
        </Button>
    );
};
```

### 2. Interpolation (Biến động)

```typescript
// Trong vi.ts
welcome: "Xin chào, {{name}}!";

// Trong Code
t("common.welcome", { name: "Quang" }); // -> "Xin chào, Quang!"
```

### 3. Date & Number Formatting

Không sử dụng `format` của i18next cho ngày tháng phức tạp. Hãy dùng `date-fns`:

```tsx
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";

// Lấy locale object dựa trên i18n language
const localeMap = { vi: vi, en: enUS };
const currentLocale = localeMap[i18n.language] || vi;

const dateStr = format(new Date(), "dd/MM/yyyy HH:mm", { locale: currentLocale });
```

---

## IV. QUY TRÌNH THÊM TỪ MỚI

1.  **Bước 1:** Xác định Module (vd: đang làm tính năng `Inventory` -> tìm/tạo key `inventory`).
2.  **Bước 2:** Thêm key và text tiếng Việt vào `src/config/i18n/locales/vi.ts`.
3.  **Bước 3:** (Optional ngay lập tức, nhưng bắt buộc trước release) Thêm key vào `en.ts`. Ít nhất copy key sang để tránh lỗi missing key, giá trị có thể để tạm tiếng Việt nếu chưa dịch.
4.  **Bước 4:** Sử dụng `t("inventory.newItem")` trong code.

**Lưu ý:** IDE có thể hỗ trợ autocomplete key nếu cấu hình TS đúng (tùy version `react-i18next`).

## V. CÁC MODULES CHÍNH HIỆN CÓ

- `common`: Chung.
- `theme`: Tên các theme.
- `identity`: User, Account, Roles.
- `crm`: Clients, Orders, Quotes.
- `library`: Matrices, Parameters, Protocols.
- `lab`: Core LIMS (Samples, Receipts, Analysis, Equipment).
- `document`: Files, Reports.
- `technician`: Workspace KTV.
