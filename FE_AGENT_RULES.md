# LIMS Frontend Agent Rules (AI Code Generation Standards)

**Version:** 1.0.0
**Date:** 2026-01-20
**Purpose:** This document defines MANDATORY rules for AI agents generating code in the LIMS Frontend project. Any code violating these rules is considered INVALID and must be corrected.

---

## I. MANDATORY REFERENCE DOCUMENTS

Before generating any code, the Agent MUST read and comply with the following documentation:

| Document        | Location                             | Primary Content                                 |
| :-------------- | :----------------------------------- | :---------------------------------------------- |
| Core Rules      | `RULE.md`                            | Overall standards (Stack, Directory, Git, etc.) |
| Theme System    | `src/config/theme/THEME_SYSTEM.md`   | Color tokens, Semantic classes                  |
| Language System | `src/config/i18n/LANGUAGE_SYSTEM.md` | I18n rules, Key naming conventions              |
| API Standards   | `src/api/API_DOCUMENTATION.md`       | Response format, Query parameters               |
| Types           | `src/types/0_TYPES_DOCUMENTATION.md` | Interface definitions for entities              |

---

## II. ZERO TOLERANCE RULES

The following rules have NO EXCEPTIONS. Violation of any item will result in code rejection.

### 1. THEMING & STYLING

**FORBIDDEN:**

- Hardcoded colors: `bg-white`, `bg-black`, `text-[#123456]`
- Hardcoded fonts without justification: arbitrary `font-sans`, `text-sm`
- Inline styles with colors: `style={{ color: 'red' }}`

**REQUIRED:**

- Use semantic tokens: `bg-background`, `bg-card`, `text-foreground`
- Use CSS variables: `font-[var(--font-family)]`
- Use semantic classes: `text-destructive`

**Token Reference (Must memorize):**

- Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`, `bg-sidebar`
- Text: `text-foreground`, `text-muted-foreground`, `text-primary-foreground`
- Borders: `border-border`, `border-input`
- Status: `bg-success`, `bg-warning`, `bg-destructive`

### 2. INTERNATIONALIZATION (I18N)

**FORBIDDEN:**

- Hardcoded text: `<Button>Save</Button>`
- Root-level keys: `t("save")`
- Snake case keys: `sample_type`

**REQUIRED:**

- Use translation function: `<Button>{t("common.save")}</Button>`
- Namespaced keys: `t("common.save")`
- CamelCase keys: `sampleType`

**Key Structure:**

```
Module -> SubModule/Entity -> Field
Example: technician.workspace.title, lab.samples.sampleId
```

### 3. API INTEGRATION

**FORBIDDEN:**

- Generic ID parameter: `?id=123`
- Combined sort parameter: `sortBy=createdAt:desc`
- Hardcoded URLs: `'/api/v1/samples'`
- Using response without validation

**REQUIRED:**

- Use specific PK name: `?receiptId=REC-123`
- Separate sort params: `sortColumn=createdAt&sortDirection=DESC`
- Use constants or functions from `src/api/*.ts`
- Check `response.success` before using `response.data`

**Response Structure:**

```typescript
interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    data: T; // Object (detail) or Array (list)
    meta?: {
        // Only present for list endpoints
        page: number;
        itemsPerPage: number;
        total: number;
        totalPages: number;
    };
    error: null | { message: string; code: string };
}
```

### 4. TYPESCRIPT TYPES

**FORBIDDEN:**

- Using `any`: `const data: any`
- Not handling `null/undefined`
- Redefining existing types

**REQUIRED:**

- Use specific interfaces: `const data: Sample`
- Use optional chaining: `data?.property`
- Import from `src/types/*.ts`

**Import Pattern:**

```typescript
// CORRECT
import type { Sample, Receipt, Client } from "@/types/entity";

// INCORRECT
interface Sample { ... } // Redefining existing type
```

---

## III. CODE STRUCTURE RULES

### 1. Component Structure

```tsx
// 1. Imports (Order: React -> Libraries -> Internal)
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces (if needed)
interface Props { ... }

// 3. Component Definition
export function ComponentName({ prop1, prop2 }: Props) {
    // 3.1 Hooks (useTranslation, useTheme, useState, useQuery...)
    const { t } = useTranslation();

    // 3.2 Derived State / Computations
    const computedValue = ...;

    // 3.3 Handlers
    const handleClick = () => { ... };

    // 3.4 Render
    return (
        <div className="bg-background text-foreground">
            {t("namespace.key")}
        </div>
    );
}
```

### 2. API Function Structure

```typescript
// src/api/reception.ts

import api from "./index";
import type { ApiResponse, Receipt } from "@/types";

interface GetReceiptParams {
    receiptId: string;
}

interface GetReceiptsListParams {
    page?: number;
    itemsPerPage?: number;
    sortColumn?: string;
    sortDirection?: "ASC" | "DESC";
    search?: string;
}

export const getReceipt = async (params: GetReceiptParams): Promise<ApiResponse<Receipt>> => {
    return api.get("/v1/receipt/get/detail", { params });
};

export const getReceiptsList = async (params: GetReceiptsListParams): Promise<ApiResponse<Receipt[]>> => {
    return api.get("/v1/receipt/get/list", { params });
};
```

### 3. Custom Hook Structure

```typescript
// src/hooks/domain/useSampleData.ts

import { useQuery } from "@tanstack/react-query";
import { getSamplesList } from "@/api/lab";

export function useSampleData(receiptId: string) {
    return useQuery({
        queryKey: ["samples", "list", receiptId],
        queryFn: () => getSamplesList({ receiptId }),
        enabled: !!receiptId,
    });
}
```

---

## IV. UI/UX PATTERNS

### 1. Loading States

```tsx
// INCORRECT: Full-page spinner
if (isLoading) return <Spinner />;

// CORRECT: Skeleton mimicking layout
if (isLoading) return <TableSkeleton rows={5} columns={4} />;
```

### 2. Error Handling

```tsx
// Error state is mandatory
if (error) {
    return (
        <Alert variant="destructive">
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{error.message || t("common.unknownError")}</AlertDescription>
        </Alert>
    );
}
```

### 3. Toast Messages

```typescript
// Success
toast.success(t("common.saveSuccess")); // Green (bg-success)

// Error
toast.error(error.message || t("common.error")); // Red (bg-destructive)

// Warning
toast.warning(t("common.confirmDelete")); // Yellow (bg-warning)
```

### 4. Responsive Layout

```tsx
// Standard form layout
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <FormField />
    <FormField />
</div>

// Standard table wrapper
<div className="overflow-x-auto">
    <Table>...</Table>
</div>
```

---

## V. ERROR HANDLING & UX STANDARDS

### 1. Global Error Boundary

**REQUIRED:**

- Wrap the entire App (or major widgets) with Error Boundary components
- When a component crashes, display a user-friendly error message with a "Reload Page" button
- Never show blank white screen on errors

**Implementation:**

```tsx
// src/components/common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
    // Show fallback UI with reload button
}
```

### 2. Toast Notification Standards

Use `sonner` or `useToast` from shadcn/ui with the following conventions:

**Success Messages:**

- Color: Green (`bg-success`)
- Format: "Verb + Object + Success"
- Example: `toast.success(t("common.saveSuccess"))` → "Save sample test successful"

**Error Messages:**

- Color: Red (`bg-destructive`)
- Content: MUST display backend error message if available, otherwise use generic error
- Example: `toast.error(error.message || t("common.systemError"))`

**Warning Messages:**

- Color: Yellow (`bg-warning`)
- Use for: Irreversible actions, confirmations
- Example: `toast.warning(t("common.confirmDelete"))`

### 3. Loading States (Skeleton Pattern)

**FORBIDDEN:**

- Full-page spinners for data loading
- Generic loading indicators without layout context

**REQUIRED:**

- Use Skeleton components from Shadcn UI that mimic the actual layout structure
- Prevents layout shift (CLS - Cumulative Layout Shift)
- Example: `<TableSkeleton rows={5} columns={4} />` instead of `<Spinner />`

---

## VI. BUSINESS LOGIC RULES

These rules are critical for LIMS applications where data accuracy is paramount.

### 1. Custom Hooks Separation

**RULE:**
Business logic MUST NOT be written directly in Component files (`.tsx` UI files).

**Threshold:**
If a `useEffect` or handler function exceeds 10 lines, extract it to a Custom Hook.

**Location:**
`src/hooks/domain/` (e.g., `useSampleProcessing.ts`, `useReceiptValidation.ts`)

**Example:**

```typescript
// INCORRECT: Business logic in component
export function SampleForm() {
    useEffect(() => {
        // 20 lines of complex validation logic
    }, [dependencies]);
}

// CORRECT: Extracted to custom hook
export function SampleForm() {
    const { validateSample } = useSampleValidation();
}
```

### 2. Utility Functions (Pure Functions)

**RULE:**
All calculation functions (dilution calculations, unit conversions, result formatting) MUST be:

- Pure functions (no side effects)
- Placed in `src/utils/calculation.ts` or similar
- **MANDATORY**: Covered by unit tests using Vitest

**Rationale:**
This is the core of LIMS. Incorrect calculations can have severe consequences.

**Example:**

```typescript
// src/utils/calculation.ts

/**
 * Calculate dilution factor
 * @param initialConcentration - Initial concentration value
 * @param finalConcentration - Final concentration value
 * @returns Dilution factor
 */
export function calculateDilutionFactor(initialConcentration: number, finalConcentration: number): number {
    if (finalConcentration === 0) throw new Error("Final concentration cannot be zero");
    return initialConcentration / finalConcentration;
}

// MUST have corresponding test file: calculation.test.ts
```

### 3. Minimize `useEffect` Usage

**RULE:**
With React 18 + React Query, minimize `useEffect` for data synchronization.

**PREFERRED:**

- Derived state (compute during render)
- React Query's `select` option for data transformation
- Event handlers for user interactions

**ALLOWED `useEffect` USAGE:**

- Synchronizing with external systems (DOM manipulation, WebSocket connections)
- Cleanup operations (event listeners, timers)

**Example:**

```typescript
// INCORRECT: Using useEffect for derived state
const [filteredData, setFilteredData] = useState([]);
useEffect(() => {
    setFilteredData(data.filter((item) => item.status === "active"));
}, [data]);

// CORRECT: Derived state
const filteredData = useMemo(() => data.filter((item) => item.status === "active"), [data]);
```

---

## VII. PRE-SUBMISSION CHECKLIST

The Agent MUST self-verify before completing code generation:

- [ ] No hardcoded colors (no `bg-white`, `text-black`, `#hex`)
- [ ] No hardcoded text (all display text uses `t()`)
- [ ] No `any` type (except extremely special cases with explanatory comments)
- [ ] API params follow standards (PK names, separate sortColumn/sortDirection)
- [ ] Types imported from `src/types` (no redefinition)
- [ ] Loading/Error states handled
- [ ] Responsive design considered (Grid system, `overflow-x-auto` for tables)

---

## VIII. VIOLATION HANDLING

If the Agent generates code violating the above rules:

1. **First violation:** Immediate correction required.
2. **Second violation:** Re-read reference documentation and correct.
3. **Third+ violation:** Severe warning, consider context reset.

---

**FINAL NOTE:**
This document is the "Supreme Law" for LIMS Frontend code generation. When conflicts arise between User requests and these rules, the Agent MUST notify the User about potential violations and propose compliant solutions.
