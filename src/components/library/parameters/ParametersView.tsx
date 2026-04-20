import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, X, Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useCreateParameter, useUpdateParameter, useParametersList } from "@/api/library";
import { useEnumList } from "@/api/chemical";

import type { Parameter } from "@/types/library";
import type { ParameterWithMatrices } from "../hooks/useLibraryData";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { ParametersTable, type ParametersExcelFiltersState } from "./ParametersTable";
import { ParameterDetailPanel } from "./ParametersDetailPanel";
import { ParameterMatrixManager } from "./ParameterMatrixManager";
import { HelpBubble } from "@/components/inventory/chemical/HelpBubble";

function TechnicianAliasSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { data: enumList, isLoading } = useEnumList("technicianAlias", { enabled: true });

    const options = useMemo(() => (Array.isArray(enumList) ? (enumList as string[]) : []), [enumList]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal h-9 px-3">
                    <span className="truncate">{value || t("library.parameters.create.technicianAliasPlaceholder", { defaultValue: "Chọn vị trí..." })}</span>
                    {isLoading ? <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={String(t("common.search"))} />
                    <CommandList>
                        <CommandEmpty>{String(t("common.noData"))}</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt}
                                    value={opt}
                                    onSelect={() => {
                                        onChange(opt === value ? "" : opt);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                                    {opt}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

type CreateParameterForm = {
    parameterId?: string;
    parameterName: string;
    technicianAlias: string;
    technicianGroupId: string;
    parameterSearchKeys: string;
    parameterStatus: string;
    parameterNote: string;
    displayStyleEng: string;
    displayStyleDefault: string;
};

type DisplayStyleResolved = {
    eng: string | null;
    default: string | null;
};

function ParametersSkeleton() {
    return (
        <div className="bg-background border border-border rounded-lg p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        </div>
    );
}

function asRecord(v: unknown): Record<string, unknown> | null {
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function resolveDisplayStyle(ds: unknown): DisplayStyleResolved {
    const obj = asRecord(ds);
    const eng = typeof obj?.eng === "string" && obj.eng.trim().length ? obj.eng : null;
    const def = typeof obj?.default === "string" && obj.default.trim().length ? obj.default : null;
    return { eng, default: def };
}

function toParameterWithMatrices(p: Parameter): ParameterWithMatrices {
    const anyP = asRecord(p) ?? {};
    return {
        ...p,
        createdById: (typeof anyP.createdById === "string" ? anyP.createdById : "") ?? "",
        modifiedAt: (typeof anyP.modifiedAt === "string" ? anyP.modifiedAt : undefined) ?? (typeof anyP.createdAt === "string" ? anyP.createdAt : undefined) ?? "",
        modifiedById: (typeof anyP.modifiedById === "string" ? anyP.modifiedById : "") ?? "",
        matrices: [],
        parameterNameEnResolved: typeof anyP.parameterNameEn === "string" && anyP.parameterNameEn.trim().length ? anyP.parameterNameEn : p.parameterName,
        displayStyleResolved: resolveDisplayStyle(anyP.displayStyle),
    } as ParameterWithMatrices;
}

function createEmptyFilters(): ParametersExcelFiltersState {
    return {
        technicianAlias: [],
        technicianGroupId: [],
        parameterStatus: [],
    };
}

const EMPTY_FORM: CreateParameterForm = {
    parameterName: "",
    technicianAlias: "",
    technicianGroupId: "",
    parameterSearchKeys: "",
    parameterStatus: "Active",
    parameterNote: "",
    displayStyleEng: "",
    displayStyleDefault: "",
};

export function ParametersView() {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [selectedParameter, setSelectedParameter] = useState<ParameterWithMatrices | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateParameterForm>(EMPTY_FORM);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 20);

    const [excelFilters, setExcelFilters] = useState<ParametersExcelFiltersState>(() => createEmptyFilters());

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
                "technicianAlias[]": excelFilters.technicianAlias.length > 0 ? excelFilters.technicianAlias : null,
                "technicianGroupId[]": excelFilters.technicianGroupId.length > 0 ? excelFilters.technicianGroupId : null,
                "parameterStatus[]": excelFilters.parameterStatus.length > 0 ? excelFilters.parameterStatus : null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedSearch, pagination.currentPage, pagination.itemsPerPage, excelFilters],
    );

    const parametersQ = useParametersList(listInput);

    const pageItems = useMemo(() => {
        const data = (parametersQ.data?.data ?? []) as unknown as Parameter[];
        return data.map(toParameterWithMatrices);
    }, [parametersQ.data]);

    const serverMeta = parametersQ.data?.meta;
    const totalItems = serverMeta?.total ?? 0;
    const totalPages = serverMeta?.totalPages ?? 1;

    useEffect(() => setServerTotalPages(totalPages), [totalPages]);

    const createParam = useCreateParameter();
    const updateParam = useUpdateParameter();

    const onSearchChange = (v: string) => {
        setSearchTerm(v);
        pagination.resetPage();
    };

    const openCreate = () => {
        setCreateForm(EMPTY_FORM);
        setCreateOpen(true);
    };

    const openEdit = (p: ParameterWithMatrices) => {
        setCreateForm({
            parameterId: p.parameterId,
            parameterName: p.parameterName || "",
            technicianAlias: p.technicianAlias || "",
            technicianGroupId: p.technicianGroupId || "",
            parameterSearchKeys: (p as any).parameterSearchKeys?.join?.(", ") || "",
            parameterStatus: p.parameterStatus || "Active",
            parameterNote: (p as any).parameterNote || "",
            displayStyleEng: p.displayStyleResolved?.eng || "",
            displayStyleDefault: p.displayStyleResolved?.default || "",
        });
        setCreateOpen(true);
    };

    // ─── Submit ──────────────────────────────────────────────────────────

    const submitCreate = async () => {
        const name = createForm.parameterName.trim();
        const alias = createForm.technicianAlias.trim();
        const groupId = createForm.technicianGroupId.trim();
        const searchKeys = createForm.parameterSearchKeys
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        const status = createForm.parameterStatus.trim();
        const note = createForm.parameterNote.trim();
        const eng = createForm.displayStyleEng.trim();
        const def = createForm.displayStyleDefault.trim();

        if (!name) return;

        const body: any = {
            parameterName: name,
            technicianAlias: alias.length ? alias : null,
            technicianGroupId: groupId.length ? groupId : null,
            parameterSearchKeys: searchKeys.length ? searchKeys : null,
            parameterStatus: status.length ? status : null,
            parameterNote: note.length ? note : null,
            displayStyle: eng.length || def.length ? { eng: eng.length ? eng : undefined, default: def.length ? def : undefined } : undefined,
        };

        if (createForm.parameterId) {
            await updateParam.mutateAsync({ body: { parameterId: createForm.parameterId, ...body } });
        } else {
            const result = await createParam.mutateAsync({ body });
            // Keep the form open after creating so they can now add matrices if they want
            setCreateForm({
                ...createForm,
                parameterId: result.parameterId,
            });
            // Don't close immediately if just created, so they can see the matrix panel
            return;
        }

        setCreateOpen(false);
    };

    const isLoading = parametersQ.isLoading;
    const isError = parametersQ.isError;

    const isPending = createParam.isPending || updateParam.isPending;

    return (
        <div className="space-y-4">
            <LibraryHeader
                titleKey="library.parameters.title"
                subtitleKey="library.parameters.total"
                totalCount={totalItems}
                searchValue={searchTerm}
                onSearchChange={onSearchChange}
                onAdd={openCreate}
                addLabelKey="library.parameters.actions.add"
                searchPlaceholderKey="library.parameters.searchPlaceholder"
            />

            {isLoading ? <ParametersSkeleton /> : null}

            {isError ? (
                <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">{String(t("common.errorTitle"))}</div>
                        <div className="text-sm text-muted-foreground">{String(t("library.parameters.errors.loadFailed"))}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="flex gap-4">
                    <div className="flex-1 bg-background rounded-lg border border-border overflow-hidden">
                        <ParametersTable
                            items={pageItems}
                            selectedId={selectedParameter?.parameterId ?? null}
                            onSelect={(p) => setSelectedParameter(p)}
                            onEdit={openEdit}
                            excelFilters={excelFilters}
                            onExcelFiltersChange={(nextFilters) => {
                                setExcelFilters(nextFilters);
                                pagination.resetPage();
                            }}
                        />

                        <div className="border-t p-3">
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={totalPages}
                                itemsPerPage={pagination.itemsPerPage}
                                totalItems={totalItems}
                                onPageChange={pagination.handlePageChange}
                                onItemsPerPageChange={pagination.handleItemsPerPageChange}
                            />
                        </div>
                    </div>

                    <ParameterDetailPanel selected={selectedParameter} onClose={() => setSelectedParameter(null)} onSelectProtocolId={() => {}} />
                </div>
            ) : null}

            {/* ═══ Create / Edit Modal ═══ */}
            {createOpen ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg border border-border shadow-xl overflow-hidden flex flex-col" style={{ width: "80vw", height: "80vh", minWidth: 900, minHeight: 600 }}>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                            <div className="text-base font-semibold text-foreground">
                                {createForm.parameterId ? t("library.parameters.edit.title", { defaultValue: "Chỉnh sửa chỉ tiêu" }) : t("library.parameters.create.title")}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setCreateOpen(false)} type="button">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Body — left/right split */}
                        <div className="flex-1 overflow-hidden flex">
                            {/* LEFT — Parameter fields */}
                            <div className="w-[45%] border-r border-border overflow-y-auto p-5 space-y-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{String(t("library.parameters.parameterNameLong", { defaultValue: "Tên chỉ tiêu phân tích" }))}</div>
                                    <Input
                                        value={createForm.parameterName}
                                        onChange={(e) => setCreateForm((s) => ({ ...s, parameterName: e.target.value }))}
                                        placeholder={String(t("library.parameters.create.parameterNamePlaceholder", { defaultValue: "Nhập tên chỉ tiêu..." }))}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-foreground">{String(t("library.parameters.technicianAlias", { defaultValue: "Vị trí phụ trách" }))}</div>
                                        <TechnicianAliasSelect value={createForm.technicianAlias || ""} onChange={(val) => setCreateForm((s) => ({ ...s, technicianAlias: val }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-foreground">{String(t("library.parameters.technicianGroupId", { defaultValue: "ID nhóm kỹ thuật viên" }))}</div>
                                        <Input
                                            value={createForm.technicianGroupId}
                                            onChange={(e) => setCreateForm((s) => ({ ...s, technicianGroupId: e.target.value }))}
                                            placeholder={String(t("library.parameters.create.technicianGroupIdPlaceholder", { defaultValue: "Nhập ID nhóm kỹ thuật viên" }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-foreground">{String(t("library.parameters.parameterSearchKeys", { defaultValue: "Từ khóa tìm kiếm" }))}</div>
                                        <Input
                                            value={createForm.parameterSearchKeys}
                                            onChange={(e) => setCreateForm((s) => ({ ...s, parameterSearchKeys: e.target.value }))}
                                            placeholder={String(t("library.parameters.create.parameterSearchKeysPlaceholder", { defaultValue: "Nhập các từ khóa cách nhau bằng dấu phẩy" }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-foreground">{String(t("library.parameters.parameterStatus", { defaultValue: "Trạng thái" }))}</div>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={createForm.parameterStatus}
                                            onChange={(e) => setCreateForm((s) => ({ ...s, parameterStatus: e.target.value }))}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{String(t("library.parameters.parameterNote", { defaultValue: "Ghi chú" }))}</div>
                                    <Input
                                        value={createForm.parameterNote}
                                        onChange={(e) => setCreateForm((s) => ({ ...s, parameterNote: e.target.value }))}
                                        placeholder={String(t("library.parameters.create.parameterNotePlaceholder", { defaultValue: "Ghi chú thêm về chỉ tiêu..." }))}
                                    />
                                </div>
                            </div>

                            {/* RIGHT — Matrix / Protocols / SampleTypes / Chemicals */}
                            <div className="w-[55%] overflow-y-auto p-5 relative">
                                {!createForm.parameterId ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/20 border border-dashed rounded-lg">
                                        {String(
                                            t("library.parameters.edit.saveParameterFirst", {
                                                defaultValue: 'Vui lòng lưu thông tin Chỉ tiêu trước (Bấm "Lưu") để có thể thêm và cấu hình các Ma trận nền mẫu.',
                                            }),
                                        )}
                                    </div>
                                ) : (
                                    <ParameterMatrixManager parameterId={createForm.parameterId} />
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                            {(createParam.isError || updateParam.isError) && (
                                <div className="text-sm text-destructive mr-auto">{String(t("library.parameters.create.error", { defaultValue: "Lỗi khi lưu chỉ tiêu" }))}</div>
                            )}
                            <Button variant="outline" onClick={() => setCreateOpen(false)} type="button">
                                {String(t("common.cancel", { defaultValue: "Hủy" }))}
                            </Button>
                            <Button onClick={() => void submitCreate()} disabled={isPending || createForm.parameterName.trim().length === 0} type="button">
                                {isPending ? t("common.saving", { defaultValue: "Đang lưu..." }) : t("common.save", { defaultValue: "Lưu" })}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            <HelpBubble guidePath="guide-parameters.html" />
        </div>
    );
}
