import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";

import {
    useMatrixFull,
    useUpdateMatrix,
    useParametersList,
    useProtocolsList,
    useSampleTypesList,
    useCreateParameter,
    useCreateSampleType,
    useCreateProtocol,
    type ProtocolChemical,
    type MatrixPatch,
    type Parameter,
    type Protocol,
    type SampleType,
} from "@/api/library";

import { SearchableSelect, type Option } from "@/components/common/SearchableSelect";
import { ChemicalBomTable, type ChemicalBomItem } from "../shared/ChemicalBomTable";
import { ParameterFormModal } from "../parameters/ParameterFormModal";
import { SampleTypeFormModal } from "../sampleTypes/SampleTypeFormModal";
import { ProtocolFormModal } from "../protocols/ProtocolFormModal";

import { toFormNumberString } from "./matrixFormat";

type Props = {
    open: boolean;
    matrixId: string | null;
    onClose: () => void;
    lockedParameterId?: string;
    lockedProtocolId?: string;
    lockedSampleTypeId?: string;
};

type FormState = {
    parameterId: string;
    parameterName: string;

    protocolId: string;
    protocolCode: string;
    protocolSource: string;

    accreditationVILAS: boolean;
    accreditationTDC: boolean;

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
};

function initForm(): FormState {
    return {
        parameterId: "",
        parameterName: "",
        protocolId: "",
        protocolCode: "",
        protocolSource: "",
        accreditationVILAS: false,
        accreditationTDC: false,
        sampleTypeId: "",
        sampleTypeName: "",
        technicianGroupId: "",
        feeBeforeTax: "",
        taxRate: "",
        feeAfterTax: "",
        turnaroundTime: "",
        LOD: "",
        LOQ: "",
        thresholdLimit: "",
        chemicals: [],
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

function useDebouncedValue(value: string, ms: number) {
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

export function MatricesEditModal(props: Props) {
    const { t } = useTranslation();
    const { open, matrixId, onClose } = props;

    const detailQ = useMatrixFull(matrixId);
    const updateM = useUpdateMatrix();

    const createParameter = useCreateParameter();
    const createSampleType = useCreateSampleType();
    const createProtocol = useCreateProtocol();

    const [form, setForm] = useState<FormState>(() => initForm());
    const [baseline, setBaseline] = useState<FormState | null>(null);

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

    const [protocolSnapshotChemicals, setProtocolSnapshotChemicals] = useState<ProtocolChemical[]>([]);

    useEffect(() => {
        if (!detailQ.data?.protocol?.chemicals) {
            setProtocolSnapshotChemicals([]);
            return;
        }
        setProtocolSnapshotChemicals(detailQ.data.protocol.chemicals);
    }, [detailQ.data]);

    const handleLoadChemicals = () => {
        if (protocolSnapshotChemicals.length > 0) {
            setForm((s) => ({
                ...s,
                chemicals: protocolSnapshotChemicals.map((c) => ({
                    chemicalSkuId: c.chemicalSkuId,
                    chemicalName: c.chemicalName,
                    consumedQty: c.consumedQty || "",
                    unit: c.unit || "",
                })),
            }));
        } else {
            setForm((s) => ({ ...s, chemicals: [] }));
        }
    };

    const debouncedParameterSearch = useDebouncedValue(parameterSearch, 250);
    const debouncedProtocolSearch = useDebouncedValue(protocolSearch, 250);
    const debouncedSampleTypeSearch = useDebouncedValue(sampleTypeSearch, 250);

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

    const parameterOptions = useMemo(() => {
        const opts = parameterItems.map(toParameterOption);
        if (form.parameterId && form.parameterName && !opts.find((x) => x.value === form.parameterId)) {
            opts.unshift({ value: form.parameterId, label: `${form.parameterId} - ${form.parameterName}`, keywords: form.parameterName });
        }
        return opts;
    }, [parameterItems, form.parameterId, form.parameterName]);

    const protocolOptions = useMemo(() => {
        const opts = protocolItems.map(toProtocolOption);
        if (form.protocolId && form.protocolCode && !opts.find((x) => x.value === form.protocolId)) {
            opts.unshift({ value: form.protocolId, label: `${form.protocolId} - ${form.protocolCode}`, keywords: form.protocolSource });
        }
        return opts;
    }, [protocolItems, form.protocolId, form.protocolCode, form.protocolSource]);

    const sampleTypeOptions = useMemo(() => {
        const opts = sampleTypeItems.map(toSampleTypeOption);
        if (form.sampleTypeId && form.sampleTypeName && !opts.find((x) => x.value === form.sampleTypeId)) {
            opts.unshift({ value: form.sampleTypeId, label: `${form.sampleTypeId} - ${form.sampleTypeName}`, keywords: form.sampleTypeName });
        }
        return opts;
    }, [sampleTypeItems, form.sampleTypeId, form.sampleTypeName]);

    useEffect(() => {
        if (!open) return;
        const m = detailQ.data;
        if (!m) return;

        const next: FormState = {
            parameterId: m.parameterId,
            parameterName: m.parameterName || "",
            protocolId: m.protocolId,
            protocolCode: m.protocolCode || "",
            protocolSource: m.protocolSource || "",
            accreditationVILAS: Boolean(m.protocolAccreditation?.VILAS),
            accreditationTDC: Boolean(m.protocolAccreditation?.TDC),
            sampleTypeId: m.sampleTypeId,
            sampleTypeName: m.sampleTypeName || "",
            technicianGroupId: m.technicianGroupId || "",
            feeBeforeTax: toFormNumberString(m.feeBeforeTax),
            taxRate: m.taxRate != null ? String(m.taxRate) : "",
            feeAfterTax: toFormNumberString(m.feeAfterTax),
            turnaroundTime: m.turnaroundTime != null ? String(m.turnaroundTime) : "",
            LOD: m.LOD || "",
            LOQ: m.LOQ || "",
            thresholdLimit: m.thresholdLimit || "",
            chemicals: Array.isArray(m.chemicals)
                ? m.chemicals.map((c) => ({
                      chemicalSkuId: c.chemicalSkuId,
                      chemicalName: c.chemicalName,
                      consumedQty: c.consumedQty || "",
                      unit: c.unit || "",
                  }))
                : [],
        };

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(next);
        setBaseline(next);
    }, [open, detailQ.data]);

    const feeBeforeTaxNum = useMemo(() => parseFiniteNumber(form.feeBeforeTax), [form.feeBeforeTax]);
    const taxRateNum = useMemo(() => parseFiniteNumber(form.taxRate), [form.taxRate]);

    const canAutoCalcFeeAfterTax = useMemo(() => {
        if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;
        if (taxRateNum === null || taxRateNum < 0) return false;
        return true;
    }, [feeBeforeTaxNum, taxRateNum]);

    useEffect(() => {
        if (!open || !baseline) return;
        if (!canAutoCalcFeeAfterTax) return;

        const computed = Math.round((feeBeforeTaxNum as number) * (1 + (taxRateNum as number) / 100));
        const next = String(computed);

        // auto calc only if tax/fee changed to avoid wiping user manual input on initial load
        if (form.feeBeforeTax !== baseline.feeBeforeTax || form.taxRate !== baseline.taxRate) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setForm((s) => (s.feeAfterTax === next ? s : { ...s, feeAfterTax: next }));
        }
    }, [open, canAutoCalcFeeAfterTax, feeBeforeTaxNum, taxRateNum, baseline, form.feeBeforeTax, form.taxRate]);

    const canSave = useMemo(() => {
        if (!matrixId || !baseline) return false;
        if (!form.parameterId.trim() || !form.protocolId.trim() || !form.sampleTypeId.trim()) return false;

        if (feeBeforeTaxNum === null || feeBeforeTaxNum < 0) return false;

        const hasTaxRate = form.taxRate.trim().length > 0;
        if (hasTaxRate && (taxRateNum === null || taxRateNum < 0)) return false;

        const feeAfterTax = parseFiniteNumber(form.feeAfterTax);
        if (feeAfterTax === null || feeAfterTax < 0) return false;

        const turnaroundTime = parseOptionalInt(form.turnaroundTime);
        if (turnaroundTime !== null && turnaroundTime < 0) return false;

        return (
            form.parameterId !== baseline.parameterId ||
            form.protocolId !== baseline.protocolId ||
            form.sampleTypeId !== baseline.sampleTypeId ||
            form.feeBeforeTax !== baseline.feeBeforeTax ||
            form.taxRate !== baseline.taxRate ||
            form.feeAfterTax !== baseline.feeAfterTax ||
            form.turnaroundTime !== baseline.turnaroundTime ||
            form.LOD !== baseline.LOD ||
            form.LOQ !== baseline.LOQ ||
            form.thresholdLimit !== baseline.thresholdLimit ||
            form.technicianGroupId !== baseline.technicianGroupId ||
            form.accreditationVILAS !== baseline.accreditationVILAS ||
            form.accreditationTDC !== baseline.accreditationTDC ||
            JSON.stringify(form.chemicals) !== JSON.stringify(baseline.chemicals)
        );
    }, [form, feeBeforeTaxNum, taxRateNum, matrixId, baseline]);

    const resetAndClose = () => {
        setForm(initForm());
        setBaseline(null);
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
            setForm((s) => ({ ...s, parameterId: found.parameterId, parameterName: found.parameterName }));
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
            setForm((s) => ({ ...s, sampleTypeId: found.sampleTypeId, sampleTypeName: found.sampleTypeName }));
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
                accreditationTDC: false,
                accreditationVILAS: false,
            }));
            return;
        }
        const found = protocolItems.find((x) => x.protocolId === idOrVal);
        if (found) {
            setForm((s) => ({
                ...s,
                protocolId: found.protocolId,
                protocolCode: found.protocolCode || "",
                protocolSource: found.protocolSource || "",
                accreditationTDC: Boolean(found.protocolAccreditation?.TDC),
                accreditationVILAS: Boolean(found.protocolAccreditation?.VILAS),
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
        if (!canSave || !matrixId || !baseline) return;

        const patch: MatrixPatch = {};

        if (form.parameterId !== baseline.parameterId) patch.parameterId = form.parameterId;
        if (form.protocolId !== baseline.protocolId) patch.protocolId = form.protocolId;
        if (form.sampleTypeId !== baseline.sampleTypeId) patch.sampleTypeId = form.sampleTypeId;

        if (form.feeBeforeTax !== baseline.feeBeforeTax) patch.feeBeforeTax = parseFiniteNumber(form.feeBeforeTax) ?? undefined;
        if (form.taxRate !== baseline.taxRate) patch.taxRate = form.taxRate.trim().length ? parseFiniteNumber(form.taxRate) : null;
        if (form.feeAfterTax !== baseline.feeAfterTax) patch.feeAfterTax = parseFiniteNumber(form.feeAfterTax) ?? undefined;

        if (form.turnaroundTime !== baseline.turnaroundTime) patch.turnaroundTime = parseOptionalInt(form.turnaroundTime);
        if (form.LOD !== baseline.LOD) patch.LOD = form.LOD.trim() || null;
        if (form.LOQ !== baseline.LOQ) patch.LOQ = form.LOQ.trim() || null;
        if (form.thresholdLimit !== baseline.thresholdLimit) patch.thresholdLimit = form.thresholdLimit.trim() || null;
        if (form.technicianGroupId !== baseline.technicianGroupId) patch.technicianGroupId = form.technicianGroupId.trim() || null;

        const hasAccChange = form.accreditationVILAS !== baseline.accreditationVILAS || form.accreditationTDC !== baseline.accreditationTDC;
        if (hasAccChange) {
            patch.protocolAccreditation = form.accreditationVILAS || form.accreditationTDC ? { VILAS: form.accreditationVILAS, TDC: form.accreditationTDC } : undefined;
        }

        const formattedChemicals = form.chemicals.map((c) => ({
            chemicalSkuId: c.chemicalSkuId || "",
            chemicalName: c.chemicalName,
            consumedQty: c.consumedQty || "",
            unit: c.unit || "",
        }));

        const baselineChemicals = baseline.chemicals.map((c) => ({
            chemicalSkuId: c.chemicalSkuId || "",
            chemicalName: c.chemicalName,
            consumedQty: c.consumedQty || "",
            unit: c.unit || "",
        }));

        if (JSON.stringify(formattedChemicals) !== JSON.stringify(baselineChemicals)) {
            patch.chemicals = formattedChemicals;
        }

        if (Object.keys(patch).length === 0) return;

        await updateM.mutateAsync({
            params: { matrixId },
            patch,
        });

        resetAndClose();
    };

    const resetKey = open ? "open" : "closed";

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg border border-border w-[95vw] md:w-[80vw] h-[90vh] max-w-none shadow-xl flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background z-10">
                    <div className="text-base font-semibold text-foreground">{String(t("library.matrices.edit.title"))}</div>
                    <Button variant="ghost" size="sm" onClick={resetAndClose} type="button">
                        {String(t("common.close"))}
                    </Button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
                    {detailQ.isLoading ? <div className="text-sm text-muted-foreground md:col-span-2">{String(t("common.loading"))}</div> : null}

                    {detailQ.isError ? <div className="text-sm text-destructive md:col-span-2">{String(t("library.matrices.errors.loadFailed"))}</div> : null}

                    {!detailQ.isLoading && !detailQ.isError && detailQ.data && baseline ? (
                        <>
                            <div className="space-y-6 min-w-0 pr-4">
                                <div className="space-y-3">
                                    <SectionTitle>{String(t("library.matrices.create.pricing"))}</SectionTitle>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.feeBeforeTax", { defaultValue: "Giá chưa VAT" }))}</FieldLabel>
                                            <Input
                                                inputMode="numeric"
                                                value={form.feeBeforeTax}
                                                onChange={(e) => setForm((s) => ({ ...s, feeBeforeTax: e.target.value }))}
                                                disabled={updateM.isPending}
                                            />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.taxRate", { defaultValue: "Thuế (%)" }))}</FieldLabel>
                                            <Input inputMode="numeric" value={form.taxRate} onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))} disabled={updateM.isPending} />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.feeAfterTax", { defaultValue: "Giá có VAT" }))}</FieldLabel>
                                            <Input
                                                inputMode="numeric"
                                                value={form.feeAfterTax}
                                                disabled={updateM.isPending || canAutoCalcFeeAfterTax}
                                                onChange={(e) => setForm((s) => ({ ...s, feeAfterTax: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SectionTitle>{String(t("library.matrices.create.limits"))}</SectionTitle>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1 min-w-0">
                                                <FieldLabel>{String(t("library.matrices.LOD", { defaultValue: "LOD" }))}</FieldLabel>
                                                <Input value={form.LOD} onChange={(e) => setForm((s) => ({ ...s, LOD: e.target.value }))} disabled={updateM.isPending} />
                                            </div>

                                            <div className="space-y-1 min-w-0">
                                                <FieldLabel>{String(t("library.matrices.LOQ", { defaultValue: "LOQ" }))}</FieldLabel>
                                                <Input value={form.LOQ} onChange={(e) => setForm((s) => ({ ...s, LOQ: e.target.value }))} disabled={updateM.isPending} />
                                            </div>
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.thresholdLimit", { defaultValue: "Ngưỡng giới hạn" }))}</FieldLabel>
                                            <Input value={form.thresholdLimit} onChange={(e) => setForm((s) => ({ ...s, thresholdLimit: e.target.value }))} disabled={updateM.isPending} />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.turnaroundTime", { defaultValue: "TG trả kq (Ngày)" }))}</FieldLabel>
                                            <Input
                                                inputMode="numeric"
                                                value={form.turnaroundTime}
                                                onChange={(e) => setForm((s) => ({ ...s, turnaroundTime: e.target.value }))}
                                                disabled={updateM.isPending}
                                            />
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.technicianGroupId", { defaultValue: "ID nhóm KTV" }))}</FieldLabel>
                                            <Input value={form.technicianGroupId} onChange={(e) => setForm((s) => ({ ...s, technicianGroupId: e.target.value }))} disabled={updateM.isPending} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-border mt-6">
                                    <SectionTitle>{String(t("library.matrices.protocolAccreditation"))}</SectionTitle>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            className="w-full whitespace-normal"
                                            variant={form.accreditationVILAS ? "secondary" : "outline"}
                                            aria-pressed={form.accreditationVILAS}
                                            onClick={() => setForm((s) => ({ ...s, accreditationVILAS: !s.accreditationVILAS }))}
                                            disabled={updateM.isPending}
                                        >
                                            {String(t("library.protocols.protocolAccreditation.vilas", { defaultValue: "VILAS" }))}
                                        </Button>

                                        <Button
                                            type="button"
                                            className="w-full whitespace-normal"
                                            variant={form.accreditationTDC ? "secondary" : "outline"}
                                            aria-pressed={form.accreditationTDC}
                                            onClick={() => setForm((s) => ({ ...s, accreditationTDC: !s.accreditationTDC }))}
                                            disabled={updateM.isPending}
                                        >
                                            {String(t("library.protocols.protocolAccreditation.tdc", { defaultValue: "Cục đẩy" }))}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 min-w-0 border-l pl-4 border-border flex flex-col">
                                <div className="space-y-3">
                                    <SectionTitle>{String(t("library.matrices.create.sampleParameter", { defaultValue: "Thông tin chỉ tiêu" }))}</SectionTitle>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.parameterId"))}</FieldLabel>
                                            <div className="flex gap-2 items-center">
                                                {props.lockedParameterId ? (
                                                    <Input value={`[${form.parameterId}] ${form.parameterName}`} disabled />
                                                ) : (
                                                    <div className="flex-1 min-w-0">
                                                        <SearchableSelect
                                                            value={form.parameterId || null}
                                                            options={parameterOptions}
                                                            placeholder={String(t("library.parameters.searchPlaceholder"))}
                                                            searchPlaceholder={String(t("library.parameters.searchPlaceholder"))}
                                                            loading={parametersQ.isLoading || createParameter.isPending}
                                                            error={parametersQ.isError}
                                                            disabled={updateM.isPending}
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
                                                {form.parameterId && !props.lockedParameterId && (
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
                                            <FieldLabel>{String(t("library.matrices.sampleTypeId"))}</FieldLabel>
                                            <div className="flex gap-2 items-center">
                                                {props.lockedSampleTypeId ? (
                                                    <Input value={`[${form.sampleTypeId}] ${form.sampleTypeName}`} disabled />
                                                ) : (
                                                    <div className="flex-1 min-w-0">
                                                        <SearchableSelect
                                                            value={form.sampleTypeId || null}
                                                            options={sampleTypeOptions}
                                                            placeholder={String(t("library.sampleTypes.searchPlaceholder"))}
                                                            searchPlaceholder={String(t("library.sampleTypes.searchPlaceholder"))}
                                                            loading={sampleTypesQ.isLoading || createSampleType.isPending}
                                                            error={sampleTypesQ.isError}
                                                            disabled={updateM.isPending}
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
                                                {form.sampleTypeId && !props.lockedSampleTypeId && (
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
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <SectionTitle>{String(t("library.matrices.create.protocol", { defaultValue: "Phương pháp" }))}</SectionTitle>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <FieldLabel>{String(t("library.matrices.protocolId"))}</FieldLabel>
                                            <div className="flex gap-2 items-center">
                                                {props.lockedProtocolId ? (
                                                    <Input value={`[${form.protocolId}] ${form.protocolCode}`} disabled />
                                                ) : (
                                                    <div className="flex-1 min-w-0">
                                                        <SearchableSelect
                                                            value={form.protocolId || null}
                                                            options={protocolOptions}
                                                            placeholder={String(t("library.protocols.searchPlaceholder"))}
                                                            searchPlaceholder={String(t("library.protocols.searchPlaceholder"))}
                                                            loading={protocolsQ.isLoading || createProtocol.isPending}
                                                            error={protocolsQ.isError}
                                                            disabled={updateM.isPending}
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
                                                {form.protocolId && !props.lockedProtocolId && (
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

                                        {form.protocolId && protocolSnapshotChemicals.length > 0 && (
                                            <div className="space-y-2 min-w-0 mt-4">
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

                                <div className="space-y-3 border-t border-border pt-4">
                                    <ChemicalBomTable
                                        items={form.chemicals}
                                        onChange={(newChemicals) => setForm((s) => ({ ...s, chemicals: newChemicals }))}
                                        onLoadFromProtocol={handleLoadChemicals}
                                        disabled={updateM.isPending}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                    <Button variant="outline" onClick={resetAndClose} type="button">
                                        {String(t("common.cancel"))}
                                    </Button>
                                    <Button onClick={() => void submit()} disabled={!canSave || updateM.isPending} type="button">
                                        {updateM.isPending ? t("common.saving") : t("common.save")}
                                    </Button>
                                </div>
                                {updateM.isError ? <div className="text-sm text-destructive mt-2 text-right">{String(t("library.matrices.edit.error"))}</div> : null}
                            </div>
                        </>
                    ) : null}
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
                            accreditationTDC: Boolean(p.protocolAccreditation?.TDC),
                            accreditationVILAS: Boolean(p.protocolAccreditation?.VILAS),
                        }));
                    }}
                />
            )}
        </div>
    );
}
