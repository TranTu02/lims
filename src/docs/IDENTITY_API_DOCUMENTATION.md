# IDENTITY API DOCUMENTATION

**Module**: Identity (Quản lý Người dùng & Phân quyền)  
**Version**: 2.0  
**Base URL**: `/v2/identities`  
**Generated**: 2026-02-14

---

## Table of Contents

1. [Authentication](#authentication)
2. [Identity Endpoints](#identity-endpoints)
    - [GET LIST](#get-list)
    - [GET DETAIL](#get-detail)
    - [CREATE](#create)
    - [UPDATE](#update)
    - [DELETE](#delete)
    - [ADD ROLE](#add-role)
    - [REMOVE ROLE](#remove-role)
    - [UPDATE POLICY](#update-policy)
3. [Identity Group Endpoints](#identity-group-endpoints)
    - [GET LIST](#group-get-list)
    - [GET DETAIL/FULL](#group-get-detail)
    - [CREATE](#group-create)
    - [UPDATE](#group-update)
    - [SYNC](#group-sync)
    - [DELETE](#group-delete)
4. [Data Models](#data-models)
5. [Permission System](#permission-system)
6. [Error Codes](#error-codes)

---

## Authentication

All endpoints require authentication via JWT token, **except** public registration.

**Methods**:

1. **Bearer Token** (Recommended):

    ```
    Authorization: Bearer SS_01382de7-4967-4dda-bcfe-9318a41170ec
    ```

2. **Cookie**:
    ```
    Cookie: sid=SS_01382de7-4967-4dda-bcfe-9318a41170ec
    ```

**Login Endpoint**: `POST /v2/auth/login`

---

## Identity Endpoints

### GET LIST

Lấy danh sách người dùng với phân trang và tìm kiếm.

**Endpoint**: `GET /v2/identities/get/list`

**Query Parameters**:

| Parameter                  | Type    | Required | Default     | Description                 |
| -------------------------- | ------- | -------- | ----------- | --------------------------- |
| `page`                     | integer | No       | 1           | Trang hiện tại              |
| `itemsPerPage`             | integer | No       | 20          | Số item/trang               |
| `searchTerm` hoặc `search` | string  | No       | -           | Tìm kiếm theo ID/Name/Email |
| `sortBy`                   | string  | No       | `createdAt` | Cột sắp xếp                 |
| `sortDir`                  | string  | No       | `DESC`      | `ASC` hoặc `DESC`           |

**Example Request**:

```http
GET /v2/identities/get/list?page=1&itemsPerPage=2&searchTerm=admin
Authorization: Bearer SS_01382de7-4967-4dda-bcfe-9318a41170ec
```

**Example Response**:

```json
{
    "data": [
        {
            "identityId": "IDx3ea18",
            "identityName": "Nguyễn Mai Quỳnh",
            "email": "admin@lims.com",
            "identityPhone": "",
            "identityStatus": "active",
            "roles": ["ROLE_SUPER_ADMIN", "ROLE_DIRECTOR", "ROLE_TECH_MANAGER"],
            "identityPolicies": {
                "POL_QA_AUDIT": "ALLOW",
                "POL_LIB_MANAGE": "ALLOW",
                "POL_SYS_CONFIG": "ALLOW"
            },
            "permissions": {
                "crm.orders": {
                    "orderId": 7,
                    "clientId": 7,
                    "totalAmount": 7
                },
                "lab.sample": {
                    "sampleId": 3,
                    "sampleName": 3,
                    "status": 3
                }
            },
            "alias": "",
            "createdAt": "2026-01-04T18:34:08.654Z",
            "modifiedAt": "2026-02-13T07:46:39.985Z"
        }
    ],
    "pagination": {
        "page": 1,
        "itemsPerPage": 2,
        "total": 124,
        "totalPages": 62
    }
}
```

**Note**: Field `password` được tự động loại bỏ khỏi response.

---

### GET DETAIL

Lấy chi tiết 1 người dùng.

**Endpoint**: `GET /v2/identities/get/detail`

**Query Parameters**:

| Parameter              | Type   | Required | Description   |
| ---------------------- | ------ | -------- | ------------- |
| `id` hoặc `identityId` | string | Yes      | ID người dùng |

**Example Request**:

```http
GET /v2/identities/get/detail?id=IDx95d60
Authorization: Bearer SS_01382de7-4967-4dda-bcfe-9318a41170ec
```

**Example Response**:

```json
{
    "identityId": "IDx95d60",
    "identityName": "Nguyễn Hữu Nghị",
    "email": "nghinguyen.irdop@gmail.com",
    "identityPhone": "",
    "identityStatus": "active",
    "roles": ["ROLE_SALES_EXEC", "ROLE_CS"],
    "identityPolicies": {
        "POL_QUOTE_CREATE": "ALLOW",
        "POL_CLIENT_MANAGE": "ALLOW",
        "POL_ORDER_PROCESS": "ALLOW",
        "POL_CRM_VIEW_BASIC": "ALLOW"
    },
    "permissions": {
        "crm.orders": {
            "client": 3,
            "orderId": 1,
            "totalAmount": 3
        },
        "crm.quotes": {
            "quoteId": 1,
            "samples": 3,
            "totalAmount": 3
        }
    },
    "alias": "",
    "createdAt": "2026-01-28T08:25:34.931Z",
    "modifiedAt": "2026-02-14T03:17:50.848Z"
}
```

---

### CREATE

Tạo người dùng mới. **Chỉ Admin hoặc SuperAdmin** được phép.

**Endpoint**: `POST /v2/identities/create`

**Content-Type**: `application/json`

**Request Body**:

| Field            | Type     | Required | Description                                |
| ---------------- | -------- | -------- | ------------------------------------------ |
| `identityName`   | string   | Yes      | Tên đầy đủ                                 |
| `email`          | string   | Yes      | Email (unique)                             |
| `password`       | string   | Yes      | Mật khẩu (sẽ được hash)                    |
| `identityPhone`  | string   | No       | Số điện thoại                              |
| `roles`          | string[] | No       | Danh sách role codes                       |
| `identityStatus` | string   | No       | `active`, `inactive` (default: `inactive`) |

**Example Request**:

```json
{
    "identityName": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "password": "SecurePassword123!",
    "identityPhone": "0123456789",
    "roles": ["ROLE_TECHNICIAN"],
    "identityStatus": "active"
}
```

**Example Response**:

```json
{
    "identityId": "USR260214001",
    "identityName": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "identityPhone": "0123456789",
    "identityStatus": "active",
    "roles": ["ROLE_TECHNICIAN"],
    "identityPolicies": {
        "POL_TEST_EXECUTE": "ALLOW",
        "POL_SAMPLE_VIEW_BASIC": "ALLOW"
    },
    "permissions": {
        "lab.analysis": {
            "resultValue": 3,
            "resultUnit": 3,
            "technicianId": 3
        }
    },
    "createdAt": "2026-02-14T03:20:00.000Z",
    "createdById": "IDx3ea18"
}
```

**Role Restrictions**:

- **SuperAdmin**: Có thể gán tất cả roles
- **Admin**: Không được gán `ROLE_ADMIN`, `ROLE_DIRECTOR`, `ROLE_SUPER_ADMIN`
- **Others**: Không được tạo user

**Auto-Resolution**:

- Khi gán roles, hệ thống tự động resolve policies và permissions tương ứng

---

### UPDATE

Cập nhật thông tin người dùng.

**Endpoint**: `POST /v2/identities/update`

**Content-Type**: `application/json`

**Request Body**:

| Field                  | Type     | Required | Description                       |
| ---------------------- | -------- | -------- | --------------------------------- |
| `identityId` hoặc `id` | string   | Yes      | ID người dùng cần update          |
| `identityName`         | string   | No       | Tên mới                           |
| `email`                | string   | No       | Email mới                         |
| `password`             | string   | No       | Mật khẩu mới (sẽ được hash)       |
| `identityPhone`        | string   | No       | Số điện thoại mới                 |
| `identityStatus`       | string   | No       | Trạng thái mới                    |
| `roles`                | string[] | No       | Roles mới (auto-resolve policies) |

**Example Request**:

```json
{
    "identityId": "USR260214001",
    "identityName": "Nguyễn Văn A (Updated)",
    "identityPhone": "0987654321",
    "identityStatus": "active"
}
```

**Example Response**:

```json
{
    "identityId": "USR260214001",
    "identityName": "Nguyễn Văn A (Updated)",
    "identityPhone": "0987654321",
    "identityStatus": "active",
    "modifiedAt": "2026-02-14T03:25:00.000Z",
    "modifiedById": "IDx3ea18"
}
```

**Restrictions**:

- Không được update quyền hạn của chính mình
- Admin không được gán admin roles cho người khác
- Password luôn được hash tự động

---

### DELETE

Xóa mềm người dùng (soft delete).

**Endpoint**: `POST /v2/identities/delete`

**Content-Type**: `application/json`

**Request Body**:

```json
{
    "identityId": "USR260214001"
}
```

**Example Response**:

```json
{
    "success": true,
    "id": "USR260214001",
    "status": "Deleted"
}
```

**Note**: Record vẫn tồn tại trong DB với `deletedAt` được set.

---

### ADD ROLE

Thêm role cho người dùng.

**Endpoint**: `POST /v2/identities/update/add-role`

**Content-Type**: `application/json`

**Request Body**:

```json
{
    "identityId": "USR260214001",
    "roleCode": "ROLE_VALIDATOR"
}
```

**Example Response**:

```json
{
    "identityId": "USR260214001",
    "roles": ["ROLE_TECHNICIAN", "ROLE_VALIDATOR"],
    "identityPolicies": {
        "POL_TEST_EXECUTE": "ALLOW",
        "POL_TEST_REVIEW": "ALLOW",
        "POL_TEST_APPROVE": "ALLOW"
    },
    "modifiedAt": "2026-02-14T03:30:00.000Z"
}
```

**Auto-Resolution**:

- Tự động resolve policies từ role mới
- Set tất cả policies của role → `ALLOW`

---

### REMOVE ROLE

Xóa role khỏi người dùng.

**Endpoint**: `POST /v2/identities/update/remove-role`

**Content-Type**: `application/json`

**Request Body**:

```json
{
    "identityId": "USR260214001",
    "roleCode": "ROLE_VALIDATOR"
}
```

**Example Response**:

```json
{
    "identityId": "USR260214001",
    "roles": ["ROLE_TECHNICIAN"],
    "identityPolicies": {
        "POL_TEST_EXECUTE": "ALLOW",
        "POL_TEST_REVIEW": "DENY",
        "POL_TEST_APPROVE": "DENY"
    },
    "modifiedAt": "2026-02-14T03:35:00.000Z"
}
```

**Auto-Resolution**:

- Policies của role bị xóa → Set `DENY`

---

### UPDATE POLICY

Cập nhật policy cụ thể cho người dùng.

**Endpoint**: `POST /v2/identities/update/update-policy`

**Content-Type**: `application/json`

**Request Body**:

```json
{
    "identityId": "USR260214001",
    "policyCode": "POL_SAMPLE_VIEW_BASIC",
    "status": "LIMIT"
}
```

**Status Values**:

- `ALLOW`: Cho phép đầy đủ
- `DENY`: Từ chối
- `LIMIT`: Giới hạn (chỉ dữ liệu của mình)

**Example Response**:

```json
{
    "identityId": "USR260214001",
    "identityPolicies": {
        "POL_TEST_EXECUTE": "ALLOW",
        "POL_SAMPLE_VIEW_BASIC": "LIMIT"
    },
    "permissions": {
        "lab.sample": {
            "sampleId": 0.5,
            "sampleName": 0.5,
            "status": 0.5
        }
    },
    "modifiedAt": "2026-02-14T03:40:00.000Z"
}
```

**Auto-Resolution**:

- Khi set `LIMIT`, permissions tương ứng → Decimal (0.5, 2.5, 6.5)

---

---

## Identity Group Endpoints

Quản lý các nhóm người dùng theo vị trí, phòng ban (VD: Nhóm KTV, Nhóm Sales).

### GROUP: GET LIST

**Endpoint**: `GET /v2/identity-groups/get/list`

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| `page`    | int    | Trang hiện tại            |
| `search`  | string | Tìm kiếm theo ID/Tên nhóm |

---

### GROUP: GET DETAIL/FULL

**Endpoint**:

- `GET /v2/identity-groups/get/detail?id=...` (Thông tin cơ bản)
- `GET /v2/identity-groups/get/full?id=...` (Thông tin kèm chi tiết thành viên)

---

### GROUP: CREATE

**Endpoint**: `POST /v2/identity-groups/create`

**Request Body**:

```json
{
    "identityGroupId": "GRP_KTV_MICRO",
    "identityGroupName": "Nhóm KTV Vi sinh",
    "identityGroupMainRole": "ROLE_TECHNICIAN",
    "identityGroupAlias": "KTV Vi sinh",
    "identityGroupInChargeId": "USR260301001",
    "identityGroupDescription": "Nhóm thực hiện các chỉ tiêu vi sinh"
}
```

---

### GROUP: UPDATE

**Endpoint**: `POST /v2/identity-groups/update`

**Request Body**:

- `id` hoặc `identityGroupId`: Bắt buộc.
- `syncMembers`: (boolean) Nếu `true`, sẽ đẩy cấu hình Role/Alias xuống cho tất cả thành viên.

---

### GROUP: SYNC

**Endpoint**: `POST /v2/identity-groups/sync/:id`

**Mô tả**: Quét lại toàn bộ User trong hệ thống để cập nhật danh sách `identityIds` cho nhóm (Dựa trên tình trạng Roles và Active status thực tế).

---

### GROUP: DELETE

**Endpoint**: `POST /v2/identity-groups/delete`

---

## Data Models

### Identity Object

| Field              | Type      | Description                                       |
| ------------------ | --------- | ------------------------------------------------- |
| `identityId`       | string    | ID người dùng (PK)                                |
| `identityName`     | string    | Tên đầy đủ                                        |
| `email`            | string    | Email (unique)                                    |
| `identityPhone`    | string    | Số điện thoại                                     |
| `identityNID`      | string    | Số CMND/CCCD                                      |
| `identityAddress`  | string    | Địa chỉ                                           |
| `password`         | string    | Mật khẩu (hash) - **Không trả về trong response** |
| `identityStatus`   | string    | `active`, `inactive`, `banned`                    |
| `roles`            | string[]  | Danh sách role codes                              |
| `identityPolicies` | object    | Override policies                                 |
| `permissions`      | object    | Resolved permissions                              |
| `alias`            | string    | Tên hiển thị ngắn                                 |
| `createdAt`        | timestamp | Thời điểm tạo                                     |
| `createdById`      | string    | ID người tạo                                      |
| `modifiedAt`       | timestamp | Thời điểm cập nhật                                |
| `modifiedById`     | string    | ID người cập nhật                                 |
| `deletedAt`        | timestamp | Thời điểm xóa (NULL nếu chưa xóa)                 |

### IdentityGroup Object

| Field                      | Type      | Description                                            |
| -------------------------- | --------- | ------------------------------------------------------ |
| `identityGroupId`          | string    | ID nhóm (PK)                                           |
| `identityGroupName`        | string    | Tên nhóm hiển thị                                      |
| `identityGroupMainRole`    | string    | Role chính mặc định của nhóm                           |
| `identityGroupAlias`       | string    | Bí danh đại diện (kế thừa cho member)                  |
| `identityGroupInChargeId`  | string    | ID người phụ trách nhóm (FK identities)                |
| `identityIds`              | string[]  | Danh sách ID các thành viên hợp lệ (Auto-sync)         |
| `identityGroupDescription` | string    | Mô tả nhóm                                             |
| `createdAt`                | timestamp | Thời điểm tạo                                          |
| `members`                  | object[]  | (Chỉ khi gọi `full`) Chi tiết thông tin các thành viên |

### Permission Object Structure

```json
{
  "table.name": {
    "columnName": <bitmask>
  }
}
```

**Example**:

```json
{
    "crm.orders": {
        "orderId": 7,
        "clientId": 7,
        "totalAmount": 3
    },
    "lab.sample": {
        "sampleId": 0.5,
        "status": 0.5
    }
}
```

---

## Permission System

### Bitmask Values

| Bitmask | Permission   | Description              |
| ------- | ------------ | ------------------------ |
| `0`     | NONE         | Không có quyền           |
| `1`     | READ         | Đọc toàn bộ              |
| `3`     | READ + WRITE | Đọc + Ghi                |
| `7`     | FULL         | Đọc + Ghi + Xóa          |
| `0.5`   | READ_OWN     | Chỉ đọc dữ liệu của mình |
| `2.5`   | WRITE_OWN    | Chỉ ghi dữ liệu của mình |
| `6.5`   | DELETE_OWN   | Chỉ xóa dữ liệu của mình |

### Ownership Fields

Hệ thống check các field sau để xác định ownership:

- `technicianId`
- `technicianIds` (array)
- `salePersonId`
- `createdById`
- `reviewedById`

### Permission Resolution Flow

```
Roles → Policies → Permissions
```

1. **Roles**: Danh sách role codes (VD: `["ROLE_TECHNICIAN"]`)
2. **Policies**: Resolve từ roles (VD: `{"POL_TEST_EXECUTE": "ALLOW"}`)
3. **Permissions**: Resolve từ policies (VD: `{"lab.analysis": {"resultValue": 3}}`)

### Policy Status

| Status  | Effect        | Permission Bitmask      |
| ------- | ------------- | ----------------------- |
| `ALLOW` | Full access   | Integer (1, 3, 7)       |
| `DENY`  | No access     | 0                       |
| `LIMIT` | Own data only | Decimal (0.5, 2.5, 6.5) |

---

## Error Codes

| HTTP Status | Error Code | Message                                       | Description                                    |
| ----------- | ---------- | --------------------------------------------- | ---------------------------------------------- |
| 400         | 400        | Missing identityId in query params            | Thiếu ID trong request                         |
| 400         | 400        | Missing identityId in body                    | Thiếu ID trong body                            |
| 400         | 400        | roleCode required in body                     | Thiếu role code                                |
| 400         | 400        | policyCode and status required                | Thiếu policy code hoặc status                  |
| 400         | 400        | Invalid status                                | Status không hợp lệ (phải là ALLOW/DENY/LIMIT) |
| 401         | 401        | Auth token required                           | Thiếu hoặc sai token                           |
| 403         | 403        | Chỉ admin hoặc superAdmin được tạo người dùng | Không có quyền tạo user                        |
| 403         | 403        | Không được gán ROLE_SUPER_ADMIN               | Không có quyền gán role cao                    |
| 403         | 403        | Admin không được gán role Admin/Giám đốc      | Admin không được gán admin roles               |
| 403         | 403        | Không được update quyền hạn của chính mình    | Tự update quyền của mình                       |
| 403         | 403        | Không có quyền update quyền hạn               | Không có quyền sửa permissions                 |
| 404         | 404        | Identity not found                            | Không tìm thấy người dùng                      |
| 409         | 409        | Email hoặc username đã tồn tại                | Duplicate email/username                       |

---

## Notes

1. **Password Security**:
    - Tất cả passwords được hash bằng bcrypt với salt rounds = 12
    - Password **không bao giờ** được trả về trong response

2. **Auto-Resolution**:
    - Khi thêm/xóa roles → Tự động resolve policies
    - Khi update policies → Tự động resolve permissions
    - Khi set policy = `LIMIT` → Permissions → Decimal

3. **Search**:
    - Tìm kiếm theo `identityId`, `identityName`, `email`
    - Sử dụng `ILIKE` (case-insensitive)

4. **Pagination**:
    - Default `itemsPerPage = 20`
    - Max không giới hạn (cân nhắc performance)

5. **Permissions**:
    - Tất cả endpoints yêu cầu quyền `READ`/`WRITE`/`DELETE` trên bảng `identity.identities`
    - SuperAdmin có full access
    - Admin có limited access (không được quản lý admin roles)

6. **Cache**:
    - Identity data được cache trong Valkey
    - Cache tự động invalidate khi update/delete

---

**End of Documentation**
