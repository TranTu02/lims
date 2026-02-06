import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "--";
  const s = typeof value === "string" ? value.trim() : String(value);
  return s.length === 0 ? "--" : s;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;

    const normalized = s.replace(/,/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

export function formatCurrency(value: unknown): string {
  const n = toNumber(value);
  if (n === null) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(value: unknown, options?: { digits?: number }): string {
  const n = toNumber(value);
  if (n === null) return "--";
  const digits = options?.digits ?? 0;
  return `${n.toFixed(digits)}%`;
}

export function formatDate(date: unknown): string {
  if (date === null || date === undefined) return "--";
  try {
    const d = date instanceof Date ? date : new Date(String(date));
    if (Number.isNaN(d.getTime())) return "--";
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return "--";
  }
}

export function formatDateTime(date: unknown): string {
  if (date === null || date === undefined) return "--";
  try {
    const d = date instanceof Date ? date : new Date(String(date));
    if (Number.isNaN(d.getTime())) return "--";
    return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return "--";
  }
}
