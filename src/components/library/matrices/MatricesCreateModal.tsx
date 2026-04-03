import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    useCreateMatrix,
    useParametersList,
    useProtocolsList,
    useSampleTypesList,
    useCreateParameter,
    useCreateProtocol,
    useCreateSampleType,
    type MatrixCreateBody,
    type Parameter,
    type Protocol,
    type SampleType,
    useProtocolFull,
    type ProtocolChemical,
    type ProtocolEquipment,
    type ProtocolLabTool,
} from "@/api/library";

import { SearchableSelect, type Option } from "@/components/common/SearchableSelect";
import { ChemicalBomTable, type ChemicalBomItem } from "../shared/ChemicalBomTable";
import { EquipmentSnapshotTable, type EquipmentSnapshotItem } from "../shared/EquipmentSnapshotTable";
import { LabToolSnapshotTable, type LabToolSnapshotItem } from "../shared/LabToolSnapshotTable";
import { ParameterFormModal } from "../parameters/ParameterFormModal";
import { SampleTypeFormModal } from "../sampleTypes/SampleTypeFormModal";
import { ProtocolFormModal } from "../protocols/ProtocolFormModal";
import { AccreditationTagInput, type AccreditationValue } from "../shared/AccreditationTagInput";

type Props = {
    open: boolean;
    onClose: () => void;
    lockedParameter?: { id: string; name: string };
    lockedProtocol?: { id: string; code: string; source: string; chemicals?: ProtocolChemical[] };
    lockedSampleType?: { id: string; name: string };
};

type FormState = {
    parameterId: string;
    parameterName: string;

    protocolId: string;
    protocolCode: string;
    protocolSource: string;

    accreditationKeys: AccreditationValue;

    sampleTypeId: string;
    sampleTypeName: string;

    technicianGroupId: string;

    feeBeforeTax: string;
    taxRate: string;
    feeAfterTax: string;

    turnaroundTime: string;
    LOD: string;
    LOQ: string;
    thresholdLimit: string;

    chemicals: ChemicalBomItem[];
    equipments: EquipmentSnapshotItem[];
    labTools: LabToolSnapshotItem[];
};

function initForm(props?: Props): FormState {
    return {
        parameterId: props?.lockedParameter?.id || "",
        parameterName: props?.lockedParameter?.name || "",

        protocolId: props?.lockedProtocol?.id || "",
        protocolCode: props?.lockedProtocol?.code || "",
        protocolSource: props?.lockedProtocol?.source || "",

        accreditationKeys: {},

        sampleTypeId: props?.lockedSampleType?.id || "",
        sampleTypeName: props?.lockedSampleType?.name || "",

        technicianGroupId: "",

        feeBeforeTax: "",
        taxRate: "",
        feeAfterTax: "",

        turnaroundTime: "",
        LOD: "",
        LOQ: "",
        thresholdLimit: "",

        chemicals: [],
        equipments: [],
        labTools: [],
    };
}

function parseFiniteNumber(raw: string): number | null {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(raw: string): number | null {
    if (!raw.trim().length) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
}

function useLocalDebouncedValue(value: string, ms: number) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setV(value), ms);
        return () => window.clearTimeout(t);
    }, [value, ms]);
    return v;
}

function SectionTitle(props: { children: React.ReactNode }) {
    return <div className="text-sm font-semibold text-foreground">{props.children}</div>;
}

function FieldLabel(props: { children: React.ReactNode }) {
    return <div className="text-xs text-muted-foreground">{props.children}</div>;
}

function toParameterOption(p: Parameter): Option {
    return { value: p.parameterId, label: `[${p.parameterId}] ${p.parameterName}`, keywords: p.parameterName };
}

function toProtocolOption(p: Protocol): Option {
    return { value: p.protocolId, label: `[${p.protocolId}] ${p.protocolCode}`, keywords: `${p.protocolSource}` };
}

function toSampleTypeOption(s: SampleType): Option {
    return { value: s.sampleTypeId, label: `[${s.sampleTypeId}] ${s.sampleTypeName}`, keywords: s.sampleTypeName };
}

export function MatricesCreateModal(props: Props) {
    const { t } = useTranslation();
    const { open, onClose } = props;

    const createM = useCreateMatrix();
    const createParameter = useCreateParameter();
    const createProtocol = useCreateProtocol();
    const createSampleType = useCreateSampleType();

    const [form, setForm] = useState<FormState>(() => initForm(props));

    const [parameterSearch, setParameterSearch] = useState("");
    const [protocolSearch, setProtocolSearch] = useState("");
    const [sampleTypeSearch, setSampleTypeSearch] = useState("");

    const [openParameterModal, setOpenParameterModal] = useState(false);
    const [openSampleTypeModal, setOpenSampleTypeModal] = useState(false);
    const [openProtocolModal, setOpenProtocolModal] = useState(false);
    const [editParameterId, setEditParameterId] = useState<string | null>(null);
    const [editSampleTypeId, setEditSampleTypeId] = useState<string | null>(null);
    const [editProtocolId, setEditProtocolId] = useState<string | null>(null);

    const [createParameterName, setCreateParameterName] = useState<string>("");
    const [createSampleTypeName, setCreateSampleTypeName] = useState<string>("");
    const [createProtocolCode, setCreateProtocolCode] = useState<string>("");

    const debouncedParameterSearch = useLocalDebouncedValue(parameterSearch, 250);
    const debouncedProtocolSearch = useLocalDebouncedValue(protocolSearch, 250);
    const debouncedSampleTypeSearch = useLocalDebouncedValue(sampleTypeSearch, 250);

    const protocolFullQ = useProtocolFull(form.protocolId);
    const [protocolSnapshotChemicals, setProtocolSnapshotChemicals] = useState<ProtocolChemical[]>([]);
    const [protocolSnapshotEquipments, setProtocolSnapshotEquipments] = useState<ProtocolEquipment[]>([]);
    const [protocolSnapshotLabTools, setProtocolSnapshotLabTools] = useState<ProtocolLabTool[]>([]);

    useEffect(() => {
        if (props.open) {
            setForm(initForm(props));
        }
    }, [props.open]);

    useEffect(() => {
        if (props.lockedProtocol?.chemicals) {
            setProtocolSnapshotChemicals(props.lockedProtocol.chemicals);
        } else if (protocolFullQ.data?.chemicals) {
            setProtocolSnapshotChemicals(protocolFullQ.data.chemicals);
        } else {
            setProtocolSnapshotChemicals([]);
        }

        if (protocolFullQ.data?.equipments) {
            setProtocolSnapshotEquipments(protocolFullQ.data.equipments);
        } else {
            setProtocolSnapshotEquipments([]);
        }

        if (protocolFullQ.data?.labTools) {
            setProtocolSnapshotLabTools(protocolFullQ.data.labTools);
        } else {
            setProtocolSnapshotLabTools([]);
        }
    }, [protocolFullQ.data, props.lockedProtocol]);

    const handleLoadChemicals = () => {
        if (protocolSnapshotChemicals.length > 0) {
            setForm((s) => ({
                ...s,
                chemicals: protocolSnapshotChemicals.map((c) => ({
                    chemicalSkuId: c.chemicalSkuId,
                    chemicalName: c.chemicalName,
                    consumedQty: c.consumedQty || "",
                    unit: c.chemicalBaseUnit || c.unit || "",
                })),
            }));
        }
    };

    const handleLoadEquipments = () => {
        if (protocolSnapshotEquipments.length > 0) {
            setForm((s) => ({
                ...s,
                equipments: protocolSnapshotEquipments.map((e) => ({
                    equipmentId: e.equipmentId,
                    equipmentName: e.equipmentName,
                    equipmentType: e.equipmentType || null,
                })),
            }));
        }
    };

    const handleLoadLabTools = () => {
        if (protocolSnapshotLabTools.length > 0) {
            setForm((s) => ({
                ...s,
                labTools: protocolSnapshotLabTools.map((l) => ({
                    labToolId: l.labToolId,
                    labToolName: l.labToolName,
                    labToolType: l.labToolType || null,
                })),
            }));
        }
    };

    const parametersQ = useParametersList({
        query: {
            page: 1,
            itemsPerPage: 50,
            search: debouncedParameterSearch.trim().length ? debouncedParameterSearch.trim() : null,
        },
    });

    const protocolsQ = useProtocolsList({
        query: {
            page: 1,
            itemsPerPage: 50,
            search: debouncedProtocolSearch.trim().length ? debouncedProtocolSearch.trim() : null,
        },
    });

    const sampleTypesQ = useSampleTypesList({
        query: {
            page: 1,
            itemsPerPage: 50,
            search: debouncedSampleTypeSearch.trim().length ? debouncedSampleTypeSearch.trim() : null,
        },
    });

    const parameterItems = (parametersQ.data?.data ?? []) as Parameter[];
    const protocolItems = (protocolsQ.data?.data ?? []) as Protocol[];
    const sampleTypeItems = (sampleTypesQ.data?.data ?? []) as SampleType[];

    const parameterOptions = useMemo(() => parameterItems.map(toParameterOption), [parameterItems]);
    const protocolOptions = useMemo(() => protocolItems.map(toProtocolOption), [protocolItems]);
    const sampleTypeOptions = useMemo(() => sampleTypeItems.map(toSampleTypeOption), [sampleTypeItems]);

    const feeBeforeTaxNum = useMemo(() => parseFiniteNumber(form.feeBeforeTax), [form.feeBeforeTax]);
    const taxRateNum = useMemo(() => parseFiniteNumber(form.taxRate), [form.taxRate]);

    const canAutoCalcFeeAfterTax = useMemo(() => {
        if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;
        if (taxRateNum === null || taxRateNum < 0) return false;
        return true;
    }, [feeBeforeTaxNum, taxRateNum]);

    useEffect(() => {
        if (!open) return;
        if (!canAutoCalcFeeAfterTax) return;

        const computed = Math.round((feeBeforeTaxNum as number) * (1 + (taxRateNum as number) / 100));
        const next = String(computed);

        setForm((s) => (s.feeAfterTax === next ? s : { ...s, feeAfterTax: next }));
    }, [open, canAutoCalcFeeAfterTax, feeBeforeTaxNum, taxRateNum]);

    const canSave = useMemo(() => {
        if (!form.parameterId.trim()) return false;
        if (!form.protocolId.trim()) return false;
        if (!form.sampleTypeId.trim()) return false;

        if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;

        const hasTaxRate = form.taxRate.trim().length > 0;
        if (hasTaxRate && (taxRateNum === null || taxRateNum < 0)) return false;

        const feeAfterTax = parseFiniteNumber(form.feeAfterTax);
        if (feeAfterTax === null || feeAfterTax < 0) return false;

        const turnaroundTime = parseOptionalInt(form.turnaroundTime);
        if (turnaroundTime !== null && turnaroundTime < 0) return false;

        return true;
    }, [form, feeBeforeTaxNum, taxRateNum]);

    const resetAndClose = () => {
        setForm(initForm(props));
        setParameterSearch("");
        setProtocolSearch("");
        setSampleTypeSearch("");
        onClose();
    };

    const onPickParameter = async (idOrVal: string | null) => {
        if (!idOrVal) {
            setForm((s) => ({ ...s, parameterId: "", parameterName: "" }));
            return;
        }
        const found = parameterItems.find((x) => x.parameterId === idOrVal);
        if (found) {
            setForm((s) => ({
                ...s,
                parameterId: idOrVal,
                parameterName: found.parameterName ?? "",
            }));
        } else {
            setCreateParameterName(idOrVal);
            setEditParameterId(null);
            setOpenParameterModal(true);
        }
    };

    const handleCreateNewParameter = (searchVal: string) => {
        setCreateParameterName(searchVal);
        setEditParameterId(null);
        setOpenParameterModal(true);
    };

    const onPickSampleType = async (idOrVal: string | null) => {
        if (!idOrVal) {
            setForm((s) => ({ ...s, sampleTypeId: "", sampleTypeName: "" }));
            return;
        }
        const found = sampleTypeItems.find((x) => x.sampleTypeId === idOrVal);
        if (found) {
            setForm((s) => ({
                ...s,
                sampleTypeId: idOrVal,
                sampleTypeName: found.sampleTypeName ?? "",
            }));
        } else {
            setCreateSampleTypeName(idOrVal);
            setEditSampleTypeId(null);
            setOpenSampleTypeModal(true);
        }
    };

    const handleCreateNewSampleType = (searchVal: string) => {
        setCreateSampleTypeName(searchVal);
        setEditSampleTypeId(null);
        setOpenSampleTypeModal(true);
    };

    const onPickProtocol = async (idOrVal: string | null) => {
        if (!idOrVal) {
            setForm((s) => ({
                ...s,
                protocolId: "",
                protocolCode: "",
                protocolSource: "",
                accreditationKeys: {},
            }));
            return;
        }
        const found = protocolItems.find((x) => x.protocolId === idOrVal);

        if (found) {
            setForm((s) => ({
                ...s,
                protocolId: idOrVal,
                protocolCode: found.protocolCode ?? "",
                protocolSource: found.protocolSource ?? "",
                accreditationKeys: (found.protocolAccreditation as Record<string, boolean>) ?? {},
            }));
        } else {
            setCreateProtocolCode(idOrVal);
            setEditProtocolId(null);
            setOpenProtocolModal(true);
        }
    };

    const handleCreateNewProtocol = (searchVal: string) => {
        setCreateProtocolCode(searchVal);
        setEditProtocolId(null);
        setOpenProtocolModal(true);
    };

    const submit = async () => {
        if (!canSave) return;

        const feeBeforeTax = parseFiniteNumber(form.feeBeforeTax);
        if (feeBeforeTax === null) return;

        const taxRate = form.taxRate.trim().length ? parseFiniteNumber(form.taxRate) : null;

        const feeAfterTaxComputed = canAutoCalcFeeAfterTax && taxRateNum !== null && feeBeforeTaxNum !== null ? Math.round(feeBeforeTaxNum * (1 + taxRateNum / 100)) : null;

        const feeAfterTax = feeAfterTaxComputed !== null ? feeAfterTaxComputed : parseFiniteNumber(form.feeAfterTax);

        if (feeAfterTax === null) return;

        const turnaroundTime = parseOptionalInt(form.turnaroundTime);

        const body: MatrixCreateBody = {
            parameterId: form.parameterId.trim(),
            protocolId: form.protocolId.trim(),
            sampleTypeId: form.sampleTypeId.trim(),

            parameterName: form.parameterName.trim().length ? form.parameterName.trim() : null,
            sampleTypeName: form.sampleTypeName.trim().length ? form.sampleTypeName.trim() : null,
            protocolCode: form.protocolCode.trim().length ? form.protocolCode.trim() : null,
            protocolSource: form.protocolSource.trim().length ? form.protocolSource.trim() : null,

            feeBeforeTax,
            taxRate: taxRate ?? undefined,
            feeAfterTax,

            turnaroundTime: turnaroundTime,
            LOD: form.LOD.trim() || undefined,
            LOQ: form.LOQ.trim() || undefined,
            thresholdLimit: form.thresholdLimit.trim() || undefined,

            technicianGroupId: form.technicianGroupId.trim() || undefined,

            protocolAccreditation: Object.keys(form.accreditationKeys).length > 0 ? form.accreditationKeys : undefined,
            chemicals: form.chemicals.map((c) => ({
                chemicalSkuId: c.chemicalSkuId || "",
                chemicalName: c.chemicalName,
                consumedQty: c.consumedQty || "",
                chemicalBaseUnit: c.unit || "",
            })),
            equipmentIds: form.equipments.map(e => e.equipmentId).filter(Boolean),
            equipments: form.equipments,
            labToolIds: form.labTools.map(l => l.labToolId).filter(Boolean),
            labTools: form.labTools,
        };

        await createM.mutateAsync({ body });
        resetAndClose();
    };

    const resetKey = open ? "open" : "closed";

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg border border-border w-[95vw] md:w-[80vw] h-[90vh] max-w-none shadow-xl flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background z-10">
                    <div className="text-base font-semibold text-foreground">{String(t("library.matrices.create.title"))}</div>
                    <Button variant="ghost" size="sm" onClick={resetAndClose} type="button">
                        {String(t("common.close"))}
                    </Button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
                    {/* LEFT COLUMN: Pricing, Limits, Accreditation */}
                    <div className="space-y-6 min-w-0 pr-4">
                        <div className="space-y-3">
                            <SectionTitle>{String(t("library.matrices.create.pricing"))}</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.feeBeforeTax"))}</FieldLabel>
                                    <Input inputMode="numeric" value={form.feeBeforeTax} onChange={(e) => setForm((s) => ({ ...s, feeBeforeTax: e.target.value }))} disabled={createM.isPending} />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.taxRate"))}</FieldLabel>
                                    <Input inputMode="numeric" value={form.taxRate} onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))} disabled={createM.isPending} />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.feeAfterTax"))}</FieldLabel>
                                    <Input
                                        inputMode="numeric"
                                        value={form.feeAfterTax}
                                        disabled={createM.isPending || canAutoCalcFeeAfterTax}
                                        onChange={(e) => setForm((s) => ({ ...s, feeAfterTax: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <SectionTitle>{String(t("library.matrices.create.limits"))}</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.LOD"))}</FieldLabel>
                                    <Input value={form.LOD} onChange={(e) => setForm((s) => ({ ...s, LOD: e.target.value }))} disabled={createM.isPending} />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.LOQ"))}</FieldLabel>
                                    <Input value={form.LOQ} onChange={(e) => setForm((s) => ({ ...s, LOQ: e.target.value }))} disabled={createM.isPending} />
                                </div>
                                <div className="space-y-1 min-w-0 md:col-span-2">
                                    <FieldLabel>{String(t("library.matrices.thresholdLimit"))}</FieldLabel>
                                    <Input value={form.thresholdLimit} onChange={(e) => setForm((s) => ({ ...s, thresholdLimit: e.target.value }))} disabled={createM.isPending} />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.turnaroundTime"))}</FieldLabel>
                                    <Input inputMode="numeric" value={form.turnaroundTime} onChange={(e) => setForm((s) => ({ ...s, turnaroundTime: e.target.value }))} disabled={createM.isPending} />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.technicianGroupId", { defaultValue: "ID nhóm KTV" }))}</FieldLabel>
                                    <Input value={form.technicianGroupId} onChange={(e) => setForm((s) => ({ ...s, technicianGroupId: e.target.value }))} disabled={createM.isPending} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-border mt-6">
                            <SectionTitle>{String(t("library.matrices.protocolAccreditation", { defaultValue: "Phạm vi công nhận" }))}</SectionTitle>
                            <AccreditationTagInput
                                value={form.accreditationKeys}
                                onChange={(v) => setForm((s) => ({ ...s, accreditationKeys: v }))}
                                disabled={createM.isPending}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Parameter/Sample/Protocol/Chemicals */}
                    <div className="space-y-6 min-w-0 border-l pl-4 border-border flex flex-col">
                        <div className="space-y-3">
                            <SectionTitle>{String(t("library.matrices.create.sampleParameter", { defaultValue: "Thông tin chỉ tiêu" }))}</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.parameterId"))}</FieldLabel>
                                    <div className="flex gap-2 items-center">
                                        {props.lockedParameter ? (
                                            <Input value={`[${props.lockedParameter.id}] ${props.lockedParameter.name}`} disabled />
                                        ) : (
                                            <div className="flex-1 min-w-0">
                                                <SearchableSelect
                                                    value={form.parameterId || null}
                                                    options={parameterOptions}
                                                    placeholder={String(t("library.parameters.searchPlaceholder"))}
                                                    searchPlaceholder={String(t("library.parameters.searchPlaceholder"))}
                                                    loading={parametersQ.isLoading || createParameter.isPending}
                                                    error={parametersQ.isError}
                                                    disabled={createM.isPending}
                                                    onChange={(v) => void onPickParameter(v)}
                                                    resetKey={resetKey}
                                                    filterMode="server"
                                                    searchValue={parameterSearch}
                                                    onSearchChange={setParameterSearch}
                                                    onCreateNew={handleCreateNewParameter}
                                                    allowCustomValue
                                                />
                                            </div>
                                        )}
                                        {form.parameterId && !props.lockedParameter && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                title={String(t("library.parameters.edit.title", { defaultValue: "Sửa chỉ tiêu" }))}
                                                onClick={() => {
                                                    setEditParameterId(form.parameterId);
                                                    setOpenParameterModal(true);
                                                }}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.parameterName"))}</FieldLabel>
                                    <Input value={form.parameterName} disabled />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.sampleTypeId"))}</FieldLabel>
                                    <div className="flex gap-2 items-center">
                                        {props.lockedSampleType ? (
                                            <Input value={`[${props.lockedSampleType.id}] ${props.lockedSampleType.name}`} disabled />
                                        ) : (
                                            <div className="flex-1 min-w-0">
                                                <SearchableSelect
                                                    value={form.sampleTypeId || null}
                                                    options={sampleTypeOptions}
                                                    placeholder={String(t("library.sampleTypes.searchPlaceholder"))}
                                                    searchPlaceholder={String(t("library.sampleTypes.searchPlaceholder"))}
                                                    loading={sampleTypesQ.isLoading || createSampleType.isPending}
                                                    error={sampleTypesQ.isError}
                                                    disabled={createM.isPending}
                                                    onChange={(v) => void onPickSampleType(v)}
                                                    resetKey={resetKey}
                                                    filterMode="server"
                                                    searchValue={sampleTypeSearch}
                                                    onSearchChange={setSampleTypeSearch}
                                                    onCreateNew={handleCreateNewSampleType}
                                                    allowCustomValue
                                                />
                                            </div>
                                        )}
                                        {form.sampleTypeId && !props.lockedSampleType && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                title={String(t("library.sampleTypes.edit.title", { defaultValue: "Sửa dạng mẫu" }))}
                                                onClick={() => {
                                                    setEditSampleTypeId(form.sampleTypeId);
                                                    setOpenSampleTypeModal(true);
                                                }}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.sampleTypeName"))}</FieldLabel>
                                    <Input value={form.sampleTypeName} disabled />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <SectionTitle>{String(t("library.matrices.create.protocol"))}</SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.protocolId"))}</FieldLabel>
                                    <div className="flex gap-2 items-center">
                                        {props.lockedProtocol ? (
                                            <Input value={`[${props.lockedProtocol.id}] ${props.lockedProtocol.code}`} disabled />
                                        ) : (
                                            <div className="flex-1 min-w-0">
                                                <SearchableSelect
                                                    value={form.protocolId || null}
                                                    options={protocolOptions}
                                                    placeholder={String(t("library.protocols.searchPlaceholder"))}
                                                    searchPlaceholder={String(t("library.protocols.searchPlaceholder"))}
                                                    loading={protocolsQ.isLoading || createProtocol.isPending}
                                                    error={protocolsQ.isError}
                                                    disabled={createM.isPending}
                                                    onChange={(v) => void onPickProtocol(v)}
                                                    resetKey={resetKey}
                                                    filterMode="server"
                                                    searchValue={protocolSearch}
                                                    onSearchChange={setProtocolSearch}
                                                    onCreateNew={handleCreateNewProtocol}
                                                    allowCustomValue
                                                />
                                            </div>
                                        )}
                                        {form.protocolId && !props.lockedProtocol && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                title={String(t("library.protocols.edit.title", { defaultValue: "Sửa phương pháp" }))}
                                                onClick={() => {
                                                    setEditProtocolId(form.protocolId);
                                                    setOpenProtocolModal(true);
                                                }}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <FieldLabel>{String(t("library.matrices.protocolCode"))}</FieldLabel>
                                    <Input value={form.protocolCode} disabled />
                                </div>
                                <div className="space-y-1 min-w-0 md:col-span-2">
                                    <FieldLabel>{String(t("library.matrices.protocolSource"))}</FieldLabel>
                                    <Input value={form.protocolSource} disabled />
                                </div>

                                {form.protocolId && protocolSnapshotChemicals.length > 0 && (
                                    <div className="space-y-2 min-w-0 mt-4 md:col-span-2">
                                        <FieldLabel>{String(t("library.matrices.protocolChemicals", { defaultValue: "Hóa chất theo phương pháp" }))}</FieldLabel>
                                        <div className="bg-muted/30 border border-border rounded p-3 space-y-1">
                                            {protocolSnapshotChemicals.map((c, idx) => (
                                                <div key={idx} className="text-xs flex justify-between items-center text-muted-foreground italic">
                                                    <span>
                                                        • {c.chemicalName} {c.chemicalSkuId ? `(${c.chemicalSkuId})` : ""}
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        {c.consumedQty} {c.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1 min-w-0 flex-1 flex flex-col pt-6 border-t border-border mt-6">
                            <SectionTitle>{String(t("library.matrices.create.chemicals", { defaultValue: "Hóa chất" }))}</SectionTitle>
                            <div className="flex-1 min-h-[250px]">
                                <ChemicalBomTable
                                    items={form.chemicals}
                                    onChange={(chemicals) => setForm((s) => ({ ...s, chemicals }))}
                                    onLoadFromProtocol={handleLoadChemicals}
                                />
                            </div>
                        </div>

                        <div className="space-y-1 min-w-0 flex-1 flex flex-col pt-6 border-t border-border mt-6">
                            <SectionTitle>{String(t("library.matrices.create.equipments", { defaultValue: "Thiết bị" }))}</SectionTitle>
                            <div className="flex-1 min-h-[250px]">
                                <EquipmentSnapshotTable
                                    items={form.equipments}
                                    onChange={(equipments) => setForm((s) => ({ ...s, equipments }))}
                                    onLoadFromProtocol={handleLoadEquipments}
                                />
                            </div>
                        </div>

                        <div className="space-y-1 min-w-0 flex-1 flex flex-col pt-6 border-t border-border mt-6">
                            <SectionTitle>{String(t("library.matrices.create.labTools", { defaultValue: "Dụng cụ" }))}</SectionTitle>
                            <div className="flex-1 min-h-[250px]">
                                <LabToolSnapshotTable
                                    items={form.labTools}
                                    onChange={(labTools) => setForm((s) => ({ ...s, labTools }))}
                                    onLoadFromProtocol={handleLoadLabTools}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-border flex justify-end gap-3 shrink-0 bg-background z-10">
                    <Button variant="outline" onClick={resetAndClose} type="button">
                        {String(t("common.cancel"))}
                    </Button>
                    <Button onClick={() => void submit()} disabled={!canSave || createM.isPending} type="button">
                        {createM.isPending ? t("common.saving") : t("common.save")}
                    </Button>
                </div>
            </div>

            {openParameterModal && (
                <ParameterFormModal
                    onClose={() => {
                        setOpenParameterModal(false);
                        setEditParameterId(null);
                    }}
                    parameterId={editParameterId || undefined}
                    initialData={!editParameterId ? { parameterName: createParameterName } : undefined}
                    onSuccess={(p: any) => {
                        setForm((s) => ({ ...s, parameterId: p.parameterId, parameterName: p.parameterName }));
                    }}
                />
            )}

            {openSampleTypeModal && (
                <SampleTypeFormModal
                    onClose={() => {
                        setOpenSampleTypeModal(false);
                        setEditSampleTypeId(null);
                    }}
                    sampleTypeId={editSampleTypeId || undefined}
                    initialData={!editSampleTypeId ? { sampleTypeName: createSampleTypeName, displayEng: "", displayDefault: "" } : undefined}
                    onSuccess={(p: any) => {
                        setForm((s) => ({ ...s, sampleTypeId: p.sampleTypeId, sampleTypeName: p.sampleTypeName }));
                    }}
                />
            )}

            {openProtocolModal && (
                <ProtocolFormModal
                    onClose={() => {
                        setOpenProtocolModal(false);
                        setEditProtocolId(null);
                    }}
                    protocolId={editProtocolId || undefined}
                    initialData={!editProtocolId ? { protocolCode: createProtocolCode } : undefined}
                    onSuccess={(p: any) => {
                        setForm((s) => ({
                            ...s,
                            protocolId: p.protocolId,
                            protocolCode: p.protocolCode || p.protocolId,
                            protocolSource: p.protocolSource || "Unknown",
                            accreditationKeys: (p.protocolAccreditation as Record<string, boolean>) ?? {},
                        }));
                    }}
                />
            )}
        </div>
    );
}
