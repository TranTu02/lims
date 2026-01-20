# TÀI LIỆU QUY CHUẨN PHÁT TRIỂN HỆ THỐNG LIMS (CORE RULEBOOK)

**Phiên bản:** 6.3.0 (Layout Restructured)  
**Ngày cập nhật:** 19/01/2026  
**Tham chiếu:** [partner/RULE.md](../partner/RULE.md), [partner/DATABASE.md](../partner/DATABASE.md)

---

## I. TỔNG QUAN CÔNG NGHỆ (TECH STACK)

### 1. Core Framework

- **Runtime:** Node.js 18+
- **Build Tool:** Vite 5+ (`vite`, `@vitejs/plugin-react`)
- **Language:** TypeScript 5+ (Strict Mode)

### 2. UI & Styling

- **Framework:** React 18
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **UI Library:** **Shadcn/ui** (Base) + **Radix UI** (Primitives)
- **Icons:** `lucide-react`
- **Animations:** `framer-motion` (Phức tạp) / `tailwindcss-animate` (Cơ bản)
- **Theme:** `next-themes` (Dark/Light Mode)

### 3. State & Logic

- **Server State:** `@tanstack/react-query` (Quản lý API Data)
- **Client State:** `zustand` (Global UI State) hoặc `React Context` (Auth/Theme)
- **Forms:** `react-hook-form` + `zod`
- **Routing:** `react-router-dom` v6+ (Optional for single-page dashboard apps)
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`

---

## II. CẤU TRÚC THƯ MỤC (DIRECTORY STRUCTURE)

Cấu trúc này đồng bộ hoàn toàn với dự án Partner để dễ dàng bảo trì chéo.

```bash
src/
├── app/                        # Application Setup
│   ├── App.tsx                 # Main Application Entry Point
│   └── globals.css             # Main Entry CSS (Tailwind directives)
│
├── api/                        # API Definition Layers
│   ├── index.ts                # Axios Instance & Interceptors
│   ├── reception.ts            # API cho nghiệp vụ Tiếp nhận
│   ├── lab.ts                  # API cho nghiệp vụ Phòng Lab
│   └── auth.ts                 # API xác thực
│
├── assets/                     # Static Assets
│   ├── images/
│   └── fonts/
│
├── components/                 # COMPONENT LIBRARY
│   ├── common/                 # [Composite] Shared Logic Components
│   │   ├── Pagination.tsx
│   │   ├── StatusBadge.tsx     # Badge trạng thái (Chuẩn hóa màu sắc)
│   │   ├── DataTable.tsx       # Bảng dữ liệu (Sort/Filter)
│   │   ├── ThemeToggle.tsx     # Nút chuyển đổi Theme
│   │   └── LanguageSwitcher.tsx # Nút chuyển đổi Ngôn ngữ
│   ├── layout/                 # Layout Components (Core Layout System)
│   │   ├── Sidebar.tsx         # Menu điều hướng chính
│   │   ├── Header.tsx          # Top Bar (Title, User Profile, Search)
│   │   ├── MainContent.tsx     # Wrapper cho nội dung chính
│   │   └── Layout.tsx          # Wrapper chung (Composition)
│   ├── ui/                     # [Atomic] Shadcn Base Components (Button, Input, Select...)
│   │   ├── button.tsx
│   │   └── ...
│   │
│   │   # --- FEATURE COMPONENTS (Theo nghiệp vụ) ---
│   ├── reception/              # Nghiệp vụ Tiếp nhận mẫu
│   │   ├── SampleReceiptForm.tsx
│   │   └── ReceiptPrintTemplate.tsx
│   ├── technician/             # Nghiệp vụ Kỹ thuật viên
│   │   ├── ResultEntryGrid.tsx
│   │   └── Worksheet.tsx
│   ├── lab-manager/            # Quản lý Phòng Lab
│   │   └── ApprovalQueue.tsx
│   ├── inventory/              # Kho & Hóa chất
│   └── ...
│
├── config/                     # APP CONFIGURATION
│   ├── constants.ts            # Hằng số (PAGE_SIZE, DATE_FORMAT)
│   ├── navigation.ts           # Cấu hình Menu Sidebar
│   ├── i18n/                   # Đa ngôn ngữ
│   │   ├── i18n.ts             # Init configuration
│   │   └── locales/            # File dịch
│   │       ├── vi.ts           # Tiếng Việt
│   │       └── en.ts           # Tiếng Anh
│   └── theme/                  # Theme Configuration
│       └── theme.config.ts     # Config màu sắc, radius
│
├── contexts/                   # React Contexts
│   ├── AuthContext.tsx         # User Session & Permissions
│   └── ThemeContext.tsx
│
├── hooks/                      # Custom Hooks
│   ├── useAuth.ts
│   ├── useToast.ts
│   └── useDebounce.ts
│
├── pages/                      # VIEW PAGES (Route Destinations)
│   ├── DashboardPage.tsx       # Trang Dashboard chính (Render sub-UIs)
│   ├── LoginPage.tsx
│   └── ...
│
├── types/                      # TYPESCRIPT INTERFACES
│   ├── api.ts                  # Common API Response Types
│   ├── entity.ts               # Database Entities (Sample, Receipt, Order...)
│   └── auth.ts                 # User & Role Types
│
├── utils/                      # HELPER FUNCTIONS
│   ├── format.ts               # Format tiền, ngày tháng
│   └── validation.ts           # Common Zod Schemas
│
└── main.tsx                    # Entry Point (DOM Render)
```

---

## III. HỆ THỐNG GIAO DIỆN (THEMING SYSTEM)

### A. Quy tắc cốt lõi

- **Quy tắc Bất di bất dịch**: KHÔNG BAO GIỜ sử dụng mã màu cứng (hardcoded colors) như `bg-white`, `text-black`, `bg-[#123456]`.
- **Sử dụng Class theo Ngữ nghĩa**: Luôn sử dụng các biến Tailwind được định nghĩa trong `globals.css` thông qua `theme.config.ts`.
    - **Nền:** `bg-background`, `bg-card`, `bg-muted`
    - **Chữ:** `text-foreground`, `text-muted-foreground`, `text-primary`
    - **Viền:** `border-border`, `border-input`
- **Định dạng Số liệu**: Tất cả các giá trị tiền tệ hiển thị trên UI (đặc biệt là Print Template & Preview) phải được định dạng thống nhất với tối đa 2 chữ số thập phân (`maximumFractionDigits: 2`).
- **Tham chiếu Chi tiết**: Xem [src/config/theme/THEME_SYSTEM.md](src/config/theme/THEME_SYSTEM.md) (Tài liệu đầy đủ về mã màu và tokens).

### B. Bảng màu Ngữ nghĩa (Semantic Colors)

| Token Tailwind  | Class                                            | Ý nghĩa                                                         |
| :-------------- | :----------------------------------------------- | :-------------------------------------------------------------- |
| **Primary**     | `bg-primary` / `text-primary-foreground`         | Màu thương hiệu chính (Blue). Dùng cho nút chính, active state. |
| **Secondary**   | `bg-secondary` / `text-secondary-foreground`     | Màu phụ. Dùng cho nút phụ, badge thông thường.                  |
| **Destructive** | `bg-destructive` / `text-destructive-foreground` | Màu cảnh báo/nguy hiểm (Red). Dùng cho nút xóa, lỗi.            |
| **Muted**       | `bg-muted` / `text-muted-foreground`             | Màu nền phụ, chữ mờ/nhạt.                                       |
| **Accent**      | `bg-accent` / `text-accent-foreground`           | Màu nhấn nhẹ, dùng cho hover row, dropdown item.                |
| **Background**  | `bg-background`                                  | Màu nền trang (Trắng/Đen).                                      |
| **Foreground**  | `text-foreground`                                | Màu chữ chính (Đen/Trắng).                                      |
| **Border**      | `border-border`                                  | Màu đường viền.                                                 |
| **Input**       | `border-input`                                   | Màu viền input form.                                            |

### C. Quy tắc Style

- **Padding:** Chuẩn `p-4` (Mobile), `p-6` (Desktop).
- **Rounded:** `rounded-md` (6px) cho Input/Button standard. `rounded-lg` (8px) cho Card/Container.
- **Shadow:** `shadow-sm` cho Card/Input. `shadow-md` cho Dropdown/Popover.

### D. Responsive Layout Strategy

Tham chiếu chi tiết: [XII. CHIẾN LƯỢC RESPONSIVE & LAYOUT trong THEME_SYSTEM.md](THEME_SYSTEM.md#xii-chiến-lược-responsive--layout-bổ-sung)

1.  **Grid System:** Bắt buộc dùng `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` cho Form.
2.  **Table:** Bắt buộc bọc trong `overflow-x-auto`. Cột "Action" và "ID" nên `sticky`.
3.  **App Shell:** Sidebar phải có chế độ collapsible/drawer để tối ưu diện tích.

---

## IV. QUY CHUẨN ĐA NGÔN NGỮ (I18N)

Hệ thống bắt buộc hỗ trợ song ngữ Anh-Việt ngay từ đầu.
_Xem chi tiết quy chuẩn tại: [src/config/i18n/LANGUAGE_SYSTEM.md](src/config/i18n/LANGUAGE_SYSTEM.md)_

### 1. Cấu hình & Sử dụng

- **Init**: Đã cấu hình tại `src/config/i18n/index.ts`.
- **Provider**: Đã import tại `main.tsx`.
- **Persistence**: Language được lưu tại localStorage `i18nextLng`.

### 2. Cấu trúc File Dịch (`src/config/i18n/locales/*.ts`)

Phân chia key theo modules để dễ quản lý:

```typescript
// locales/vi.ts
export default {
  common: {
    actions: "Thao tác",
    save: "Lưu lại",
    cancel: "Hủy bỏ",
    loading: "Đang tải...",
  },
  reception: {
    title: "Tiếp nhận mẫu",
    fields: {
      sender: "Người gửi mẫu",
      sample_type: "Loại mẫu",
    },
    status: {
      pending: "Chờ xử lý",
      analyzing: "Đang phân tích",
    }
  },
  lab: { ... }
}
```

### 2. Sử dụng trong Component

- Dùng hook `useTranslation`:
    ```tsx
    const { t } = useTranslation();
    return <Button>{t("common.save")}</Button>;
    ```
- **Switcher**: Sử dụng component `<LanguageSwitcher />` để chuyển đổi.
- **CẤM:** Viết cứng "Lưu lại" trong JSX.
- **Date Format:** Sử dụng `date-fns` với locale đúng: `format(date, 'dd/MM/yyyy', { locale: vi })`.

---

## V. QUY CHUẨN API & INTEGRATION

### 1. API Client (`src/api/index.ts`)

- Sử dụng `axios` instance tập trung.
- Tự động đính kèm `Authorization: Bearer <token>` và `x-tenant-id` vào header.
- Interceptor xử lý lỗi 401 (Hết phiên) -> Tự động logout/refresh.

### 2. Định nghĩa Hàm API

Mỗi hàm API chỉ nhận 1 object tham số (Input Object Pattern):

```typescript
// ✅ CHUẨN
interface GetSamplesParams {
  page: number;
  status?: string;
  query?: string;
}
export const getSamples = async (params: GetSamplesParams) => {
  return api.get('/v1/samples', { params });
}

// ❌ SAI (Nhiều tham số rời rạc)
export const getSamples = async (page, status, query) => { ... }
```

---

## VI. QUY CHUẨN DATABASE (TÓM TẮT)

_Tham chiếu chi tiết: [partner/DATABASE.md](../partner/DATABASE.md)_

1.  **Schema Isolation:** Mỗi Tenant một Schema riêng `tenant_xxx`.
2.  **Naming:** `camelCase` cho bảng và cột.
3.  **IDs:** Sử dụng Custom Text ID (VD: `MAT-001`, `REC-2401-001`).
4.  **Audit:** Bắt buộc có `created/modified/deleted` timestamps + user IDs.
5.  **Snapshots:** Order/Result phải lưu snapshot giá/giới hạn quy chuẩn (JSONB) để không bị sai lệch khi danh mục gốc thay đổi.

---

## VII. QUY CHUẨN QUẢN LÝ SERVER STATE (TanStack Query)

Đây là phần quan trọng nhất để tránh bug về dữ liệu (caching sai, không cập nhật UI).

### 1. Query Key Factory (BẮT BUỘC)

Không bao giờ hardcode string cho query key. Phải tập trung quản lý key tại `src/config/query-keys.ts`.

```typescript
// ✅ CHUẨN
export const sampleKeys = {
  all: ['samples'] as const,
  lists: () => [...sampleKeys.all, 'list'] as const,
  list: (filters: string) => [...sampleKeys.lists(), { filters }] as const,
  details: () => [...sampleKeys.all, 'detail'] as const,
  detail: (id: string) => [...sampleKeys.details(), id] as const,
};

// Sử dụng:
useQuery({
  queryKey: sampleKeys.list(filter),
  queryFn: ...
})
```

### 2. Stale Time & Cache Time

Quy định rõ ràng thời gian sống của dữ liệu để tránh request thừa hoặc dữ liệu cũ.

- **Global Config:** `staleTime: 0` (Mặc định luôn fetch mới để đảm bảo tính chính xác của số liệu Lab).
- **Static Data (Danh mục, Settings):** `staleTime: 5 * 60 * 1000` (5 phút).

### 3. Mutation Side-effects

Sau khi Thêm/Sửa/Xóa (Mutation), bắt buộc phải `invalidateQueries` liên quan để UI tự cập nhật. Không tự update local state thủ công trừ khi cần Optimistic UI.

---

## VIII. QUY CHUẨN CODE QUALITY & LINTING

Quy định bằng lời nói là chưa đủ, phải ép buộc bằng công cụ.

### 1. ESLint & Prettier

Cấu hình `.eslintrc.cjs` chặt chẽ hơn:

- **No Explicit Any:** `off` -> `error`. Cấm tuyệt đối dùng `any`. Nếu dữ liệu quá động, dùng `unknown` và validate.
- **No Unused Vars:** `error`. Không để rác trong code.
- **React Hooks:** `plugin:react-hooks/recommended` (Bắt buộc dependency array phải đúng).

### 2. TypeScript Strictness

Trong `tsconfig.json`:

- `"noImplicitAny": true`
- `"strictNullChecks": true`: Bắt buộc xử lý trường hợp `null` hoặc `undefined` (Rất quan trọng với số liệu xét nghiệm).

### 3. Zod Schema naming

Schema validate phải tách biệt với Type definition nhưng đặt cùng file hoặc folder `schemas`.

- Tên biến schema phải có hậu tố `Schema` (vd: `sampleCreateSchema`).
- Type được suy diễn từ schema: `type SampleCreate = z.infer<typeof sampleCreateSchema>`.

---

## IX. QUY CHUẨN GIT WORKFLOW & COMMIT

Với 2 FE + 3 BE, việc đồng bộ rất quan trọng.

### 1. Branching Model (Simplified Gitflow)

- `main`: Code production (Ổn định).
- `develop`: Code staging (Tích hợp BE để test).
- `feat/tên-tính-năng`: Branch phát triển của từng cá nhân.
    - VD: `feat/reception-form`, `fix/sample-id-gen`.

### 2. Conventional Commits (BẮT BUỘC)

Commit message phải theo chuẩn để dễ trace lỗi:

- `feat: ...`: Thêm tính năng mới.
- `fix: ...`: Sửa lỗi.
- `refactor: ...`: Sửa code nhưng không đổi logic (dọn dẹp).
- `ui: ...`: Chỉ sửa giao diện (CSS).
- **VD:** `feat(reception): add barcode scanning logic`

### 3. Pull Request (PR)

- Code không được merge thẳng vào `develop`. Phải tạo PR.
- Người kia (trong team 2 người) phải review. Check list:
    - [ ] Đã clear console.log chưa?
    - [ ] Đã handle loading/error state chưa?
    - [ ] Type có dùng `any` không?

---

## X. XỬ LÝ LỖI & UX (ERROR HANDLING)

### 1. Global Error Boundary

Bọc toàn bộ App (hoặc từng Widget lớn) bằng Error Boundary. Nếu component crash, hiển thị "Đã có lỗi xảy ra" và nút "Tải lại trang" thay vì trắng trang.

### 2. Toast Notification Standard

Quy định màu sắc và nội dung thông báo (dùng `sonner` hoặc `useToast` của shadcn):

- **Success:** Màu xanh. Nội dung: "Động từ + Đối tượng + Thành công". VD: "Lưu mẫu xét nghiệm thành công".
- **Error:** Màu đỏ. Nội dung: Phải hiển thị message từ Backend trả về (nếu có) hoặc "Lỗi hệ thống".
- **Warning:** Màu vàng. Cảnh báo hành động không thể hoàn tác.

### 3. Loading State (Skeleton)

Không dùng spinner xoay tròn (`Spin`) cho toàn trang.

- **Bắt buộc:** Sử dụng `Skeleton` (Shadcn UI) mô phỏng cấu trúc bảng/form khi đang tải dữ liệu để tránh layout shift (giật khung hình).

---

## XI. QUY ĐỊNH VỀ LOGIC PHỨC TẠP (BUSINESS LOGIC)

Đây là phần dành cho LIMS:

### 1. Custom Hooks separation

Logic nghiệp vụ KHÔNG được viết trực tiếp trong Component (File `.tsx` UI).

- **Quy tắc:** Nếu một `useEffect` hoặc hàm xử lý dài quá 10 dòng -> Tách ra Custom Hook.
- **Vị trí:** `src/hooks/domain/useSampleProcessing.ts`.

### 2. Utility Functions

Các hàm tính toán (VD: Tính độ pha loãng, quy đổi đơn vị, format kết quả xét nghiệm) phải là **Pure Functions** (Hàm thuần túy), tách ra file `utils/calculation.ts` và **BẮT BUỘC viết Unit Test** (dùng Vitest) cho các hàm này.
-> _Lý do: Đây là lõi của LIMS, sai số liệu là chết người._

### 3. Hạn chế `useEffect`

Với React 18 + React Query, cố gắng hạn chế dùng `useEffect` để sync data.

- Dùng `derived state` (tính toán ngay trong lúc render) hoặc `useQuery` select option.
- `useEffect` chỉ dùng để sync với hệ thống bên ngoài (DOM, WebSocket).

---

## TỔNG KẾT

Tài liệu này không chỉ là hướng dẫn, mà là "Luật Code" cho team phát triển LIMS. Kỷ luật trong 5 mục bổ sung trên (Data, Code Quality, Git, Error Handling, Business Logic) sẽ giúp hệ thống ổn định, dễ bảo trì và dễ mở rộng (scale) khi team phát triển lớn hơn.
