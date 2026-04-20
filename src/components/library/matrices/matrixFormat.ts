import type { ApiNumber, MatrixPatch } from "@/api/library";

export function toNumber(value: ApiNumber | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;

    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export function safeText(value: string | null | undefined): string {
    return value ?? "";
}

export function formatNumberVi(value: ApiNumber | null | undefined): string | null {
    const n = toNumber(value);
    if (n === null) return null;
    return n.toLocaleString("vi-VN");
}

export function toFormNumberString(value: ApiNumber | null | undefined): string {
    const n = toNumber(value);
    return n === null ? "" : String(n);
}

export function buildMatrixPatchFromForm(form: {
    parameterName: string;
    protocolCode: string;
    protocolSource: string;
    sampleTypeName: string;

    feeBeforeTax: string;
    taxRate: string;
    feeAfterTax: string;

    turnaroundTime: string;
    methodLOD: string;
    methodLOQ: string;
    thresholdLimit: string;
}): MatrixPatch {
    const feeBeforeTax = Number(form.feeBeforeTax);
    const feeAfterTax = Number(form.feeAfterTax);
    const taxRate = Number(form.taxRate);

    return {
        feeBeforeTax: Number.isFinite(feeBeforeTax) ? feeBeforeTax : undefined,
        feeAfterTax: Number.isFinite(feeAfterTax) ? feeAfterTax : undefined,
        taxRate: Number.isFinite(taxRate) ? taxRate : undefined,

        turnaroundTime: form.turnaroundTime.trim().length ? Number(form.turnaroundTime) : null,

        methodLOD: form.methodLOD.trim().length ? form.methodLOD.trim() : null,
        methodLOQ: form.methodLOQ.trim().length ? form.methodLOQ.trim() : null,
        thresholdLimit: form.thresholdLimit.trim().length ? form.thresholdLimit.trim() : null,

        parameterName: form.parameterName.trim().length ? form.parameterName.trim() : null,
        protocolCode: form.protocolCode.trim().length ? form.protocolCode.trim() : null,
        protocolSource: form.protocolSource.trim().length ? form.protocolSource.trim() : null,
        sampleTypeName: form.sampleTypeName.trim().length ? form.sampleTypeName.trim() : null,
    };
}
