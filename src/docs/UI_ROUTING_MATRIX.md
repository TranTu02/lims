# MA TRẬN ĐIỀU HƯỚNG VÀ HIỂN THỊ UI THEO ROLE (UI ROUTING & VISIBILITY MATRIX)

Tài liệu này quy định việc điều hướng sau khi đăng nhập và các menu chức năng (Sidebar) được phép hiển thị cho từng chức danh (Role) trong hệ thống LIMS.

## 1. DEFAULT LOGIN REDIRECT (MÀN HÌNH CHÍNH SAU ĐĂNG NHẬP)

| Khối / Nhóm | Chức vụ (System Role) | Màn hình Redirect Mặc định | Ý nghĩa / Mục đích |
| :--- | :--- | :--- | :--- |
| **Ban Lãnh đạo** | `ROLE_DIRECTOR`, `ROLE_SUPER_ADMIN`, `admin`, `superAdmin` | `/` (Dashboard) | Xem tổng quan báo cáo, thống kê toàn phòng Lab. |
| **Quản lý** | `ROLE_TECH_MANAGER`, `ROLE_QA_MANAGER`, `ROLE_SECTION_HEAD` | `/manager/approvals` hoặc `/assignment` | Quản lý, phân công và duyệt kết quả phân tích. |
| **Kỹ thuật viên** | `ROLE_TECHNICIAN`, `ROLE_SENIOR_ANALYST`, `ROLE_IPC_INSPECTOR`, `ROLE_RND_SPECIALIST`, `technician` | `/technician` | Thực hiện các phép thử, nhập kết quả trực tiếp. |
| **Nhận mẫu & Hậu cần**| `ROLE_RECEPTIONIST`, `ROLE_SAMPLER`, `sampleManager` | `/reception` | Xử lý việc tiếp nhận mẫu mới và mã hóa mẫu. |
| **Thủ kho** | `ROLE_INVENTORY_MGR`, `ROLE_EQUIPMENT_MGR`, `ROLE_SAMPLE_CUSTODIAN` | `/inventory` | Quản lý kho hóa chất, thiết bị và lưu mẫu. |
| **Kinh doanh & CSKH** | `ROLE_SALES_MANAGER`, `ROLE_SALES_EXEC`, `ROLE_CS` | `/crm` | Quản lý báo giá, hợp đồng và khách hàng. |
| **Kế toán & Báo cáo** | `ROLE_ACCOUNTANT`, `ROLE_REPORT_OFFICER` | `/accounting` hoặc `/manager/reports` | Xử lý thanh toán, hóa đơn và xuất báo cáo. |

---

## 2. SIDEBAR VISIBILITY MATRIX (MA TRẬN HIỂN THỊ MENU SIDEBAR)

Sidebar menu sẽ được giới hạn bằng cách sử dụng `hasAccess` method map theo `id` của từng Tab đối với các User Roles. 

| Menu ID (Sidebar) | Tên Menu | Roles được phép truy cập (Allowed Roles) |
| :--- | :--- | :--- |
| `crm` | Kinh doanh (CRM) | `ROLE_SALES_MANAGER`, `ROLE_SALES_EXEC`, `ROLE_CS`, `ROLE_ACCOUNTANT`, `ROLE_SUPER_ADMIN` |
| `technician` | Kỹ thuật viên | `ROLE_TECHNICIAN`, `ROLE_SENIOR_ANALYST`, `ROLE_SECTION_HEAD`, `ROLE_IPC_INSPECTOR`, `ROLE_RND_SPECIALIST`, `ROLE_SUPER_ADMIN`, `technician` |
| `manager` | Quản lý Lab | `ROLE_TECH_MANAGER`, `ROLE_SECTION_HEAD`, `ROLE_VALIDATOR`, `ROLE_QA_MANAGER`, `ROLE_SUPER_ADMIN` |
| `assignment` | Phân công | `ROLE_TECH_MANAGER`, `ROLE_SECTION_HEAD`, `ROLE_SUPER_ADMIN` |
| `reception` | Nhận mẫu | `ROLE_RECEPTIONIST`, `ROLE_SAMPLER`, `ROLE_CS`, `ROLE_SUPER_ADMIN`, `sampleManager` |
| `handover` | Giao nhận mẫu | `ROLE_RECEPTIONIST`, `ROLE_TECHNICIAN`, `ROLE_SECTION_HEAD`, `ROLE_SAMPLE_CUSTODIAN`, `ROLE_SUPER_ADMIN`, `sampleManager` |
| `stored-samples` | Lưu mẫu | `ROLE_SAMPLE_CUSTODIAN`, `ROLE_RECEPTIONIST`, `ROLE_SUPER_ADMIN`, `sampleManager` |
| `inventory` | Kho chung | `ROLE_INVENTORY_MGR`, `ROLE_EQUIPMENT_MGR`, `ROLE_SUPER_ADMIN` |
| `chemical-inventory`| Kho Hóa chất | `ROLE_INVENTORY_MGR`, `ROLE_TECHNICIAN`, `ROLE_SENIOR_ANALYST`, `ROLE_SUPER_ADMIN` |
| `general-inventory` | Kho Thiết bị/Vật tư | `ROLE_EQUIPMENT_MGR`, `ROLE_INVENTORY_MGR`, `ROLE_SUPER_ADMIN` |
| `hr` | Nhân sự | `ROLE_SUPER_ADMIN`, `ROLE_DIRECTOR` |
| `document` | Tài liệu (SOP) | `ROLE_DOC_CONTROLLER`, `ROLE_QA_MANAGER`, `ROLE_TECH_MANAGER`, `ROLE_SUPER_ADMIN` |
| `libraries` | Thư viện Cấu hình | `ROLE_TECH_MANAGER`, `ROLE_QA_MANAGER`, `ROLE_SUPER_ADMIN`, `ROLE_DOC_CONTROLLER` |

> *Ghi chú:* `admin` và `superAdmin` sẽ có toàn quyền (Bypass check).
