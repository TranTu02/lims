export function toStr(v: unknown): string {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }
  
  export function getProp(obj: unknown, key: string): unknown {
    if (obj && typeof obj === "object") {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }
  
  export function getStr(obj: unknown, key: string): string {
    return toStr(getProp(obj, key));
  }
  