# API Documentation (LIMS Internal)

## Overview

This document outlines the API endpoints used in the LIMS Internal Lab Operation Platform (Frontend).

### Standard Response Format

All responses strictly follow this JSON structure:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },     // Business Data (Object or Array)
  "meta": {            // Metadata (Pagination, etc.) - Optional
    "page": 1,
    "itemsPerPage": 10,
    "total": 100,
    "totalPages": 10
  },
  "error": null        // Error object if success is false
}
```

### Common Query Parameters (For List APIs)

For any endpoint ending in `/get/list`, the following standard query parameters apply:

| Parameter      | Type     | Default | Description                                     |
| :------------- | :------- | :------ | :---------------------------------------------- |
| `page`         | `number` | `1`     | The page number to retrieve (1-indexed).        |
| `itemsPerPage` | `number` | `10`    | Number of items per page.                       |
| `sortBy`       | `string` | `null`  | Field to sort by (e.g., `createdAt:desc`).      |
| `search`       | `string` | `null`  | General search keyword (matches name, code...). |

---

## 1. Authentication

### **POST /v1/auth/login**

- **Description**: Login to the system.
- **Input**: `{ "username": "...", "password": "..." }`
- **Output**: Auth token and Identity profile.

### **POST /v1/auth/check-status**

- **Description**: Check validity of current session.

---

## 2. Reception Management (`/v1/receipt`)

_Managed in `reception.ts`_

(Pending specific endpoint definitions)

---

## 3. Lab Management (`/v1/lab`)

_Managed in `lab.ts`_

(Pending specific endpoint definitions for Samples, Analyses, Equipment)
