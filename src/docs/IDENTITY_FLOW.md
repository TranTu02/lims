# LUỒNG XÁC THỰC VÀ QUẢN LÝ DANH TÍNH (IDENTITY FLOW)

Tài liệu này mô tả chi tiết quy trình xác thực (Authentication), phân quyền (Authorization) và quản lý người dùng trong hệ thống LIMS. Module Identity đóng vai trò "cổng gác" (Gatekeeper) cho toàn bộ ứng dụng.

---

## 1. Tổng quan Kiến trúc

### A. Cấu trúc Module

```
BLACK/IDENTITY/
├── 1_identityEntities.js       # Base class IdentityEntity + Identity + IdentityGroup entities
├── 2_identities.js              # Business logic (create, update, role management)
├── 8_identity_api_handler.js    # Identity API routes handler
├── 8_identity_group_api_handler.js # Identity Group API routes handler
└── TEST_IDENTITY.js             # Comprehensive test suite
```

### B. Database Schema

**Bảng**: `identity.identities`  
**Primary Key**: `identityId` (text)

| Field              | Type   | Description                                            |
| ------------------ | ------ | ------------------------------------------------------ |
| `identityId`       | text   | ID người dùng (Custom: `USR + YYMMDD + Suffix`)        |
| `identityName`     | text   | Tên đầy đủ                                             |
| `email`            | text   | Email (unique)                                         |
| `identityPhone`    | text   | Số điện thoại                                          |
| `identityNID`      | text   | Số CMND/CCCD                                           |
| `identityAddress`  | text   | Địa chỉ                                                |
| `password`         | text   | Mật khẩu đã hash (bcrypt)                              |
| `identityStatus`   | text   | `active`, `inactive`, `banned`                         |
| `roles`            | text[] | Danh sách role codes                                   |
| `identityPolicies` | jsonb  | Override policies `{ "POL_CODE": "ALLOW/DENY/LIMIT" }` |
| `permissions`      | jsonb  | Resolved permissions (table → column → bitmask)        |
| `alias`            | text   | Tên hiển thị ngắn gọn                                  |

---

## 2. Đăng nhập (Authentication)

**File nguồn**: `BLACK/MAIN SERVICE/4_Entity.js`  
**Phương thức**: `Entity.login({ email, password, ipAddress, userAgent })`

### Luồng xử lý:

1. **Input Validation**:
    - Kiểm tra `email` và `password` có được gửi lên
    - Nếu thiếu → Error `400 Bad Request`

2. **User Lookup**:

    ```sql
    SELECT * FROM identity.identities
    WHERE "email" = $1 AND "deletedAt" IS NULL
    ```

    - Nếu không tìm thấy → Error `401 Unauthorized`

3. **Status Check**:
    - Kiểm tra `identityStatus`
    - Nếu `inactive`, `banned` → Error `403 Forbidden`

4. **Password Verification**:
    - So sánh hash: `bcrypt.compare(password, user.password)`
    - Nếu sai → Error `401 Unauthorized`

5. **Session Creation**:
    - Sinh `sessionId`: `SS_` + UUID
    - Thời gian hết hạn: 24h (default)
    - Lưu vào `identity.sessions` + Valkey cache

6. **Response**:
    ```json
    {
      "token": "SS_01382de7-4967-4dda-bcfe-9318a41170ec",
      "identity": "Nguyễn Mai Quỳnh",
      "identityId": "IDx3ea18",
      "roles": ["ROLE_SUPER_ADMIN", "ROLE_DIRECTOR", ...]
    }
    ```

---

## 3. Xác thực Phiên & Tạo Context

**File nguồn**: `BLACK/MAIN SERVICE/4_Entity.js`  
**Phương thức**: `Entity.getEntity({ authToken })`

Mỗi request API đều gọi hàm này để xác định "Ai đang gọi API?".

### Luồng xử lý:

1. **Cache Check**:
    - Gọi `Valkey.hgetall(authToken)`
    - Nếu có → Return ngay (Cache Hit)
    - Nếu không → Tiếp tục bước 2

2. **Database Fallback**:

    ```sql
    SELECT * FROM identity.sessions
    WHERE "sessionId" = $1 AND "expiresAt" > NOW()
    ```

    - Nếu không tìm thấy hoặc hết hạn → Error `401 Session Expired`

3. **Load Identity**:
    - Dùng `identityId` từ session để lấy thông tin user
    - Query: `SELECT * FROM identity.identities WHERE "identityId" = $1`

4. **Permission Resolution**:
    - **Step 1**: Lấy `roles` (array of role codes)
    - **Step 2**: Resolve Policies từ Roles → `RESOLVE_POLICIES(roles)`
    - **Step 3**: Resolve Permissions từ Policies → `RESOLVE_PERMISSIONS(roles)`
    - **Step 4**: Merge với `identityPolicies` override (nếu có)

5. **Decimal Permissions Calculation**:
    - **Số nguyên (1, 3, 7)**: Full access
        - `1`: READ_FULL
        - `3`: WRITE_FULL
        - `7`: DELETE_FULL
    - **Số thập phân (0.5, 2.5, 6.5)**: Limited access (Own data only)
        - `0.5`: READ_OWN
        - `2.5`: WRITE_OWN
        - `6.5`: DELETE_OWN

6. **Cache & Return**:
    - Lưu toàn bộ Entity object (kèm permissions) vào Valkey
    - Return `new Entity()` instance

---

## 4. Đăng ký Người dùng

### A. Public Registration

**File nguồn**: `BLACK/IDENTITY/1_identityEntities.js`  
**Phương thức**: `IdentityEntity.publicRegister({ data })`

**Luồng xử lý**:

1. Validate: Bắt buộc `email`, `password`, `identityName`
2. Duplicate check: Email hoặc username đã tồn tại?
3. Role restriction: Không cho gán `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`, `ROLE_DIRECTOR`
4. Generate ID: `USR + YYMMDD + Suffix` (VD: `USR260214001`)
5. Hash password: `bcrypt.hash(password, 12)`
6. Default values:
    - `identityStatus`: `inactive` (cần kích hoạt)
    - `roles`: `["ROLE_TECHNICIAN"]` (default)
7. Insert vào DB + Sync Valkey cache

### B. Admin-Created User

**File nguồn**: `BLACK/IDENTITY/2_identities.js`  
**Phương thức**: `Identity.create({ data, authToken })`

**Luồng xử lý**:

1. **Auth check**: Chỉ Admin hoặc SuperAdmin được tạo user
2. **Role validation**:
    - SuperAdmin: Gán được tất cả roles
    - Admin: Không được gán `ROLE_ADMIN`, `ROLE_DIRECTOR`, `ROLE_SUPER_ADMIN`
3. **Auto-resolve**: Tự động resolve policies + permissions từ roles
4. **Generate ID**: `USR + YYMMDD + Suffix`
5. **Hash password**: `bcrypt.hash(password, 12)`
6. **Default values**:
    - `identityStatus`: `inactive` (default)
    - `createdById`: Admin's identityId
7. **Insert + Cache sync**

---

## 5. Quản lý Roles & Policies

### A. Add Role

**File nguồn**: `BLACK/IDENTITY/1_identityEntities.js`  
**Phương thức**: `identity.addRole(roleCode)`

**Luồng xử lý**:

1. Kiểm tra role code hợp lệ (tồn tại trong `CONSTANTS.ROLES`)
2. Thêm vào `roles` array (nếu chưa có)
3. **Auto-resolve policies**: Lấy policies từ role definition → Set `ALLOW`
4. Update DB + Cache

**Example**:

```javascript
await identity.addRole("ROLE_TECHNICIAN");
// → roles: ["ROLE_TECHNICIAN"]
// → identityPolicies: { "POL_TEST_EXECUTE": "ALLOW", ... }
```

### B. Remove Role

**Phương thức**: `identity.removeRole(roleCode)`

**Luồng xử lý**:

1. Xóa khỏi `roles` array
2. **Set policies to DENY**: Các policies liên quan → `DENY`
3. Update DB + Cache

### C. Update Policy

**Phương thức**: `identity.updatePolicy(policyCode, status)`

**Status**: `ALLOW`, `DENY`, `LIMIT`

**Luồng xử lý**:

1. Validate status
2. Update `identityPolicies[policyCode] = status`
3. **Auto-resolve permissions** nếu cần
4. Update DB + Cache

---

## 6. Kiểm tra Quyền (Permission Gatekeeper)

**File nguồn**: `BLACK/MAIN SERVICE/4_Entity.js`  
**Phương thức**: `Entity.checkPermit({ sourceTable, action, data, isThrow })`

Được gọi **đầu tiên** trong mọi phương thức truy cập dữ liệu.

### Tham số:

- `sourceTable`: Tên bảng (VD: `lab.sample`)
- `action`: `READ`, `WRITE`, `DELETE`, `EXECUTE`
- `data` (optional): Bản ghi cụ thể (check ownership)
- `isThrow`: Throw error nếu không có quyền

### Logic:

1. **Lấy quyền hiện tại**:

    ```javascript
    const permission = this.permissions[sourceTable];
    if (!permission) throw new cError(403, "Forbidden");
    ```

2. **Full Access (Số nguyên)**:
    - Quyền `1`, `3`, `7` → Return `true`

3. **Limited Access (Số thập phân)**:
    - **Có `data`**: Check ownership
        - Nếu là owner → `true`
        - Nếu không phải owner → Error `403`
    - **Không có `data`**: Return `true` (Filter sau bằng `filterDataResponse`)

---

## 7. Xác thực Sở hữu (Ownership Validation)

**Phương thức**: `Entity.validateOwnershipOrThrow({ data, sourceTable, action })`

Dùng trong `update()` và `delete()` để ngăn sửa/xóa dữ liệu người khác.

### Logic:

1. Lấy quyền cao nhất trên bảng
2. **Số nguyên (3, 7)**: Bỏ qua check
3. **Số thập phân (2.5, 6.5)**: Bắt buộc check ownership
    - Kiểm tra `technicianId`, `salePersonId`, `createdById`, `technicianIds`
    - Nếu không khớp → Error `403 Forbidden`

---

## 8. Lọc Dữ liệu Đầu ra (Data Response Filter)

**Phương thức**: `Entity.filterDataResponse(data)`

Đảm bảo user chỉ thấy dữ liệu họ được phép thấy.

### Logic:

1. Duyệt từng field của object
2. So khớp với `permissions[table][column]`
3. **Quyền Limit (0.5)**:
    - Check ownership
    - Nếu không phải owner → Set `null` (Masking)
4. **Quyền Full (≥1)**: Giữ nguyên
5. **Không có quyền (0)**: Xóa field

---

## 9. Ví dụ Thực tế: Kỹ thuật viên

**Tình huống**:

- User: `USR001` (Role: Technician)
- Policy: Chỉ xem/sửa mẫu do mình phụ trách
- Quyền: `READ = 0.5`, `WRITE = 2.5`

### A. Xem danh sách

1. Request: `GET /v2/samples/get/list`
2. CheckPermit: `0.5` → Cho phép query
3. DB Return:
    - Sample A (Owner: USR001)
    - Sample B (Owner: USR002)
4. FilterDataResponse:
    - Sample A: Giữ nguyên (Owner)
    - Sample B: Các field → `null` (Not owner)

### B. Sửa mẫu người khác

1. Request: `PATCH /v2/samples/update` (Sample B)
2. CheckPermit: `2.5` → Yêu cầu check ownership
3. ValidateOwnershipOrThrow:
    - `SampleB.technicianId` = "USR002"
    - Current user = "USR001"
    - **KHÔNG KHỚP**
4. Result: Error `403 Forbidden`

---

## 10. Permission Bitmask

### Giá trị cơ bản:

| Bitmask | Quyền        | Mô tả                       |
| ------- | ------------ | --------------------------- |
| `0`     | NONE         | Không có quyền              |
| `1`     | READ         | Đọc toàn bộ                 |
| `2`     | WRITE        | Ghi (không bao gồm đọc)     |
| `3`     | READ + WRITE | Đọc + Ghi                   |
| `4`     | DELETE       | Xóa (không bao gồm đọc/ghi) |
| `7`     | FULL         | Đọc + Ghi + Xóa             |

### Giá trị thập phân (Limited):

| Bitmask | Quyền      | Mô tả                    |
| ------- | ---------- | ------------------------ |
| `0.5`   | READ_OWN   | Chỉ đọc dữ liệu của mình |
| `2.5`   | WRITE_OWN  | Chỉ ghi dữ liệu của mình |
| `6.5`   | DELETE_OWN | Chỉ xóa dữ liệu của mình |

### Ownership Fields:

Hệ thống check các field sau để xác định ownership:

- `technicianId`
- `technicianIds` (array)
- `salePersonId`
- `createdById`
- `reviewedById`

---

## 11. Role Hierarchy

### SuperAdmin (`ROLE_SUPER_ADMIN`)

- Quyền cao nhất
- Gán được tất cả roles
- Quản lý toàn bộ hệ thống

### Director (`ROLE_DIRECTOR`)

- Quyền quản trị cấp cao
- Không được gán `ROLE_SUPER_ADMIN`
- Quản lý nghiệp vụ

### Admin (`ROLE_ADMIN`)

- Quyền quản trị cơ bản
- Không được gán `ROLE_ADMIN`, `ROLE_DIRECTOR`, `ROLE_SUPER_ADMIN`

### Operational Roles

- `ROLE_TECH_MANAGER`: Quản lý kỹ thuật
- `ROLE_QA_MANAGER`: Quản lý chất lượng
- `ROLE_SECTION_HEAD`: Trưởng bộ phận
- `ROLE_VALIDATOR`: Người phê duyệt
- `ROLE_SENIOR_ANALYST`: Chuyên viên cao cấp
- `ROLE_TECHNICIAN`: Kỹ thuật viên
- `ROLE_RECEPTIONIST`: Lễ tân
- `ROLE_SAMPLE_CUSTODIAN`: Quản lý mẫu
- `ROLE_EQUIPMENT_MGR`: Quản lý thiết bị
- `ROLE_INVENTORY_MGR`: Quản lý kho
- `ROLE_SALES_MANAGER`: Quản lý kinh doanh
- `ROLE_SALES_EXEC`: Nhân viên kinh doanh
- `ROLE_CS`: Chăm sóc khách hàng
- `ROLE_ACCOUNTANT`: Kế toán
- `ROLE_REPORT_OFFICER`: Nhân viên báo cáo
- `ROLE_DOC_CONTROLLER`: Quản lý tài liệu

---

## 12. Policy Examples

### Test Execution (`POL_TEST_EXECUTE`)

```json
{
    "permissions": {
        "lab.analysis": {
            "resultValue": 3,
            "resultUnit": 3,
            "technicianId": 3,
            "status": 3
        }
    }
}
```

### Sample View Basic (`POL_SAMPLE_VIEW_BASIC`)

```json
{
    "permissions": {
        "lab.sample": {
            "sampleId": 1,
            "sampleName": 1,
            "matrix": 1,
            "status": 1
        }
    }
}
```

### Client Manage (`POL_CLIENT_MANAGE`)

```json
{
    "permissions": {
        "crm.clients": {
            "clientId": 1,
            "clientName": 3,
            "clientEmail": 3,
            "clientPhone": 3,
            "clientAddress": 3
        }
    }
}
```

---

## 13. Security Best Practices

1. **Password Hashing**: Always use bcrypt with salt rounds ≥ 12
2. **Session Expiry**: Default 24h, configurable
3. **Cache Invalidation**: Clear cache on logout, role change, policy update
4. **Ownership Check**: Always validate for decimal permissions
5. **Audit Logging**: Log all permission changes
6. **Token Rotation**: Implement refresh token mechanism
7. **Rate Limiting**: Prevent brute force attacks on login

---

**End of Identity Flow Documentation**
