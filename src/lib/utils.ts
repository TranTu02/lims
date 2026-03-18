import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_PRIORITY: Record<string, number> = {
    Cancelled: 10,
    Complained: 9,
    ReTest: 8,
    Approved: 7,
    TechReview: 6,
    DataEntered: 5,
    Testing: 4,
    HandedOver: 3,
    Ready: 2,
    Pending: 1,
};

export function getTopAnalysisMarks(marks?: string[] | null): string[] {
    if (!marks || !Array.isArray(marks)) return [];
    
    const result: string[] = [];
    
    if (marks.includes("Fast")) result.push("Fast");
    if (marks.includes("EX")) result.push("EX");
    
    const others = marks.filter(m => m !== "Fast" && m !== "EX" && m in STATUS_PRIORITY);
    others.sort((a, b) => STATUS_PRIORITY[b] - STATUS_PRIORITY[a]);
    
    result.push(...others.slice(0, 2));
    
    return result;
}