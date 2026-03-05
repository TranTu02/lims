import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertCircle, X, Upload } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateProtocol, useUpdateProtocol, useProtocolsList, type Protocol } from "@/api/library";

import { searchDocuments } from "@/api/documents";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { ProtocolsTable, type ProtocolsExcelFiltersState } from "./ProtocolsTable";
import { ProtocolDetailPanel } from "./ProtocolDetailPanel";
import { SearchSelectPicker, type PickerItem } from "./SearchSelectPicker";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";
import { ChemicalBomTable, type ChemicalBomItem } from "../shared/ChemicalBomTable";
import { ProtocolMatrixManager } from "./ProtocolMatrixManager";

type EditProtocolForm = {
    protocolId?: string;
    protocolCode: string;
    protocolTitle: string;
    protocolSource: string;
    protocolDescription: string;
    accreditationVilas: boolean;
    accreditationTdc: boolean;
    parameters: { parameterId: string; parameterName: string }[];
    sampleTypes: { sampleTypeId: string; sampleTypeName: string }[];
    chemicals: ChemicalBomItem[];
    documentIds: string[];
    selectedDocuments: PickerItem[];
};

function ProtocolsSkeleton() {
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

function createEmptyFilters(): ProtocolsExcelFiltersState {
    return {
        protocolCode: [],
        protocolSource: [],
        accreditation: [],
    };
}

function applyLocalFilters(items: Protocol[], f: ProtocolsExcelFiltersState) {
    const matchStr = (value: string, selected: string[]) => (selected.length ? selected.includes(value) : true);

    const hasAccValue = (p: Protocol, selected: string[]) => {
        if (selected.length === 0) return true;
        const tags: string[] = [];
        if (p.protocolAccreditation?.VILAS) tags.push("VILAS");
        if (p.protocolAccreditation?.TDC) tags.push("TDC");
        if (!p.protocolAccreditation?.VILAS && !p.protocolAccreditation?.TDC) tags.push("NONE");
        return selected.some((x) => tags.includes(x));
    };

    return items.filter((p) => {
        const code = p.protocolCode ?? "";
        const source = p.protocolSource ?? "";
        return matchStr(code, f.protocolCode) && matchStr(source, f.protocolSource) && hasAccValue(p, f.accreditation);
    });
}

export function ProtocolsView() {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [selected, setSelected] = useState<Protocol | null>(null);

    const [editOpen, setEditOpen] = useState(false);

    const EMPTY_FORM: EditProtocolForm = {
        protocolCode: "",
        protocolTitle: "",
        protocolSource: "",
        protocolDescription: "",
        accreditationVilas: false,
        accreditationTdc: false,
        parameters: [],
        sampleTypes: [],
        chemicals: [],
        documentIds: [],
        selectedDocuments: [],
    };

    const [editForm, setEditForm] = useState<EditProtocolForm>(EMPTY_FORM);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 20);

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedSearch, pagination.currentPage, pagination.itemsPerPage],
    );

    const protocolsQ = useProtocolsList(listInput);

    const allProtocols = useMemo(() => {
        return (protocolsQ.data?.data ?? []) as Protocol[];
    }, [protocolsQ.data]);

    const serverMeta = protocolsQ.data?.meta;
    const serverTotal = serverMeta?.total ?? serverMeta?.totalItems ?? 0;
    const serverPages = serverMeta?.totalPages ?? 1;

    useEffect(() => setServerTotalPages(serverPages), [serverPages]);

    const [excelFilters, setExcelFilters] = useState<ProtocolsExcelFiltersState>(() => createEmptyFilters());

    const filteredAll = useMemo(() => applyLocalFilters(allProtocols, excelFilters), [allProtocols, excelFilters]);
    const pageItems = filteredAll;
    const totalItems = serverTotal;
    const totalPages = serverPages;

    const createP = useCreateProtocol();
    const updateP = useUpdateProtocol();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && editOpen && !uploadModalOpen) {
                setEditOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editOpen, uploadModalOpen]);

    // ─── Search handlers for pickers ────────────────────────────────────────

    const searchDocumentsFn = useCallback(async (q: string): Promise<PickerItem[]> => {
        try {
            const docs = await searchDocuments(q);
            return docs.map((d) => ({
                id: d.documentId,
                label: d.documentTitle || d.documentId,
                sublabel: d.documentId,
            }));
        } catch {
            return [];
        }
    }, []);

    const onDocumentsChange = (items: PickerItem[]) => {
        setEditForm((s) => ({
            ...s,
            documentIds: items.map((i) => i.id),
            selectedDocuments: items,
        }));
    };

    const onSearchChange = (v: string) => {
        setSearchTerm(v);
        pagination.resetPage();
    };

    const onExcelFiltersChange = (next: ProtocolsExcelFiltersState) => {
        setExcelFilters(next);
        pagination.resetPage();
    };

    const openCreate = () => {
        setEditForm(EMPTY_FORM);
        setEditOpen(true);
    };

    const openEdit = (p: Protocol) => {
        // Convert chemicals format to BOM format
        const chemBom: ChemicalBomItem[] = (p.chemicals || []).map((c) => ({
            chemicalSkuId: c.chemicalSkuId || (c as any).chemicalId || "",
            chemicalName: c.chemicalName || "",
            consumedQty: c.consumedQty || (c as any).amountUsed || "",
            unit: c.unit || (c as any).measurementUnit || "",
        }));

        setEditForm({
            protocolId: p.protocolId,
            protocolCode: p.protocolCode,
            protocolTitle: p.protocolTitle || "",
            protocolSource: p.protocolSource,
            protocolDescription: p.protocolDescription || "",
            accreditationVilas: !!p.protocolAccreditation?.VILAS,
            accreditationTdc: !!p.protocolAccreditation?.TDC,
            parameters: p.parameters || [],
            sampleTypes: p.sampleTypes || [],
            chemicals: chemBom,
            documentIds: p.protocolDocumentIds || [],
            selectedDocuments: (p.protocolDocumentIds || []).map((id) => ({
                id,
                label: id,
                sublabel: "",
            })),
        });
        setEditOpen(true);
    };

    const submitForm = async () => {
        const code = String(editForm.protocolCode || "").trim();
        const source = String(editForm.protocolSource || "").trim();
        if (!code || !source) return;

        const hasAcc = editForm.accreditationVilas || editForm.accreditationTdc;

        // Convert BOM items back to the protocol chemicals format
        const chemicalsPayload = editForm.chemicals.length
            ? editForm.chemicals.map((c) => ({
                  chemicalSkuId: c.chemicalSkuId,
                  chemicalName: c.chemicalName,
                  consumedQty: c.consumedQty,
                  unit: c.unit,
              }))
            : undefined;

        const body = {
            protocolCode: code,
            protocolTitle: String(editForm.protocolTitle || "").trim() || undefined,
            protocolSource: source,
            protocolDescription: String(editForm.protocolDescription || "").trim() || undefined,
            protocolAccreditation: hasAcc ? { VILAS: editForm.accreditationVilas || undefined, TDC: editForm.accreditationTdc || undefined } : undefined,
            parameters: editForm.parameters.length ? editForm.parameters : undefined,
            sampleTypes: editForm.sampleTypes.length ? editForm.sampleTypes : undefined,
            chemicals: chemicalsPayload,
            protocolDocumentIds: editForm.documentIds.length ? editForm.documentIds : undefined,
        };

        try {
            if (editForm.protocolId) {
                await updateP.mutateAsync({ body: { protocolId: editForm.protocolId, ...body } });
            } else {
                const res = await createP.mutateAsync({ body });
                if (res?.protocolId) {
                    setEditForm((s) => ({ ...s, protocolId: res.protocolId }));
                }
            }
            toast.success(t("common.saveSuccess", { defaultValue: "Lưu thành công" }));
        } catch (error) {
            console.error("Failed to save protocol", error);
        }
    };
    const isLoading = protocolsQ.isLoading;
    const isError = protocolsQ.isError;
    const isPending = createP.isPending || updateP.isPending;
    return (
        <div className="space-y-4">
            <LibraryHeader
                titleKey="library.protocols.title"
                subtitleKey="library.protocols.total"
                totalCount={totalItems}
                searchValue={searchTerm}
                onSearchChange={onSearchChange}
                onAdd={openCreate}
                addLabelKey="library.protocols.actions.add"
                searchPlaceholderKey="library.protocols.searchPlaceholder"
            />

            {isLoading ? <ProtocolsSkeleton /> : null}

            {isError ? (
                <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">{String(t("common.errorTitle"))}</div>
                        <div className="text-sm text-muted-foreground">{String(t("library.protocols.errors.loadFailed"))}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="flex gap-4">
                    <div className="flex-1 bg-background rounded-lg border border-border overflow-hidden">
                        <ProtocolsTable
                            items={pageItems}
                            selectedId={selected?.protocolId ?? null}
                            onView={(p) => setSelected(p)}
                            onEdit={openEdit}
                            excelFilters={excelFilters}
                            onExcelFiltersChange={onExcelFiltersChange}
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

                    <ProtocolDetailPanel protocol={selected} onClose={() => setSelected(null)} onEdit={openEdit} />
                </div>
            ) : null}

            {/* ═══ Create / Edit Modal ═══ */}
            {editOpen ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg border border-border shadow-xl overflow-hidden flex flex-col" style={{ width: "80vw", height: "80vh", minWidth: 900, minHeight: 600 }}>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                            <div className="text-base font-semibold text-foreground">{editForm.protocolId ? t("library.protocols.edit.title") : t("library.protocols.create.title")}</div>
                            <Button variant="ghost" size="icon" onClick={() => setEditOpen(false)} type="button">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Body — left/right split */}
                        <div className="flex-1 overflow-hidden flex">
                            {/* LEFT — Protocol fields */}
                            <div className="w-[45%] border-r border-border overflow-y-auto p-5 space-y-5">
                                {/* Basic fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <div className="text-sm font-medium text-foreground">{String(t("library.protocols.create.protocolTitle", { defaultValue: "Tên phương pháp" }))}</div>
                                        <Input
                                            value={editForm.protocolTitle}
                                            onChange={(e) => setEditForm((s) => ({ ...s, protocolTitle: e.target.value }))}
                                            placeholder={String(t("library.protocols.create.protocolTitlePlaceholder", { defaultValue: "Nhập tên phương pháp" }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-foreground">{String(t("library.protocols.create.protocolCode", { defaultValue: "Mã hiệu tiêu chuẩn (SOP)" }))}</div>
                                        <Input
                                            value={editForm.protocolCode}
                                            onChange={(e) => setEditForm((s) => ({ ...s, protocolCode: e.target.value }))}
                                            placeholder={String(t("library.protocols.create.protocolCodePlaceholder", { defaultValue: "Mã phương pháp" }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-foreground">{String(t("library.protocols.create.protocolSource", { defaultValue: "Tổ chức ban hành" }))}</div>
                                        <Input
                                            value={editForm.protocolSource}
                                            onChange={(e) => setEditForm((s) => ({ ...s, protocolSource: e.target.value }))}
                                            placeholder={String(t("library.protocols.create.protocolSourcePlaceholder", { defaultValue: "Nguồn gốc" }))}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{String(t("library.protocols.create.protocolDescription", { defaultValue: "Mô tả / Ứng dụng" }))}</div>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editForm.protocolDescription}
                                        onChange={(e) => setEditForm((s) => ({ ...s, protocolDescription: e.target.value }))}
                                        placeholder={String(t("library.protocols.create.protocolDescriptionPlaceholder", { defaultValue: "Nhập mô tả phương pháp..." }))}
                                    />
                                </div>

                                {/* Accreditation */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{String(t("library.protocols.create.protocolAccreditation.title", { defaultValue: "Chứng nhận / Công nhận" }))}</div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant={editForm.accreditationVilas ? "default" : "outline"}
                                            onClick={() => setEditForm((s) => ({ ...s, accreditationVilas: !s.accreditationVilas }))}
                                        >
                                            {String(t("library.protocols.create.protocolAccreditation.vilas", { defaultValue: "VILAS" }))}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={editForm.accreditationTdc ? "default" : "outline"}
                                            onClick={() => setEditForm((s) => ({ ...s, accreditationTdc: !s.accreditationTdc }))}
                                        >
                                            {String(t("library.protocols.create.protocolAccreditation.tdc", { defaultValue: "TDC" }))}
                                        </Button>
                                    </div>
                                </div>

                                {/* Documents */}
                                <SearchSelectPicker
                                    label={String(t("library.protocols.create.documentIds", { defaultValue: "Tài liệu đính kèm" }))}
                                    selected={editForm.selectedDocuments}
                                    onChange={onDocumentsChange}
                                    onSearch={searchDocumentsFn}
                                    placeholder={String(t("documentCenter.headers.allDesc"))}
                                />

                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {String(t("library.protocols.create.uploadDocument", { defaultValue: "Tải lên tài liệu" }))}
                                    </Button>
                                </div>

                                {/* Chemical BOM Table */}
                                <div className="mt-6 border-t pt-4">
                                    <ChemicalBomTable items={editForm.chemicals} onChange={(items) => setEditForm((s) => ({ ...s, chemicals: items }))} disabled={isPending} />
                                </div>
                            </div>

                            {/* RIGHT — Matrices */}
                            <div className="w-[55%] overflow-y-auto p-5 space-y-5 bg-muted/5 relative">
                                {editForm.protocolId ? (
                                    <ProtocolMatrixManager protocolId={editForm.protocolId} currentProtocolChemicals={editForm.chemicals} />
                                ) : (
                                    <div className="flex items-center justify-center p-8 text-sm text-muted-foreground border border-dashed rounded-md h-full">
                                        {String(t("library.protocols.edit.saveProtocolFirst", { defaultValue: "Vui lòng lưu phương pháp trước khi quản lý ma trận nền mẫu." }))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                            {(createP.isError || updateP.isError) && (
                                <div className="text-sm text-destructive mr-auto">{String(t("library.protocols.create.error", { defaultValue: "Lỗi khi lưu phương pháp" }))}</div>
                            )}
                            <Button variant="outline" onClick={() => setEditOpen(false)} type="button">
                                {String(t("common.cancel", { defaultValue: "Hủy" }))}
                            </Button>
                            <Button
                                onClick={() => void submitForm()}
                                disabled={isPending || !String(editForm.protocolCode || "").trim() || !String(editForm.protocolSource || "").trim()}
                                type="button"
                            >
                                {isPending ? t("common.saving", { defaultValue: "Đang lưu..." }) : t("common.save", { defaultValue: "Lưu" })}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            <DocumentUploadModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        setEditForm((s) => ({
                            ...s,
                            documentIds: [...s.documentIds, doc.documentId],
                            selectedDocuments: [...s.selectedDocuments, { id: doc.documentId, label: doc.documentTitle || doc.documentId, sublabel: doc.documentId }],
                        }));
                    }
                }}
            />
        </div>
    );
}
