import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    Check, X, FileSpreadsheet, Download, Grid, ArrowRight,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, Merge, Split,
    PaintBucket
} from "lucide-react";
import * as XLSX from "xlsx";
import { HyperFormula } from "hyperformula";

interface ExcelProcessorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialFile?: File | null;
    onImportHtml: (html: string) => void;
}

interface MergedRange {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    key: string;
}

interface CellStyle {
    bold?: boolean;
    italic?: boolean;
    align?: "left" | "center" | "right";
    border?: "all" | "none" | "bottom";
    bgColor?: string;
}

// Convert column index to Excel letter representation (0 -> A, 1 -> B, ..., 26 -> AA)
function colIndexToLabel(index: number): string {
    let label = "";
    let temp = index;
    while (temp >= 0) {
        label = String.fromCharCode((temp % 26) + 65) + label;
        temp = Math.floor(temp / 26) - 1;
    }
    return label;
}

// Convert Excel letter representation to column index (A -> 0, B -> 1)
function labelToColIndex(label: string): number {
    let col = 0;
    const cleanLabel = label.toUpperCase();
    for (let i = 0; i < cleanLabel.length; i++) {
        col = col * 26 + (cleanLabel.charCodeAt(i) - 64);
    }
    return col - 1;
}

// Parse range string A1:C10 into { startRow, startCol, endRow, endCol }
function parseRangeStr(rangeStr: string): { startRow: number; startCol: number; endRow: number; endCol: number } | null {
    try {
        const parts = rangeStr.split(":");
        if (parts.length !== 2) return null;
        
        const startMatch = parts[0].match(/^([A-Z]+)([0-9]+)$/i);
        const endMatch = parts[1].match(/^([A-Z]+)([0-9]+)$/i);
        
        if (!startMatch || !endMatch) return null;
        
        return {
            startCol: labelToColIndex(startMatch[1]),
            startRow: parseInt(startMatch[2]) - 1,
            endCol: labelToColIndex(endMatch[1]),
            endRow: parseInt(endMatch[2]) - 1
        };
    } catch (e) {
        return null;
    }
}

export function ExcelProcessorModal({ open, onOpenChange, initialFile, onImportHtml }: ExcelProcessorModalProps) {
    const [fileName, setFileName] = useState<string>("");
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState<string>("");
    
    // Grid size state
    const [rowCount, setRowCount] = useState<number>(30);
    const [colCount, setColCount] = useState<number>(15);
    
    // HyperFormula state
    const hfInstance = useRef<HyperFormula | null>(null);
    const sheetIdsMap = useRef<Record<string, number>>({});
    
    // Cells values and formulas
    // sheetInputs stores the raw text/formula (e.g. '=A1+B1' or '10')
    const [sheetInputs, setSheetInputs] = useState<string[][]>([]);
    // sheetValues stores computed outputs from hyperformula
    const [sheetValues, setSheetValues] = useState<any[][]>([]);
    
    // Grid interaction states
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [rangeStart, setRangeStart] = useState<{ row: number; col: number } | null>(null);
    const [rangeEnd, setRangeEnd] = useState<{ row: number; col: number } | null>(null);
    
    // Edit values input
    const [formulaBarText, setFormulaBarText] = useState<string>("");
    const editInputRef = useRef<HTMLInputElement>(null);
    const formulaInputRef = useRef<HTMLInputElement>(null);
    const [rangeInput, setRangeInput] = useState<string>("");

    // Merged ranges and cell styles states
    const [mergedRanges, setMergedRanges] = useState<MergedRange[]>([]);
    const [cellStyles, setCellStyles] = useState<Record<string, CellStyle>>({});

    // Helper: check if cell is merged and return rowspan/colspan
    const getCellMergeInfo = useCallback((r: number, c: number) => {
        for (const range of mergedRanges) {
            if (r >= range.startRow && r <= range.endRow && c >= range.startCol && c <= range.endCol) {
                const isTopLeft = r === range.startRow && c === range.startCol;
                return {
                    isMerged: true,
                    isTopLeft,
                    rowSpan: range.endRow - range.startRow + 1,
                    colSpan: range.endCol - range.startCol + 1,
                    range
                };
            }
        }
        return { isMerged: false, isTopLeft: true, rowSpan: 1, colSpan: 1, range: null };
    }, [mergedRanges]);

    // Apply formatting to selection
    const applyStyleToSelection = useCallback((styleUpdate: Partial<CellStyle>) => {
        let startR = selectedCell?.row ?? 0;
        let endR = selectedCell?.row ?? 0;
        let startC = selectedCell?.col ?? 0;
        let endC = selectedCell?.col ?? 0;
        
        if (rangeStart && rangeEnd) {
            startR = Math.min(rangeStart.row, rangeEnd.row);
            endR = Math.max(rangeStart.row, rangeEnd.row);
            startC = Math.min(rangeStart.col, rangeEnd.col);
            endC = Math.max(rangeStart.col, rangeEnd.col);
        } else if (!selectedCell) {
            toast.error("Vui lòng chọn ô hoặc vùng để định dạng");
            return;
        }
        
        const newStyles = { ...cellStyles };
        for (let r = startR; r <= endR; r++) {
            for (let c = startC; c <= endC; c++) {
                const key = `${r}_${c}`;
                newStyles[key] = {
                    ...(newStyles[key] || {}),
                    ...styleUpdate
                };
            }
        }
        setCellStyles(newStyles);
    }, [selectedCell, rangeStart, rangeEnd, cellStyles]);

    // Handle Merge Cells
    const handleMergeCells = useCallback(() => {
        if (!rangeStart || !rangeEnd) {
            toast.error("Vui lòng kéo chọn một vùng ô (hoặc Shift + click) để gộp");
            return;
        }
        const startRow = Math.min(rangeStart.row, rangeEnd.row);
        const endRow = Math.max(rangeStart.row, rangeEnd.row);
        const startCol = Math.min(rangeStart.col, rangeEnd.col);
        const endCol = Math.max(rangeStart.col, rangeEnd.col);
        
        if (startRow === endRow && startCol === endCol) {
            toast.error("Không thể gộp một ô đơn lẻ");
            return;
        }
        
        const key = `${colIndexToLabel(startCol)}${startRow + 1}:${colIndexToLabel(endCol)}${endRow + 1}`;
        const newRange: MergedRange = { startRow, endRow, startCol, endCol, key };
        
        // Remove overlapping merges
        const filteredRanges = mergedRanges.filter(r => {
            const overlaps = !(
                r.endRow < startRow ||
                r.startRow > endRow ||
                r.endCol < startCol ||
                r.startCol > endCol
            );
            return !overlaps;
        });
        
        setMergedRanges([...filteredRanges, newRange]);
        toast.success(`Đã gộp vùng ${key}`);
    }, [rangeStart, rangeEnd, mergedRanges]);

    // Handle Unmerge
    const handleUnmergeCells = useCallback(() => {
        if (!selectedCell) return;
        const { row, col } = selectedCell;
        const initialCount = mergedRanges.length;
        const filtered = mergedRanges.filter(r => {
            const inRange = row >= r.startRow && row <= r.endRow && col >= r.startCol && col <= r.endCol;
            return !inRange;
        });
        
        if (filtered.length < initialCount) {
            setMergedRanges(filtered);
            toast.success("Đã huỷ gộp ô thành công");
        } else {
            toast.error("Ô được chọn không nằm trong vùng gộp nào");
        }
    }, [selectedCell, mergedRanges]);
    
    useEffect(() => {
        const hf = HyperFormula.buildEmpty({
            licenseKey: "gpl-v3"
        });
        hfInstance.current = hf;
        
        return () => {
            if (hfInstance.current) {
                hfInstance.current.destroy();
            }
        };
    }, []);
    
    // Reset state
    const resetExcelState = () => {
        setSheetNames([]);
        setActiveSheet("");
        setSheetInputs([]);
        setSheetValues([]);
        setSelectedCell(null);
        setEditingCell(null);
        setRangeStart(null);
        setRangeEnd(null);
        setFormulaBarText("");
        setRangeInput("");
        setMergedRanges([]);
        setCellStyles({});
        sheetIdsMap.current = {};
        if (hfInstance.current) {
            hfInstance.current.destroy();
            hfInstance.current = HyperFormula.buildEmpty({
                licenseKey: "gpl-v3"
            });
        }
    };
    
    // Parse XLSX file
    const processExcelFile = useCallback(async (file: File) => {
        resetExcelState();
        setFileName(file.name);
        
        const loadingToast = toast.loading("Đang đọc file Excel...");
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { cellFormula: true, cellHTML: false, cellNF: false });
            
            if (workbook.SheetNames.length === 0) {
                throw new Error("File Excel không có sheet nào");
            }
            
            setSheetNames(workbook.SheetNames);
            const firstSheet = workbook.SheetNames[0];
            
            // Register sheets in HyperFormula
            workbook.SheetNames.forEach((name) => {
                if (hfInstance.current) {
                    hfInstance.current.addSheet(name);
                    const sheetId = hfInstance.current.getSheetId(name);
                    if (sheetId !== undefined) {
                        sheetIdsMap.current[name] = sheetId;
                    }
                }
            });
            
            // Load all sheets data into HyperFormula
            workbook.SheetNames.forEach((name) => {
                const ws = workbook.Sheets[name];
                const range = ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : { s: { r: 0, c: 0 }, e: { r: 19, c: 9 } };
                
                // Determine dimensions
                const maxRow = Math.max(range.e.r + 5, 30);
                const maxCol = Math.max(range.e.c + 5, 15);
                
                // Build values grid
                const matrix: string[][] = [];
                for (let r = 0; r <= maxRow; r++) {
                    const row: string[] = [];
                    for (let c = 0; c <= maxCol; c++) {
                        const cellRef = XLSX.utils.encode_cell({ r, c });
                        const cell = ws[cellRef];
                        if (cell) {
                            if (cell.f) {
                                // Add = if missing
                                row.push(cell.f.startsWith("=") ? cell.f : "=" + cell.f);
                            } else {
                                row.push(cell.v !== undefined && cell.v !== null ? String(cell.v) : "");
                            }
                        } else {
                            row.push("");
                        }
                    }
                    matrix.push(row);
                }
                
                const sheetId = sheetIdsMap.current[name];
                if (hfInstance.current && sheetId !== undefined) {
                    hfInstance.current.setSheetContent(sheetId, matrix);
                }
            });
            
            // Switch to the first sheet
            switchActiveSheet(firstSheet);
            toast.dismiss(loadingToast);
            toast.success("Tải file Excel thành công!");
        } catch (e: any) {
            console.error("Excel parse error:", e);
            toast.dismiss(loadingToast);
            toast.error("Lỗi khi đọc file Excel: " + e.message);
        }
    }, []);
    
    // Process initial file
    useEffect(() => {
        if (open && initialFile) {
            processExcelFile(initialFile);
        }
    }, [open, initialFile, processExcelFile]);
    
    // Switch sheets
    const switchActiveSheet = (name: string) => {
        setActiveSheet(name);
        setSelectedCell(null);
        setEditingCell(null);
        setRangeStart(null);
        setRangeEnd(null);
        setFormulaBarText("");
        setRangeInput("");
        
        const sheetId = sheetIdsMap.current[name];
        if (hfInstance.current && sheetId !== undefined) {
            const hf = hfInstance.current;
            const size = hf.getSheetDimensions(sheetId);
            
            const rows = Math.max(size.height, 30);
            const cols = Math.max(size.width, 15);
            setRowCount(rows);
            setColCount(cols);
            
            // Read inputs (formulas/values)
            const inputs: string[][] = [];
            for (let r = 0; r < rows; r++) {
                const row: string[] = [];
                for (let c = 0; c < cols; c++) {
                    const formula = hf.getCellFormula({ sheet: sheetId, row: r, col: c });
                    if (formula) {
                        row.push("=" + formula);
                    } else {
                        const cellValue = hf.getCellSerialized({ sheet: sheetId, row: r, col: c });
                        row.push(cellValue !== null && cellValue !== undefined ? String(cellValue) : "");
                    }
                }
                inputs.push(row);
            }
            setSheetInputs(inputs);
            
            // Read computed values
            const values = hf.getSheetValues(sheetId);
            setSheetValues(values);
        }
    };
    
    // Handle sheet content change (recalculate)
    const handleCellUpdate = (row: number, col: number, text: string) => {
        const sheetId = sheetIdsMap.current[activeSheet];
        if (hfInstance.current && sheetId !== undefined) {
            const hf = hfInstance.current;
            try {
                // Update cell in engine
                hf.setCellContents({ sheet: sheetId, row, col }, text);
                
                // Refresh grids
                const newValues = hf.getSheetValues(sheetId);
                setSheetValues(newValues);
                
                const newInputs = [...sheetInputs];
                newInputs[row][col] = text;
                setSheetInputs(newInputs);
                
                // Update formula bar text if this cell is currently selected
                if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                    setFormulaBarText(text);
                }
            } catch (err: any) {
                console.error("Formula error:", err);
                toast.error("Lỗi công thức: " + err.message);
            }
        }
    };
    
    const isMouseDownRef = useRef(false);

    // MouseDown handler on grid cell
    const handleCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        if (e.shiftKey && selectedCell) {
            isMouseDownRef.current = false;
            setRangeStart(selectedCell);
            setRangeEnd({ row: r, col: c });
            
            const startLabel = colIndexToLabel(Math.min(selectedCell.col, c)) + (Math.min(selectedCell.row, r) + 1);
            const endLabel = colIndexToLabel(Math.max(selectedCell.col, c)) + (Math.max(selectedCell.row, r) + 1);
            setRangeInput(`${startLabel}:${endLabel}`);
            setEditingCell(null);
        } else {
            isMouseDownRef.current = true;
            setRangeStart({ row: r, col: c });
            setRangeEnd({ row: r, col: c });
            setSelectedCell({ row: r, col: c });
            setRangeInput(colIndexToLabel(c) + (r + 1));
            setEditingCell(null);
        }
    };

    // MouseEnter handler on grid cell (for drag selecting)
    const handleCellMouseEnter = (r: number, c: number) => {
        if (isMouseDownRef.current && rangeStart) {
            setRangeEnd({ row: r, col: c });
            
            const startLabel = colIndexToLabel(Math.min(rangeStart.col, c)) + (Math.min(rangeStart.row, r) + 1);
            const endLabel = colIndexToLabel(Math.max(rangeStart.col, c)) + (Math.max(rangeStart.row, r) + 1);
            setRangeInput(`${startLabel}:${endLabel}`);
        }
    };

    // Global mouseup to stop drag selection and enter edit mode if clicked a single cell
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isMouseDownRef.current) {
                isMouseDownRef.current = false;
                
                if (rangeStart && rangeEnd && rangeStart.row === rangeEnd.row && rangeStart.col === rangeEnd.col) {
                    const r = rangeStart.row;
                    const c = rangeStart.col;
                    setEditingCell({ row: r, col: c });
                    const rawVal = sheetInputs[r]?.[c] || "";
                    setFormulaBarText(rawVal);
                    
                    setTimeout(() => {
                        if (editInputRef.current) {
                            editInputRef.current.focus();
                            editInputRef.current.select();
                        }
                    }, 50);
                }
            }
        };

        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, [rangeStart, rangeEnd, sheetInputs]);

    // Range text parsing
    const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRangeInput(val);
        const parsed = parseRangeStr(val);
        if (parsed) {
            setRangeStart({ row: parsed.startRow, col: parsed.startCol });
            setRangeEnd({ row: parsed.endRow, col: parsed.endCol });
            setSelectedCell({ row: parsed.startRow, col: parsed.startCol });
        }
    };
    
    // Detect key events in edit cell (with Shift key support for Enter/Tab navigation)
    const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCellUpdate(row, col, formulaBarText);
            setEditingCell(null);
            
            const nextRow = e.shiftKey ? row - 1 : row + 1;
            if (nextRow >= 0 && nextRow < rowCount) {
                setSelectedCell({ row: nextRow, col });
                setEditingCell({ row: nextRow, col });
                const nextVal = sheetInputs[nextRow]?.[col] || "";
                setFormulaBarText(nextVal);
                
                setTimeout(() => {
                    if (editInputRef.current) {
                        editInputRef.current.focus();
                        editInputRef.current.select();
                    }
                }, 50);
            }
        } else if (e.key === "Escape") {
            setEditingCell(null);
            setFormulaBarText(sheetInputs[row]?.[col] || "");
        } else if (e.key === "Tab") {
            e.preventDefault();
            handleCellUpdate(row, col, formulaBarText);
            setEditingCell(null);
            
            const nextCol = e.shiftKey ? col - 1 : col + 1;
            if (nextCol >= 0 && nextCol < colCount) {
                setSelectedCell({ row, col: nextCol });
                setEditingCell({ row: nextCol, col: nextCol });
                const nextVal = sheetInputs[row]?.[nextCol] || "";
                setFormulaBarText(nextVal);
                
                setTimeout(() => {
                    if (editInputRef.current) {
                        editInputRef.current.focus();
                        editInputRef.current.select();
                    }
                }, 50);
            }
        } else if (e.key === "ArrowRight") {
            const input = e.currentTarget;
            const valLength = input.value.length;
            if (input.selectionStart === valLength && input.selectionEnd === valLength) {
                e.preventDefault();
                handleCellUpdate(row, col, formulaBarText);
                setEditingCell(null);
                const nextCol = col + 1;
                if (nextCol < colCount) {
                    setSelectedCell({ row, col: nextCol });
                    setEditingCell({ row, col: nextCol });
                    const nextVal = sheetInputs[row]?.[nextCol] || "";
                    setFormulaBarText(nextVal);
                    setTimeout(() => {
                        if (editInputRef.current) {
                            editInputRef.current.focus();
                            editInputRef.current.select();
                        }
                    }, 50);
                }
            }
        } else if (e.key === "ArrowLeft") {
            const input = e.currentTarget;
            if (input.selectionStart === 0 && input.selectionEnd === 0) {
                e.preventDefault();
                handleCellUpdate(row, col, formulaBarText);
                setEditingCell(null);
                const nextCol = col - 1;
                if (nextCol >= 0) {
                    setSelectedCell({ row, col: nextCol });
                    setEditingCell({ row, col: nextCol });
                    const nextVal = sheetInputs[row]?.[nextCol] || "";
                    setFormulaBarText(nextVal);
                    setTimeout(() => {
                        if (editInputRef.current) {
                            editInputRef.current.focus();
                            editInputRef.current.select();
                        }
                    }, 50);
                }
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            handleCellUpdate(row, col, formulaBarText);
            setEditingCell(null);
            const nextRow = row - 1;
            if (nextRow >= 0) {
                setSelectedCell({ row: nextRow, col });
                setEditingCell({ row: nextRow, col });
                const nextVal = sheetInputs[nextRow]?.[col] || "";
                setFormulaBarText(nextVal);
                setTimeout(() => {
                    if (editInputRef.current) {
                        editInputRef.current.focus();
                        editInputRef.current.select();
                    }
                }, 50);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            handleCellUpdate(row, col, formulaBarText);
            setEditingCell(null);
            const nextRow = row + 1;
            if (nextRow < rowCount) {
                setSelectedCell({ row: nextRow, col });
                setEditingCell({ row: nextRow, col });
                const nextVal = sheetInputs[nextRow]?.[col] || "";
                setFormulaBarText(nextVal);
                setTimeout(() => {
                    if (editInputRef.current) {
                        editInputRef.current.focus();
                        editInputRef.current.select();
                    }
                }, 50);
            }
        }
    };
    
    // Detect key events on formulas bar
    const handleFormulaBarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && selectedCell) {
            handleCellUpdate(selectedCell.row, selectedCell.col, formulaBarText);
            if (formulaInputRef.current) formulaInputRef.current.blur();
        } else if (e.key === "Escape" && selectedCell) {
            setFormulaBarText(sheetInputs[selectedCell.row]?.[selectedCell.col] || "");
            if (formulaInputRef.current) formulaInputRef.current.blur();
        }
    };
    
    // File upload handler
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processExcelFile(file);
        }
    };
    
    // Determine cell className based on selection and type
    const getCellClassName = (r: number, c: number): string => {
        let classes = "border-r border-b px-2 py-1 select-none overflow-hidden text-ellipsis whitespace-nowrap text-xs font-mono relative ";
        
        // Align numbers to right, text to left
        const val = sheetValues[r]?.[c];
        if (typeof val === "number") {
            classes += "text-right ";
        } else {
            classes += "text-left ";
        }
        
        // Highlight logic
        const isEditing = editingCell?.row === r && editingCell?.col === c;
        if (isEditing) {
            return classes + "p-0 bg-background z-10 border border-primary ring-1 ring-primary";
        }
        
        const isSelected = selectedCell?.row === r && selectedCell?.col === c;
        const inRange = rangeStart && rangeEnd &&
            r >= Math.min(rangeStart.row, rangeEnd.row) &&
            r <= Math.max(rangeStart.row, rangeEnd.row) &&
            c >= Math.min(rangeStart.col, rangeEnd.col) &&
            c <= Math.max(rangeStart.col, rangeEnd.col);
            
        if (isSelected && !inRange) {
            classes += "bg-primary/15 border-primary outline outline-1 outline-primary ring-1 ring-primary z-10 ";
        } else if (inRange) {
            const isStart = rangeStart.row === r && rangeStart.col === c;
            classes += isStart ? "bg-primary/20 border-primary " : "bg-primary/10 border-primary/40 ";
        } else {
            classes += "hover:bg-muted/50 cursor-pointer ";
        }

        // Custom borders classes
        const key = `${r}_${c}`;
        const cellStyle = cellStyles[key];
        if (cellStyle) {
            if (cellStyle.border === "all") {
                classes += "border-t border-l border-r border-b border-black ";
            } else if (cellStyle.border === "bottom") {
                classes += "border-b border-black ";
            }
        }
        
        return classes;
    };
    
    // Determine cell inline style based on cell formatting states
    const getCellStyle = (r: number, c: number): React.CSSProperties => {
        const style: React.CSSProperties = {};
        const key = `${r}_${c}`;
        const cellStyle = cellStyles[key];
        
        if (cellStyle) {
            if (cellStyle.bold) style.fontWeight = "bold";
            if (cellStyle.italic) style.fontStyle = "italic";
            if (cellStyle.align) style.textAlign = cellStyle.align;
            if (cellStyle.bgColor) style.backgroundColor = cellStyle.bgColor;
            
            // Borders logic (inline fallback)
            if (cellStyle.border === "all") {
                style.border = "1px solid #000";
            } else if (cellStyle.border === "bottom") {
                style.borderBottom = "1px solid #000";
            }
        }
        return style;
    };

    // Get formatted visual value for cell
    const getDisplayValue = (val: any): string => {
        if (val === null || val === undefined) return "";
        if (typeof val === "object") {
            if (val.value !== undefined) return String(val.value);
            return JSON.stringify(val);
        }
        return String(val);
    };
    
    // Build and export HTML table to TinyMCE
    const handleImportIntoReport = () => {
        if (!activeSheet) {
            toast.error("Không có dữ liệu sheet hoạt động");
            return;
        }
        
        let startR = 0;
        let endR = 0;
        let startC = 0;
        let endC = 0;
        
        // Find active cell boundary of ALL filled cells in the sheet to export the whole used range
        let firstFilledRow = rowCount;
        let lastFilledRow = 0;
        let firstFilledCol = colCount;
        let lastFilledCol = 0;
        let hasValue = false;
        
        for (let r = 0; r < rowCount; r++) {
            for (let c = 0; c < colCount; c++) {
                const val = sheetValues[r]?.[c];
                if (val !== null && val !== undefined && val !== "") {
                    firstFilledRow = Math.min(firstFilledRow, r);
                    lastFilledRow = Math.max(lastFilledRow, r);
                    firstFilledCol = Math.min(firstFilledCol, c);
                    lastFilledCol = Math.max(lastFilledCol, c);
                    hasValue = true;
                }
            }
        }
        
        if (hasValue) {
            startR = firstFilledRow;
            endR = lastFilledRow;
            startC = firstFilledCol;
            endC = lastFilledCol;
        } else {
            // fallback if entirely empty
            startR = 0;
            endR = 0;
            startC = 0;
            endC = 0;
        }
        
        // Create HTML table
        let html = '<table style="border-collapse: collapse; width: 100%; border: 1px solid black; font-family: \'Times New Roman\', Times, serif; font-size: 13px;">';
        
        // Read through selected columns/rows
        for (let r = startR; r <= endR; r++) {
            let rowHtml = '<tr>';
            let cellsInRow = 0;
            
            for (let c = startC; c <= endC; c++) {
                const mergeInfo = getCellMergeInfo(r, c);
                if (mergeInfo.isMerged && !mergeInfo.isTopLeft) {
                    continue; // Skip cell if it is merged out
                }
                
                cellsInRow++;
                const val = sheetValues[r]?.[c];
                const displayVal = getDisplayValue(val);
                
                // Get style properties
                const key = `${r}_${c}`;
                const cellStyle = cellStyles[key];
                
                // Align style
                let align = cellStyle?.align || (typeof val === "number" ? "right" : "left");
                let alignStyle = `text-align: ${align} !important;`;
                
                // Bold and italic
                let fontStyle = "";
                if (cellStyle?.bold) fontStyle += "font-weight: bold !important; ";
                if (cellStyle?.italic) fontStyle += "font-style: italic !important; ";
                
                // Background color
                let bgStyle = cellStyle?.bgColor ? `background-color: ${cellStyle.bgColor} !important; ` : "";
                
                // Borders style
                let borderStyle = "border: 1px solid black !important; ";
                if (cellStyle?.border === "none") {
                    borderStyle = "border: none !important; ";
                } else if (cellStyle?.border === "bottom") {
                    borderStyle = "border: none !important; border-bottom: 1px solid black !important; ";
                }
                
                // Attributes
                const cellTag = r === startR ? "th" : "td";
                const rowSpanAttr = mergeInfo.rowSpan > 1 ? ` rowspan="${mergeInfo.rowSpan}"` : "";
                const colSpanAttr = mergeInfo.colSpan > 1 ? ` colspan="${mergeInfo.colSpan}"` : "";
                const paddingStyle = "padding: 6px !important; vertical-align: top;";
                
                rowHtml += `<${cellTag}${rowSpanAttr}${colSpanAttr} style="${borderStyle} ${paddingStyle} ${alignStyle} ${fontStyle} ${bgStyle}">${displayVal}</${cellTag}>`;
            }
            
            rowHtml += '</tr>';
            if (cellsInRow > 0) {
                html += rowHtml;
            }
        }
        html += '</table>';
        
        onImportHtml(html);
        onOpenChange(false);
        toast.success("Đã import bảng tính Excel vào biên bản thành công!");
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] sm:max-w-[90vw] h-[90vh] p-0 flex flex-col overflow-hidden bg-background border border-border shadow-2xl [&>button:last-child]:hidden">
                {/* Header Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-500 animate-pulse" />
                            <span>Xử lý bảng tính Excel</span>
                        </DialogTitle>
                        {fileName && (
                            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs select-none">
                                {fileName}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 pr-6">
                        <div className="relative">
                            <input
                                type="file"
                                id="excel-modal-file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-dashed hover:bg-muted"
                                onClick={() => document.getElementById("excel-modal-file")?.click()}
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5 rotate-180" />
                                Tải file khác
                            </Button>
                        </div>
                        <Button
                            size="sm"
                            disabled={!activeSheet}
                            onClick={handleImportIntoReport}
                            className="h-8 bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-1.5"
                        >
                            <ArrowRight className="w-4 h-4" />
                            Import vào biên bản
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                
                {/* Active sheet indicator & Sheet Selection Tabs */}
                {sheetNames.length > 0 && (
                    <div className="px-6 py-1 border-b bg-muted/10 shrink-0">
                        <Tabs value={activeSheet} onValueChange={switchActiveSheet} className="w-full">
                            <TabsList className="bg-transparent h-9 p-0 gap-1 overflow-x-auto justify-start border-none">
                                {sheetNames.map((name) => (
                                    <TabsTrigger
                                        key={name}
                                        value={name}
                                        className="h-8 px-4 rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-background/80 hover:text-foreground text-muted-foreground text-xs font-semibold"
                                    >
                                        {name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                )}
                
                {/* Spreadsheet Workspace */}
                {activeSheet ? (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background/50">
                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-1.5 border-b px-6 py-1.5 bg-muted/15 shrink-0 select-none flex-wrap">
                            {/* Font Style Group */}
                            <div className="flex items-center gap-0.5 border-r pr-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${selectedCell && cellStyles[`${selectedCell.row}_${selectedCell.col}`]?.bold ? "bg-accent text-accent-foreground font-bold" : ""}`}
                                    onClick={() => applyStyleToSelection({ bold: !cellStyles[`${selectedCell?.row}_${selectedCell?.col}`]?.bold })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Chữ đậm (Bold)"
                                    disabled={!selectedCell}
                                >
                                    <Bold className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${selectedCell && cellStyles[`${selectedCell.row}_${selectedCell.col}`]?.italic ? "bg-accent text-accent-foreground" : ""}`}
                                    onClick={() => applyStyleToSelection({ italic: !cellStyles[`${selectedCell?.row}_${selectedCell?.col}`]?.italic })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Chữ nghiêng (Italic)"
                                    disabled={!selectedCell}
                                >
                                    <Italic className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            {/* Alignment Group */}
                            <div className="flex items-center gap-0.5 border-r pr-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${selectedCell && cellStyles[`${selectedCell.row}_${selectedCell.col}`]?.align === "left" ? "bg-accent text-accent-foreground" : ""}`}
                                    onClick={() => applyStyleToSelection({ align: "left" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Căn lề trái"
                                    disabled={!selectedCell}
                                >
                                    <AlignLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${selectedCell && cellStyles[`${selectedCell.row}_${selectedCell.col}`]?.align === "center" ? "bg-accent text-accent-foreground" : ""}`}
                                    onClick={() => applyStyleToSelection({ align: "center" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Căn giữa"
                                    disabled={!selectedCell}
                                >
                                    <AlignCenter className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 w-7 p-0 ${selectedCell && cellStyles[`${selectedCell.row}_${selectedCell.col}`]?.align === "right" ? "bg-accent text-accent-foreground" : ""}`}
                                    onClick={() => applyStyleToSelection({ align: "right" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Căn lề phải"
                                    disabled={!selectedCell}
                                >
                                    <AlignRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            {/* Merge Cells Group */}
                            <div className="flex items-center gap-1 border-r pr-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground animate-none"
                                    onClick={handleMergeCells}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Gộp các ô đã chọn"
                                    disabled={!rangeStart || !rangeEnd}
                                >
                                    <Merge className="w-3.5 h-3.5 text-blue-600" />
                                    Gộp ô
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={handleUnmergeCells}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Huỷ gộp ô"
                                    disabled={!selectedCell}
                                >
                                    <Split className="w-3.5 h-3.5 text-amber-600" />
                                    Huỷ gộp
                                </Button>
                            </div>

                            {/* Borders Group */}
                            <div className="flex items-center gap-1 border-r pr-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={() => applyStyleToSelection({ border: "all" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Tạo viền đen xung quanh"
                                    disabled={!selectedCell}
                                >
                                    <Grid className="w-3.5 h-3.5 text-gray-700" />
                                    Kẻ viền
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={() => applyStyleToSelection({ border: "none" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Bỏ viền ô"
                                    disabled={!selectedCell}
                                >
                                    <X className="w-3 h-3 text-red-500" />
                                    Bỏ viền
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={() => applyStyleToSelection({ border: "bottom" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Chỉ kẻ viền dưới"
                                    disabled={!selectedCell}
                                >
                                    <span className="underline font-bold text-xs mr-0.5">U</span>
                                    Viền dưới
                                </Button>
                            </div>

                            {/* Colors Group */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={() => applyStyleToSelection({ bgColor: "#f3f4f6" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Màu nền xám tiêu đề"
                                    disabled={!selectedCell}
                                >
                                    <PaintBucket className="w-3.5 h-3.5 text-gray-500" />
                                    Xám tiêu đề
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={() => applyStyleToSelection({ bgColor: "#fef08a" })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Tô màu nền vàng"
                                    disabled={!selectedCell}
                                >
                                    <PaintBucket className="w-3.5 h-3.5 text-yellow-500" />
                                    Nền vàng
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                    onClick={() => applyStyleToSelection({ bgColor: undefined })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    title="Xoá màu nền"
                                    disabled={!selectedCell}
                                >
                                    Không màu
                                </Button>
                            </div>
                        </div>

                        {/* Formula Bar */}
                        <div className="flex items-center gap-2 border-b px-6 py-2 bg-muted/5 shrink-0 select-none">
                            {/* Selected cell coordinate */}
                            <div className="w-16 h-7 flex items-center justify-center bg-muted/60 border rounded font-mono text-xs select-none">
                                {selectedCell 
                                    ? colIndexToLabel(selectedCell.col) + (selectedCell.row + 1)
                                    : ""
                                }
                            </div>
                            
                            {/* Selected Range Input */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground font-semibold">Vùng:</span>
                                <Input
                                    value={rangeInput}
                                    onChange={handleRangeInputChange}
                                    placeholder="A1:B2"
                                    className="h-7 w-20 text-center font-mono text-xs p-1"
                                />
                            </div>
                            
                            <div className="h-4 w-[1px] bg-border mx-1"></div>
                            
                            {/* fx label */}
                            <div className="font-serif italic font-bold text-sm text-muted-foreground w-6 text-center select-none">
                                fx
                            </div>
                            
                            {/* Formula Input */}
                            <div className="flex-1 relative flex items-center">
                                <Input
                                    ref={formulaInputRef}
                                    value={formulaBarText}
                                    onChange={(e) => setFormulaBarText(e.target.value)}
                                    onKeyDown={handleFormulaBarKeyDown}
                                    disabled={!selectedCell}
                                    placeholder={selectedCell ? "Nhập giá trị hoặc công thức (ví dụ: =A1+B1, =SUM(A1:A5))" : "Chọn một ô để bắt đầu sửa"}
                                    className="h-7 text-xs font-mono pr-14"
                                />
                                {selectedCell && (
                                    <div className="absolute right-2 flex items-center gap-1.5">
                                        <button 
                                            onClick={() => handleCellUpdate(selectedCell.row, selectedCell.col, formulaBarText)}
                                            className="text-green-600 hover:text-green-700 hover:bg-muted p-0.5 rounded transition"
                                            title="Đồng ý (Enter)"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => setFormulaBarText(sheetInputs[selectedCell.row]?.[selectedCell.col] || "")}
                                            className="text-red-500 hover:text-red-600 hover:bg-muted p-0.5 rounded transition"
                                            title="Hủy bỏ (Esc)"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Interactive Data Table Grid */}
                        <div className="flex-1 overflow-auto p-4 min-h-0 min-w-0">
                            <div className="inline-block min-w-full border rounded shadow-sm bg-background">
                                <table className="border-collapse table-fixed select-none" style={{ width: `${colCount * 100 + 40}px` }}>
                                    <thead>
                                        <tr className="bg-muted/30 select-none">
                                            {/* Top-left corner header */}
                                            <th className="w-10 border-r border-b bg-muted/60 p-0 text-center text-xs font-semibold text-muted-foreground select-none">
                                                <Grid className="w-3.5 h-3.5 mx-auto opacity-50" />
                                            </th>
                                            {/* Column headers (A, B, C...) */}
                                            {Array.from({ length: colCount }).map((_, c) => (
                                                <th 
                                                    key={c}
                                                    onClick={() => {
                                                        // Select whole column
                                                        setRangeStart({ row: 0, col: c });
                                                        setRangeEnd({ row: rowCount - 1, col: c });
                                                        setSelectedCell({ row: 0, col: c });
                                                        setRangeInput(`${colIndexToLabel(c)}1:${colIndexToLabel(c)}${rowCount}`);
                                                    }}
                                                    className="w-[100px] border-r border-b bg-muted/40 px-2 py-1 text-center text-xs font-bold text-muted-foreground select-none hover:bg-muted/80 cursor-pointer transition-colors"
                                                >
                                                    {colIndexToLabel(c)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: rowCount }).map((_, r) => (
                                            <tr key={r}>
                                                {/* Row Header (1, 2, 3...) */}
                                                <td 
                                                    onClick={() => {
                                                        // Select whole row
                                                        setRangeStart({ row: r, col: 0 });
                                                        setRangeEnd({ row: r, col: colCount - 1 });
                                                        setSelectedCell({ row: r, col: 0 });
                                                        setRangeInput(`A${r + 1}:${colIndexToLabel(colCount - 1)}${r + 1}`);
                                                    }}
                                                    className="border-r border-b bg-muted/40 text-center text-xs font-bold text-muted-foreground select-none hover:bg-muted/80 cursor-pointer transition-colors"
                                                >
                                                    {r + 1}
                                                </td>
                                                {/* Cells */}
                                                {Array.from({ length: colCount }).map((_, c) => {
                                                    const mergeInfo = getCellMergeInfo(r, c);
                                                    if (mergeInfo.isMerged && !mergeInfo.isTopLeft) {
                                                        return null;
                                                    }
                                                    
                                                    const isEditing = editingCell?.row === r && editingCell?.col === c;
                                                    const val = sheetValues[r]?.[c];
                                                    
                                                    return (
                                                        <td 
                                                            key={c}
                                                            className={getCellClassName(r, c)}
                                                            style={getCellStyle(r, c)}
                                                            rowSpan={mergeInfo.rowSpan}
                                                            colSpan={mergeInfo.colSpan}
                                                            onMouseDown={(e) => handleCellMouseDown(r, c, e)}
                                                            onMouseEnter={() => handleCellMouseEnter(r, c)}
                                                        >
                                                            {isEditing ? (
                                                                <input
                                                                    ref={editInputRef}
                                                                    value={formulaBarText}
                                                                    onChange={(e) => setFormulaBarText(e.target.value)}
                                                                    onKeyDown={(e) => handleEditInputKeyDown(e, r, c)}
                                                                    onBlur={() => {
                                                                        handleCellUpdate(r, c, formulaBarText);
                                                                        setEditingCell(null);
                                                                    }}
                                                                    className="w-full h-full border-none px-2 py-1 text-xs font-mono focus:outline-none focus:ring-0 bg-transparent"
                                                                />
                                                            ) : (
                                                                getDisplayValue(val)
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Info Footer bar */}
                        <div className="px-6 py-2 border-t bg-muted/10 flex justify-between items-center text-xs text-muted-foreground select-none shrink-0">
                            <div>
                                Phím tắt: <kbd className="px-1 bg-muted border rounded">Enter</kbd> (lưu & xuống), <kbd className="px-1 bg-muted border rounded">Tab</kbd> (lưu & sang phải), <kbd className="px-1 bg-muted border rounded">Shift + Click</kbd> (chọn vùng)
                            </div>
                            {rangeStart && rangeEnd && (
                                <div className="font-semibold text-green-600 dark:text-green-500">
                                    Đang chọn vùng: {colIndexToLabel(Math.min(rangeStart.col, rangeEnd.col)) + (Math.min(rangeStart.row, rangeEnd.row) + 1)} : {colIndexToLabel(Math.max(rangeStart.col, rangeEnd.col)) + (Math.max(rangeStart.row, rangeEnd.row) + 1)}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-background/50">
                        <FileSpreadsheet className="w-16 h-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Chưa tải file Excel</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mb-6">
                            Chọn một file Excel (.xlsx hoặc .xls) từ máy tính của bạn để xử lý các bảng tính và công thức trước khi chèn vào biên bản.
                        </p>
                        <Button
                            onClick={() => document.getElementById("excel-modal-file")?.click()}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Chọn file Excel
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
