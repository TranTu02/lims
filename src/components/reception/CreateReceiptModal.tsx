import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Copy, Trash2, Building2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { receiptsCreate, receiptsCreateFull } from "@/api/receipts";
import { clientsGetList, clientsGetDetail } from "@/api/crm/clients";
import { samplesGetList, samplesGetFull } from "@/api/samples";
import { ordersGetFull } from "@/api/crm/orders";
import { useIncomingRequestConvert } from "@/api/incomingRequests";

import type { ReceiptDetail, ReceiptsCreateBody, ReceiptsCreateFullBody, ReceiptPriority, ReceiptDeliveryMethod, SampleInfoItem, ReceiptStatus } from "@/types/receipt";

import type { ClientDetail, ClientListItem } from "@/types/crm/client";
import type { SampleDetail, SampleInfoValue, SampleListItem } from "@/types/sample";
import type { IncomingRequestListItem } from "@/types/incomingRequest";

type Mode = "basic" | "full";

type BasicFormState = {
    receiptCode: string;
    receiptDate: string;
    receiptDeadline: string;

    receiptPriority: ReceiptPriority | "";
    receiptDeliveryMethod: ReceiptDeliveryMethod | "";
    trackingNumber: string;

    clientId: string;
    clientName: string;

    taxAddress: string;
    taxCode: string;
    taxName: string;
    taxEmail: string;

    contactName: string;
    contactPhone: string;
    contactEmail: string;
    contactPosition: string;
    contactAddress: string;
};

type FormAnalysis = {
    id: string;
    matrixId: string;

    parameterName: string;
    protocolCode: string;
    feeAfterTax: number;
};

type FormSampleInfoRow = {
    id: string;
    label: string;
    value: string;
};

type FormSample = {
    id: string;
    sampleName: string;
    sampleTypeId: string;
    sampleTypeName: string;

    sampleVolume: string;
    samplePreservation: string;

    sampleInfo: FormSampleInfoRow[];

    analyses: FormAnalysis[];
};

type FullFormState = {
    receiptDate: string;

    clientId: string;
    clientName: string;

    notes: string;

    samples: FormSample[];
};

interface Props {
    onClose: () => void;
    onCreated?: (receipt: ReceiptDetail) => void;
    initialIncomingRequest?: IncomingRequestListItem | null;
}

function toStr(v: unknown): string {
    return typeof v === "string" ? v : v == null ? "" : String(v);
}

function getErrorMessage(e: unknown, fallback: string): string {
    if (e instanceof Error && e.message.trim()) return e.message;
    return fallback;
}

function nowId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractArrayField<T>(res: unknown): T[] {
    if (!res || typeof res !== "object") return [];
    const obj = res as Record<string, unknown>;
    const candidates: unknown[] = [obj.data, obj.items, obj.results, obj.result];
    for (const c of candidates) {
        if (Array.isArray(c)) return c as T[];
    }
    return [];
}

function sampleInfoValueToRows(v: SampleInfoValue | null | undefined): FormSampleInfoRow[] {
    if (!v) return [{ id: nowId("new-sinfo"), label: "", value: "" }];

    if (Array.isArray(v)) {
        if (v.length === 0) return [{ id: nowId("new-sinfo"), label: "", value: "" }];
        return v.map((item, idx) => ({
            id: nowId("new-sinfo"),
            label: String(idx),
            value: toStr(item),
        }));
    }

    if (typeof v === "object") {
        const entries = Object.entries(v as Record<string, unknown>);
        if (entries.length === 0) return [{ id: nowId("new-sinfo"), label: "", value: "" }];
        return entries.map(([k, val]) => ({
            id: nowId("new-sinfo"),
            label: k,
            value: toStr(val),
        }));
    }

    return [{ id: nowId("new-sinfo"), label: "value", value: toStr(v) }];
}

function mapSampleDetailToFormSample(s: SampleDetail): FormSample {
    return {
        id: nowId("new-sample"),
        sampleName: (s.sampleClientInfo ?? "").trim(),
        sampleTypeId: s.sampleTypeId ?? "",
        sampleTypeName: s.sampleTypeName ?? "",

        sampleVolume: s.sampleVolume ?? "",
        samplePreservation: s.samplePreservation ?? "",

        sampleInfo: sampleInfoValueToRows(s.sampleInfo),

        analyses:
            (s.analyses ?? []).length > 0
                ? s.analyses.map((a) => ({
                      id: nowId("new-analysis"),
                      matrixId: a.matrixId ?? "",
                      parameterName: a.parameterName ?? "",
                      protocolCode: a.protocolCode ?? "",
                      feeAfterTax: 0,
                  }))
                : [
                      {
                          id: nowId("new-analysis"),
                          matrixId: "",
                          parameterName: "",
                          protocolCode: "",
                          feeAfterTax: 0,
                      },
                  ],
    };
}

export function CreateReceiptModal({ onClose, onCreated, initialIncomingRequest }: Props) {
    const { t } = useTranslation();
    const convertMutation = useIncomingRequestConvert();

    const now = useMemo(() => new Date(), []);
    const today = useMemo(() => now.toISOString().split("T")[0] ?? "", [now]);

    const [mode, setMode] = useState<Mode>(initialIncomingRequest ? "full" : "full");
    const [submitting, setSubmitting] = useState(false);

    const DEFAULT_RECEIPT_STATUS: ReceiptStatus = "Draft";

    const [basic, setBasic] = useState<BasicFormState>(() => ({
        receiptCode: "",
        receiptDate: today,
        receiptDeadline: "",

        receiptPriority: "",
        receiptDeliveryMethod: "",
        trackingNumber: "",

        clientId: String(initialIncomingRequest?.client?.clientId || initialIncomingRequest?.clientId || ""),
        clientName: String(initialIncomingRequest?.client?.clientName || initialIncomingRequest?.senderInfo?.name || ""),

        taxAddress: initialIncomingRequest?.client?.invoiceInfo?.taxAddress || "",
        taxCode: initialIncomingRequest?.client?.invoiceInfo?.taxCode || "",
        taxName: initialIncomingRequest?.client?.invoiceInfo?.taxName || "",
        taxEmail: initialIncomingRequest?.client?.invoiceInfo?.taxEmail || "",

        contactName: initialIncomingRequest?.contactPerson?.contactName || "",
        contactPhone: initialIncomingRequest?.contactPerson?.contactPhone || "",
        contactEmail: initialIncomingRequest?.contactPerson?.contactEmail || "",
        contactPosition: "",
        contactAddress: "",
    }));

    const [full, setFull] = useState<FullFormState>(() => {
        if (initialIncomingRequest) {
            const rawSamples = (initialIncomingRequest.samples as any[]) || [];

            return {
                receiptDate: today,
                clientId: String(initialIncomingRequest.client?.clientId || initialIncomingRequest.clientId || ""),
                clientName: String(initialIncomingRequest.client?.clientName || initialIncomingRequest.senderInfo?.name || ""),
                notes: initialIncomingRequest.requestContent || "",
                samples:
                    rawSamples.length > 0
                        ? rawSamples.map((s, idx) => ({
                              id: `new-sample-${Date.now()}-${idx}`,
                              sampleName: s.sampleName || "",
                              sampleTypeId: s.sampleTypeId || "",
                              sampleTypeName: s.sampleTypeName || "",
                              sampleVolume: "",
                              samplePreservation: "",
                              sampleInfo: [{ id: `new-sinfo-${Date.now()}`, label: "", value: "" }],
                              analyses:
                                  (s.analyses || []).length > 0
                                      ? s.analyses.map((a: any, aidx: number) => ({
                                            id: `new-analysis-${Date.now()}-${aidx}`,
                                            matrixId: a.matrixId || "",
                                            parameterName: a.parameterName || "",
                                            protocolCode: a.protocolCode || "",
                                            feeAfterTax: 0,
                                        }))
                                      : [
                                            {
                                                id: `new-analysis-${Date.now()}-empty`,
                                                matrixId: "",
                                                parameterName: "",
                                                protocolCode: "",
                                                feeAfterTax: 0,
                                            },
                                        ],
                          }))
                        : [
                              {
                                  id: "new-sample-1",
                                  sampleName: "",
                                  sampleTypeId: "",
                                  sampleTypeName: "",
                                  sampleVolume: "",
                                  samplePreservation: "",
                                  sampleInfo: [{ id: "new-sinfo-1", label: "", value: "" }],
                                  analyses: [
                                      {
                                          id: "new-analysis-1",
                                          matrixId: "",
                                          parameterName: "",
                                          protocolCode: "",
                                          feeAfterTax: 0,
                                      },
                                  ],
                              },
                          ],
            };
        }

        return {
            receiptDate: today,

            clientId: "",
            clientName: "",

            notes: "",

            samples: [
                {
                    id: "new-sample-1",
                    sampleName: "",
                    sampleTypeId: "",
                    sampleTypeName: "",

                    sampleVolume: "",
                    samplePreservation: "",

                    sampleInfo: [{ id: "new-sinfo-1", label: "", value: "" }],

                    analyses: [
                        {
                            id: "new-analysis-1",
                            matrixId: "",
                            parameterName: "",
                            protocolCode: "",
                            feeAfterTax: 0,
                        },
                    ],
                },
            ],
        };
    });
    const [clientSuggest, setClientSuggest] = useState<ClientListItem[]>([]);
    const [clientSuggestLoading, setClientSuggestLoading] = useState(false);
    const [clientSuggestOpen, setClientSuggestOpen] = useState(false);

    const [orderCodeInput, setOrderCodeInput] = useState("");
    const [fetchingOrder, setFetchingOrder] = useState(false);

    const clientFetchSeq = useRef(0);

    const clientQuery = useMemo(() => {
        return mode === "basic" ? basic.clientId : full.clientId;
    }, [mode, basic.clientId, full.clientId]);

    useEffect(() => {
        const q = clientQuery.trim();
        if (!q) {
            setClientSuggest([]);
            setClientSuggestLoading(false);
            return;
        }

        const seq = ++clientFetchSeq.current;

        const tmr = window.setTimeout(() => {
            void (async () => {
                setClientSuggestLoading(true);
                try {
                    const res = await clientsGetList({
                        query: { search: q, page: 1, itemsPerPage: 8 },
                    });
                    if (clientFetchSeq.current !== seq) return;
                    setClientSuggest(extractArrayField<ClientListItem>(res));
                } catch (e) {
                    if (clientFetchSeq.current !== seq) return;
                    toast.error(t("common.requestFailed"), {
                        description: getErrorMessage(e, t("common.tryAgain")),
                    });
                } finally {
                    if (clientFetchSeq.current === seq) setClientSuggestLoading(false);
                }
            })();
        }, 250);

        return () => window.clearTimeout(tmr);
    }, [clientQuery, t]);

    const applyClientDetailToForms = (detail: ClientDetail) => {
        const anyDetail = detail as unknown as Record<string, unknown>;

        const contactsUnknown = anyDetail["contacts"] ?? anyDetail["clientContacts"] ?? anyDetail["contactPersons"];

        const contactsArr = Array.isArray(contactsUnknown) ? (contactsUnknown as Array<Record<string, unknown>>) : [];

        const first = contactsArr[0];

        const firstContactName = typeof first?.contactName === "string" ? first.contactName : "";
        const firstContactPhone = typeof first?.contactPhone === "string" ? first.contactPhone : "";
        const firstContactEmail = typeof first?.contactEmail === "string" ? first.contactEmail : "";
        const firstContactPosition = typeof first?.contactPosition === "string" ? first.contactPosition : "";
        const firstContactAddress = typeof first?.contactAddress === "string" ? first.contactAddress : "";

        setFull((prev) => ({
            ...prev,
            clientId: (detail.clientId ?? "").trim(),
            clientName: (detail.clientName ?? "").trim(),
        }));

        setBasic((prev) => ({
            ...prev,
            clientId: (detail.clientId ?? "").trim(),
            clientName: (detail.clientName ?? "").trim(),

            taxAddress: detail.invoiceInfo?.taxAddress ?? "",
            taxCode: detail.invoiceInfo?.taxCode ?? "",
            taxName: detail.invoiceInfo?.taxName ?? "",
            taxEmail: detail.invoiceInfo?.taxEmail ?? "",

            contactName: firstContactName,
            contactPhone: firstContactPhone,
            contactEmail: firstContactEmail,
            contactPosition: firstContactPosition,
            contactAddress: firstContactAddress,
        }));
    };

    const handlePickClient = async (clientId: string) => {
        try {
            const res = await clientsGetDetail({ query: { clientId } });

            if (!res.success || !res.data) {
                toast.error(t("common.requestFailed"), {
                    description: res.error?.message ?? t("common.tryAgain"),
                });
                return;
            }

            applyClientDetailToForms(res.data);
            setClientSuggestOpen(false);
            toast.success(t("common.success"));
        } catch (e) {
            toast.error(t("common.requestFailed"), {
                description: getErrorMessage(e, t("common.tryAgain")),
            });
        }
    };

    const handleFetchOrder = async () => {
        const q = orderCodeInput.trim();
        if (!q) return;

        setFetchingOrder(true);
        try {
            const res = await ordersGetFull({ params: { orderId: q } });
            const order = ((res as any).data ?? res) as any;

            if (!order || !order.orderId) {
                toast.error("Không tìm thấy đơn hàng");
                return;
            }

            setMode("full");

            const newSamples = (order.samples || []).map((s: any, idx: number) => {
                const analyses = s.analyses || [];
                return {
                    id: `new-sample-${Date.now()}-${idx}`,
                    sampleName: s.sampleName || "",
                    sampleTypeId: s.sampleTypeId || "",
                    sampleTypeName: s.sampleTypeName || "",
                    sampleVolume: "",
                    samplePreservation: "",
                    sampleInfo: [{ id: `new-sinfo-${Date.now()}`, label: "", value: "" }],
                    analyses:
                        analyses.length > 0
                            ? analyses.map((a: any, aidx: number) => ({
                                  id: `new-analysis-${Date.now()}-${aidx}`,
                                  matrixId: a.matrixId || "",
                                  parameterName: a.parameterName || "",
                                  protocolCode: a.protocolCode || "",
                                  feeAfterTax: 0,
                              }))
                            : [
                                  {
                                      id: `new-analysis-${Date.now()}-empty`,
                                      matrixId: "",
                                      parameterName: "",
                                      protocolCode: "",
                                      feeAfterTax: 0,
                                  },
                              ],
                };
            });

            setFull((prev) => ({
                ...prev,
                clientId: order.clientId || "",
                clientName: order.client?.clientName || "",
                samples: newSamples.length > 0 ? newSamples : prev.samples,
            }));

            if (order.clientId) {
                setBasic((prev) => ({
                    ...prev,
                    clientId: order.clientId,
                    clientName: order.client?.clientName || "",
                }));
            }

            toast.success("Đã tải dữ liệu đơn hàng thành công");
        } catch (e) {
            toast.error("Lỗi khi tải thông tin đơn hàng", { description: getErrorMessage(e, t("common.tryAgain")) });
        } finally {
            setFetchingOrder(false);
        }
    };

    const [sampleQByIndex, setSampleQByIndex] = useState<Record<number, string>>({});
    const [sampleSuggestByIndex, setSampleSuggestByIndex] = useState<Record<number, SampleListItem[]>>({});
    const [sampleSuggestOpenByIndex, setSampleSuggestOpenByIndex] = useState<Record<number, boolean>>({});
    const [sampleSuggestLoadingByIndex, setSampleSuggestLoadingByIndex] = useState<Record<number, boolean>>({});

    const sampleFetchSeqByIndex = useRef<Record<number, number>>({});

    const fetchSampleSuggest = (idx: number, qRaw: string) => {
        const q = qRaw.trim();
        if (!q) {
            setSampleSuggestByIndex((p) => ({ ...p, [idx]: [] }));
            setSampleSuggestLoadingByIndex((p) => ({ ...p, [idx]: false }));
            return;
        }

        const nextSeq = (sampleFetchSeqByIndex.current[idx] ?? 0) + 1;
        sampleFetchSeqByIndex.current[idx] = nextSeq;

        setSampleSuggestLoadingByIndex((p) => ({ ...p, [idx]: true }));

        window.setTimeout(() => {
            void (async () => {
                try {
                    const res = await samplesGetList({
                        query: { search: q, page: 1, itemsPerPage: 8 },
                    });
                    const curSeq = sampleFetchSeqByIndex.current[idx] ?? 0;
                    if (curSeq !== nextSeq) return;

                    if (!res.success) {
                        toast.error(t("common.requestFailed"), {
                            description: res.error?.message ?? t("common.tryAgain"),
                        });
                        return;
                    }

                    setSampleSuggestByIndex((p) => ({ ...p, [idx]: res.data ?? [] }));
                } catch (e) {
                    const curSeq = sampleFetchSeqByIndex.current[idx] ?? 0;
                    if (curSeq !== nextSeq) return;

                    toast.error(t("common.requestFailed"), {
                        description: getErrorMessage(e, t("common.tryAgain")),
                    });
                } finally {
                    const curSeq = sampleFetchSeqByIndex.current[idx] ?? 0;
                    if (curSeq === nextSeq) {
                        setSampleSuggestLoadingByIndex((p) => ({ ...p, [idx]: false }));
                    }
                }
            })();
        }, 250);
    };

    const handlePickSample = async (sampleIndex: number, sampleId: string) => {
        setSampleSuggestOpenByIndex((p) => ({ ...p, [sampleIndex]: false }));
        setSampleQByIndex((p) => ({ ...p, [sampleIndex]: sampleId }));

        try {
            const res = await samplesGetFull({ sampleId });
            if (!res.success || !res.data) {
                toast.error(t("common.requestFailed"), {
                    description: res.error?.message ?? t("common.tryAgain"),
                });
                return;
            }

            const mapped = mapSampleDetailToFormSample(res.data);

            setFull((prev) => {
                const next = [...prev.samples];
                if (!next[sampleIndex]) return prev;
                next[sampleIndex] = mapped;
                return { ...prev, samples: next };
            });

            toast.success(t("common.success"));
        } catch (e) {
            toast.error(t("common.requestFailed"), {
                description: getErrorMessage(e, t("common.tryAgain")),
            });
        }
    };

    const handleDuplicateSample = (sampleIndex: number) => {
        const sampleToCopy = full.samples[sampleIndex];
        if (!sampleToCopy) return;

        const newSample: FormSample = {
            ...sampleToCopy,
            id: nowId("new-sample"),
            analyses: sampleToCopy.analyses.map((a) => ({
                ...a,
                id: nowId("new-analysis"),
            })),
            sampleInfo: sampleToCopy.sampleInfo.map((r) => ({
                ...r,
                id: nowId("new-sinfo"),
            })),
        };

        const next = [...full.samples];
        next.splice(sampleIndex + 1, 0, newSample);
        setFull({ ...full, samples: next });
    };

    const handleRemoveSample = (sampleIndex: number) => {
        const next = full.samples.filter((_, idx) => idx !== sampleIndex);
        setFull({ ...full, samples: next.length > 0 ? next : full.samples });
    };

    const handleAddAnalysis = (sampleIndex: number) => {
        const next = [...full.samples];
        const s = next[sampleIndex];
        if (!s) return;
        s.analyses = [
            ...s.analyses,
            {
                id: nowId("new-analysis"),
                matrixId: "",
                parameterName: "",
                protocolCode: "",
                feeAfterTax: 0,
            },
        ];
        setFull({ ...full, samples: next });
    };

    const handleRemoveAnalysis = (sampleIndex: number, analysisIndex: number) => {
        const next = [...full.samples];
        const s = next[sampleIndex];
        if (!s) return;
        s.analyses = s.analyses.filter((_, idx) => idx !== analysisIndex);
        setFull({ ...full, samples: next });
    };

    const handleAddSampleInfo = (sampleIndex: number) => {
        const next = [...full.samples];
        const s = next[sampleIndex];
        if (!s) return;
        s.sampleInfo = [...s.sampleInfo, { id: nowId("new-sinfo"), label: "", value: "" }];
        setFull({ ...full, samples: next });
    };

    const handleRemoveSampleInfo = (sampleIndex: number, rowIndex: number) => {
        const next = [...full.samples];
        const s = next[sampleIndex];
        if (!s) return;
        s.sampleInfo = s.sampleInfo.filter((_, idx) => idx !== rowIndex);
        setFull({ ...full, samples: next });
    };

    const buildBasicBody = (): ReceiptsCreateBody => ({
        receiptStatus: DEFAULT_RECEIPT_STATUS,
        receiptCode: basic.receiptCode.trim() || null,

        client: {
            clientId: basic.clientId.trim() || null,
            clientName: basic.clientName.trim() || null,
            invoiceInfo: {
                taxAddress: basic.taxAddress.trim() || null,
                taxCode: basic.taxCode.trim() || null,
                taxName: basic.taxName.trim() || null,
                taxEmail: basic.taxEmail.trim() || null,
            },
        },

        contactPerson: {
            contactName: basic.contactName.trim() || null,
            contactPhone: basic.contactPhone.trim() || null,
            contactEmail: basic.contactEmail.trim() || null,
            contactPosition: basic.contactPosition.trim() || null,
            contactAddress: basic.contactAddress.trim() || null,
        },

        receiptDate: basic.receiptDate ? new Date(basic.receiptDate).toISOString() : null,
        receiptDeadline: basic.receiptDeadline ? new Date(basic.receiptDeadline).toISOString() : null,

        receiptPriority: basic.receiptPriority ? basic.receiptPriority : null,
        receiptDeliveryMethod: basic.receiptDeliveryMethod ? basic.receiptDeliveryMethod : null,

        trackingNumber: basic.trackingNumber.trim() || null,
    });

    const buildFullBody = (): ReceiptsCreateFullBody => ({
        receiptStatus: DEFAULT_RECEIPT_STATUS,
        client: {
            clientId: full.clientId.trim() || null,
            clientName: full.clientName.trim() || null,
        },

        receiptDate: full.receiptDate ? new Date(full.receiptDate).toISOString() : null,

        samples: full.samples.map((s) => {
            const sampleInfo: SampleInfoItem[] =
                s.sampleInfo
                    .map((r) => ({
                        label: toStr(r.label).trim(),
                        value: toStr(r.value).trim(),
                    }))
                    .filter((r) => r.label.length > 0 || r.value.length > 0) ?? [];

            return {
                sampleName: s.sampleName.trim() || null,
                sampleTypeId: s.sampleTypeId.trim() || null,

                sampleVolume: s.sampleVolume.trim() || null,
                samplePreservation: s.samplePreservation.trim() || null,

                sampleInfo: sampleInfo.length > 0 ? sampleInfo : null,

                analyses:
                    s.analyses.map((a) => ({
                        matrixId: a.matrixId.trim() || null,
                    })) ?? null,
            };
        }),
    });

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            if (initialIncomingRequest) {
                const convertRes = await convertMutation.mutateAsync({
                    receiptBody: buildFullBody() as unknown as Record<string, unknown>,
                    requestId: initialIncomingRequest.requestId,
                });

                if (convertRes && convertRes.data) {
                    onCreated?.((convertRes as any).data);
                }
                onClose();
                return;
            }

            const res = mode === "basic" ? await receiptsCreate({ body: buildBasicBody() }) : await receiptsCreateFull({ body: buildFullBody() });

            if (!res.success) {
                toast.error(t("common.requestFailed"), {
                    description: res.error?.message ?? t("common.tryAgain"),
                });
                return;
            }

            if (res.data) onCreated?.(res.data);
            toast.success(t("common.createdSuccessfully"));
            onClose();
        } catch (e) {
            toast.error(t("common.requestFailed"), {
                description: getErrorMessage(e, t("common.tryAgain")),
            });
        } finally {
            setSubmitting(false);
        }
    };

    const renderClientIdInputWithSuggest = (value: string, onChangeValue: (v: string) => void) => {
        return (
            <div className="relative mt-1">
                <Input
                    value={value}
                    onChange={(e) => {
                        onChangeValue(e.target.value);
                        setClientSuggestOpen(true);
                    }}
                    onFocus={() => setClientSuggestOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setClientSuggestOpen(false);
                    }}
                    className="h-8 text-sm bg-background border border-border"
                    placeholder={t("crm.clients.placeholders.clientId")}
                    disabled={submitting}
                />

                {clientSuggestOpen && (clientSuggestLoading || clientSuggest.length > 0) && (
                    <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg overflow-hidden">
                        {clientSuggestLoading && <div className="px-2 py-2 text-xs text-muted-foreground">{t("common.loading")}</div>}

                        {!clientSuggestLoading &&
                            clientSuggest.map((c) => (
                                <button
                                    key={c.clientId}
                                    type="button"
                                    className="w-full text-left px-2 py-2 hover:bg-muted/30"
                                    onMouseDown={(ev) => ev.preventDefault()}
                                    onClick={() => void handlePickClient(c.clientId)}
                                    disabled={submitting}
                                >
                                    <div className="text-sm font-medium">{c.clientName}</div>
                                    <div className="text-xs text-muted-foreground">{c.clientId}</div>
                                </button>
                            ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

            <div className="fixed inset-4 bg-background rounded-lg shadow-xl z-50 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {initialIncomingRequest ? `Tạo phiếu tiếp nhận từ Yêu cầu: ${initialIncomingRequest.requestId}` : t("reception.createReceipt.title")}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("reception.createReceipt.description")}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" disabled={submitting}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4 bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="flex-1 w-full max-w-sm flex items-center gap-2">
                            <Input
                                placeholder="Nhập mã đơn hàng L/K để điền thông tin..."
                                value={orderCodeInput}
                                onChange={(e) => setOrderCodeInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleFetchOrder();
                                    }
                                }}
                                className="h-9 text-sm bg-background border border-border"
                            />
                            <Button variant="secondary" size="sm" onClick={handleFetchOrder} disabled={fetchingOrder} className="h-9 whitespace-nowrap">
                                {fetchingOrder ? "Đang tải..." : "Tìm đơn hàng"}
                            </Button>
                        </div>
                        <div className="text-[11px] text-muted-foreground md:w-1/2">
                            Nhập mã đơn hàng L/K (yêu cầu phân tích) để tự động điền danh sách mẫu và thông tin khách hàng sang chế độ <strong className="text-foreground">Tạo đầy đủ</strong>.
                        </div>
                    </div>

                    <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                        <div className="flex items-center justify-between mb-3">
                            <TabsList>
                                <TabsTrigger value="basic">{t("reception.createReceipt.tabs.basic")}</TabsTrigger>
                                <TabsTrigger value="full">{t("reception.createReceipt.tabs.full")}</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* ---------------- BASIC ---------------- */}
                        <TabsContent value="basic" className="mt-0">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-3">
                                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-foreground">{t("reception.createReceipt.clientInfo")}</h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientId")}</Label>
                                                {renderClientIdInputWithSuggest(basic.clientId, (v) => setBasic((p) => ({ ...p, clientId: v })))}
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientName")}</Label>
                                                <Input
                                                    value={basic.clientName}
                                                    onChange={(e) => setBasic({ ...basic, clientName: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.clientName")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">{t("reception.createReceipt.invoiceInfo")}</h3>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.invoice.taxCode")}</Label>
                                                <Input
                                                    value={basic.taxCode}
                                                    onChange={(e) => setBasic({ ...basic, taxCode: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.invoice.taxCodePlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.invoice.taxName")}</Label>
                                                <Input
                                                    value={basic.taxName}
                                                    onChange={(e) => setBasic({ ...basic, taxName: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.invoice.taxNamePlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.invoice.taxEmail")}</Label>
                                                <Input
                                                    value={basic.taxEmail}
                                                    onChange={(e) => setBasic({ ...basic, taxEmail: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.invoice.taxEmailPlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.invoice.taxAddress")}</Label>
                                                <Textarea
                                                    value={basic.taxAddress}
                                                    onChange={(e) => setBasic({ ...basic, taxAddress: e.target.value })}
                                                    className="mt-1 text-sm bg-background border border-border"
                                                    rows={3}
                                                    placeholder={t("crm.clients.sections.invoice.taxAddressPlaceholder")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                        <div className="flex items-center gap-2 mb-3">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-foreground">{t("reception.createReceipt.contactInfo")}</h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.sections.contacts.fields.contactName")}</Label>
                                                <Input
                                                    value={basic.contactName}
                                                    onChange={(e) => setBasic({ ...basic, contactName: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.contacts.fields.contactNamePlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.sections.contacts.fields.contactPhone")}</Label>
                                                <Input
                                                    value={basic.contactPhone}
                                                    onChange={(e) => setBasic({ ...basic, contactPhone: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.contacts.fields.contactPhonePlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.sections.contacts.fields.contactEmail")}</Label>
                                                <Input
                                                    value={basic.contactEmail}
                                                    onChange={(e) => setBasic({ ...basic, contactEmail: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.contacts.fields.contactEmailPlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.sections.contacts.fields.contactPosition")}</Label>
                                                <Input
                                                    value={basic.contactPosition}
                                                    onChange={(e) =>
                                                        setBasic({
                                                            ...basic,
                                                            contactPosition: e.target.value,
                                                        })
                                                    }
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.contacts.fields.contactPositionPlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.sections.contacts.fields.contactAddress")}</Label>
                                                <Textarea
                                                    value={basic.contactAddress}
                                                    onChange={(e) =>
                                                        setBasic({
                                                            ...basic,
                                                            contactAddress: e.target.value,
                                                        })
                                                    }
                                                    className="mt-1 text-sm bg-background border border-border"
                                                    rows={3}
                                                    placeholder={t("crm.clients.sections.contacts.fields.contactAddressPlaceholder")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">{t("reception.createReceipt.receiptInfo")}</h3>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptCode")}</Label>
                                                <Input
                                                    value={basic.receiptCode}
                                                    onChange={(e) => setBasic({ ...basic, receiptCode: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("lab.receipts.receiptCodePlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDate")}</Label>
                                                <Input
                                                    type="date"
                                                    value={basic.receiptDate}
                                                    onChange={(e) => setBasic({ ...basic, receiptDate: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDeadline")}</Label>
                                                <Input
                                                    type="date"
                                                    value={basic.receiptDeadline}
                                                    onChange={(e) =>
                                                        setBasic({
                                                            ...basic,
                                                            receiptDeadline: e.target.value,
                                                        })
                                                    }
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptPriority")}</Label>
                                                <Input
                                                    value={basic.receiptPriority}
                                                    onChange={(e) =>
                                                        setBasic({
                                                            ...basic,
                                                            receiptPriority: e.target.value as ReceiptPriority,
                                                        })
                                                    }
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("reception.createReceipt.receiptPriorityPlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDeliveryMethod")}</Label>
                                                <Input
                                                    value={basic.receiptDeliveryMethod}
                                                    onChange={(e) =>
                                                        setBasic({
                                                            ...basic,
                                                            receiptDeliveryMethod: e.target.value as ReceiptDeliveryMethod,
                                                        })
                                                    }
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("reception.createReceipt.receiptDeliveryMethodPlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("reception.createReceipt.trackingNumber")}</Label>
                                                <Input
                                                    value={basic.trackingNumber}
                                                    onChange={(e) =>
                                                        setBasic({
                                                            ...basic,
                                                            trackingNumber: e.target.value,
                                                        })
                                                    }
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("reception.createReceipt.trackingNumberPlaceholder")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="full" className="mt-0">
                            <div className="flex gap-4">
                                <div className="w-1/3 space-y-3">
                                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-foreground">{t("reception.createReceipt.clientInfo")}</h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientId")}</Label>
                                                {renderClientIdInputWithSuggest(full.clientId, (v) => setFull((p) => ({ ...p, clientId: v })))}
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientName")}</Label>
                                                <Input
                                                    value={full.clientName}
                                                    onChange={(e) => setFull({ ...full, clientName: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.clientName")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">{t("reception.createReceipt.receiptInfo")}</h3>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDate")}</Label>
                                                <Input
                                                    type="date"
                                                    value={full.receiptDate}
                                                    onChange={(e) => setFull({ ...full, receiptDate: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptNote")}</Label>
                                                <Textarea
                                                    value={full.notes}
                                                    onChange={(e) => setFull({ ...full, notes: e.target.value })}
                                                    className="mt-1 text-sm bg-background border border-border"
                                                    rows={3}
                                                    placeholder={t("lab.receipts.receiptNote")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="bg-muted/30 rounded-lg border border-border p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-foreground">{t("reception.createReceipt.samplesList")}</h3>
                                        </div>

                                        <div className="space-y-3">
                                            {full.samples.map((sample, sampleIndex) => (
                                                <div key={sample.id} className="bg-muted/30 rounded-lg p-4 border-2 border-border/50">
                                                    <div className="mb-3">
                                                        <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptId")}</Label>
                                                        <div className="relative mt-1">
                                                            <Input
                                                                value={sampleQByIndex[sampleIndex] ?? ""}
                                                                onChange={(e) => {
                                                                    const v = e.target.value;
                                                                    setSampleQByIndex((p) => ({
                                                                        ...p,
                                                                        [sampleIndex]: v,
                                                                    }));
                                                                    setSampleSuggestOpenByIndex((p) => ({
                                                                        ...p,
                                                                        [sampleIndex]: true,
                                                                    }));
                                                                    fetchSampleSuggest(sampleIndex, v);
                                                                }}
                                                                onFocus={() =>
                                                                    setSampleSuggestOpenByIndex((p) => ({
                                                                        ...p,
                                                                        [sampleIndex]: true,
                                                                    }))
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Escape") {
                                                                        setSampleSuggestOpenByIndex((p) => ({
                                                                            ...p,
                                                                            [sampleIndex]: false,
                                                                        }));
                                                                    }
                                                                }}
                                                                className="h-8 text-sm bg-background border border-border"
                                                                placeholder={t("lab.receipts.receiptIdPlaceholder")}
                                                                disabled={submitting}
                                                            />

                                                            {sampleSuggestOpenByIndex[sampleIndex] &&
                                                                ((sampleSuggestLoadingByIndex[sampleIndex] ?? false) || (sampleSuggestByIndex[sampleIndex]?.length ?? 0) > 0) && (
                                                                    <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg overflow-hidden">
                                                                        {sampleSuggestLoadingByIndex[sampleIndex] && (
                                                                            <div className="px-2 py-2 text-xs text-muted-foreground">{t("common.loading")}</div>
                                                                        )}

                                                                        {!sampleSuggestLoadingByIndex[sampleIndex] &&
                                                                            (sampleSuggestByIndex[sampleIndex] ?? []).map((it) => (
                                                                                <button
                                                                                    key={it.sampleId}
                                                                                    type="button"
                                                                                    className="w-full text-left px-2 py-2 hover:bg-muted/30"
                                                                                    onMouseDown={(ev) => ev.preventDefault()}
                                                                                    onClick={() => void handlePickSample(sampleIndex, it.sampleId)}
                                                                                    disabled={submitting}
                                                                                >
                                                                                    <div className="text-sm font-medium">{it.sampleTypeName ?? "-"}</div>
                                                                                    <div className="text-xs text-muted-foreground">{it.sampleId}</div>
                                                                                </button>
                                                                            ))}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.sampleName")}</Label>
                                                                    <Input
                                                                        value={sample.sampleName}
                                                                        onChange={(e) => {
                                                                            const next = [...full.samples];
                                                                            next[sampleIndex] = {
                                                                                ...next[sampleIndex],
                                                                                sampleName: e.target.value,
                                                                            };
                                                                            setFull({ ...full, samples: next });
                                                                        }}
                                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                                        placeholder={t("lab.samples.sampleName")}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.sampleTypeName")}</Label>
                                                                    <Input
                                                                        value={sample.sampleTypeName}
                                                                        onChange={(e) => {
                                                                            const next = [...full.samples];
                                                                            next[sampleIndex] = {
                                                                                ...next[sampleIndex],
                                                                                sampleTypeName: e.target.value,
                                                                            };
                                                                            setFull({ ...full, samples: next });
                                                                        }}
                                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                                        placeholder={t("lab.samples.sampleTypeName")}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.sampleTypeId")}</Label>
                                                                    <Input
                                                                        value={sample.sampleTypeId}
                                                                        onChange={(e) => {
                                                                            const next = [...full.samples];
                                                                            next[sampleIndex] = {
                                                                                ...next[sampleIndex],
                                                                                sampleTypeId: e.target.value,
                                                                            };
                                                                            setFull({ ...full, samples: next });
                                                                        }}
                                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                                        placeholder={t("lab.samples.sampleTypeId")}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.sampleVolume")}</Label>
                                                                    <Input
                                                                        value={sample.sampleVolume}
                                                                        onChange={(e) => {
                                                                            const next = [...full.samples];
                                                                            next[sampleIndex] = {
                                                                                ...next[sampleIndex],
                                                                                sampleVolume: e.target.value,
                                                                            };
                                                                            setFull({ ...full, samples: next });
                                                                        }}
                                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                                        placeholder={t("lab.samples.sampleVolume")}
                                                                    />
                                                                </div>

                                                                <div className="md:col-span-2">
                                                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.samplePreservation")}</Label>
                                                                    <Input
                                                                        value={sample.samplePreservation}
                                                                        onChange={(e) => {
                                                                            const next = [...full.samples];
                                                                            next[sampleIndex] = {
                                                                                ...next[sampleIndex],
                                                                                samplePreservation: e.target.value,
                                                                            };
                                                                            setFull({ ...full, samples: next });
                                                                        }}
                                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                                        placeholder={t("lab.samples.samplePreservation")}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 ml-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDuplicateSample(sampleIndex)}
                                                                className="h-8 w-8 p-0"
                                                                title={t("reception.createReceipt.duplicateSample")}
                                                                disabled={submitting}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>

                                                            {full.samples.length > 1 && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleRemoveSample(sampleIndex)}
                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    title={t("reception.createReceipt.removeSample")}
                                                                    disabled={submitting}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <Label className="text-xs text-muted-foreground">{t("lab.samples.sampleInfo")}</Label>
                                                            <Button size="sm" variant="outline" onClick={() => handleAddSampleInfo(sampleIndex)} className="h-7 text-xs" disabled={submitting}>
                                                                <Plus className="h-3.5 w-3.5 mr-1" />
                                                                {t("reception.createReceipt.addSampleInfo")}
                                                            </Button>
                                                        </div>

                                                        <div className="bg-background rounded-md border border-border p-2">
                                                            <div className="grid grid-cols-12 gap-2 mb-2">
                                                                <div className="col-span-5">
                                                                    <Label className="text-[11px] text-muted-foreground">{t("lab.samples.sampleInfo")}</Label>
                                                                </div>
                                                                <div className="col-span-6">
                                                                    <Label className="text-[11px] text-muted-foreground">{t("lab.samples.sampleVolume")}</Label>
                                                                </div>
                                                                <div className="col-span-1" />
                                                            </div>

                                                            <div className="space-y-2">
                                                                {sample.sampleInfo.map((row, rowIndex) => (
                                                                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                                                                        <div className="col-span-5">
                                                                            <Input
                                                                                value={row.label}
                                                                                onChange={(e) => {
                                                                                    const next = [...full.samples];
                                                                                    const s = next[sampleIndex];
                                                                                    if (!s) return;
                                                                                    const r = s.sampleInfo[rowIndex];
                                                                                    if (!r) return;
                                                                                    s.sampleInfo[rowIndex] = {
                                                                                        ...r,
                                                                                        label: e.target.value,
                                                                                    };
                                                                                    setFull({ ...full, samples: next });
                                                                                }}
                                                                                className="h-7 text-xs bg-background border border-border"
                                                                                placeholder={t("lab.samples.sampleInfo")}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-6">
                                                                            <Input
                                                                                value={row.value}
                                                                                onChange={(e) => {
                                                                                    const next = [...full.samples];
                                                                                    const s = next[sampleIndex];
                                                                                    if (!s) return;
                                                                                    const r = s.sampleInfo[rowIndex];
                                                                                    if (!r) return;
                                                                                    s.sampleInfo[rowIndex] = {
                                                                                        ...r,
                                                                                        value: e.target.value,
                                                                                    };
                                                                                    setFull({ ...full, samples: next });
                                                                                }}
                                                                                className="h-7 text-xs bg-background border border-border"
                                                                                placeholder={t("lab.samples.sampleVolume")}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-1 flex justify-end">
                                                                            {sample.sampleInfo.length > 1 && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    onClick={() => handleRemoveSampleInfo(sampleIndex, rowIndex)}
                                                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                    disabled={submitting}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        <Label className="text-xs text-muted-foreground mb-2 block">{t("reception.createReceipt.analysisList")}</Label>

                                                        <div className="bg-background rounded-md border border-border overflow-hidden overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-muted/50 border-b border-border">
                                                                    <tr>
                                                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.parameterName")}</th>
                                                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.protocolCode")}</th>
                                                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.matrixId")}</th>
                                                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.price")}</th>
                                                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground w-16" />
                                                                    </tr>
                                                                </thead>

                                                                <tbody className="divide-y divide-border">
                                                                    {sample.analyses.map((analysis, analysisIndex) => (
                                                                        <tr key={analysis.id} className="hover:bg-muted/30">
                                                                            <td className="px-2 py-1.5">
                                                                                <Input
                                                                                    value={analysis.parameterName}
                                                                                    onChange={(e) => {
                                                                                        const next = [...full.samples];
                                                                                        const s = next[sampleIndex];
                                                                                        if (!s) return;
                                                                                        const a = s.analyses[analysisIndex];
                                                                                        if (!a) return;
                                                                                        s.analyses[analysisIndex] = {
                                                                                            ...a,
                                                                                            parameterName: e.target.value,
                                                                                        };
                                                                                        setFull({
                                                                                            ...full,
                                                                                            samples: next,
                                                                                        });
                                                                                    }}
                                                                                    className="h-7 text-xs bg-background border border-border"
                                                                                    placeholder={t("lab.analyses.parameterName")}
                                                                                />
                                                                            </td>

                                                                            <td className="px-2 py-1.5">
                                                                                <Input
                                                                                    value={analysis.protocolCode}
                                                                                    onChange={(e) => {
                                                                                        const next = [...full.samples];
                                                                                        const s = next[sampleIndex];
                                                                                        if (!s) return;
                                                                                        const a = s.analyses[analysisIndex];
                                                                                        if (!a) return;
                                                                                        s.analyses[analysisIndex] = {
                                                                                            ...a,
                                                                                            protocolCode: e.target.value,
                                                                                        };
                                                                                        setFull({
                                                                                            ...full,
                                                                                            samples: next,
                                                                                        });
                                                                                    }}
                                                                                    className="h-7 text-xs bg-background border border-border"
                                                                                    placeholder={t("lab.analyses.protocolCode")}
                                                                                />
                                                                            </td>

                                                                            <td className="px-2 py-1.5">
                                                                                <Input
                                                                                    value={analysis.matrixId}
                                                                                    onChange={(e) => {
                                                                                        const next = [...full.samples];
                                                                                        const s = next[sampleIndex];
                                                                                        if (!s) return;
                                                                                        const a = s.analyses[analysisIndex];
                                                                                        if (!a) return;
                                                                                        s.analyses[analysisIndex] = {
                                                                                            ...a,
                                                                                            matrixId: e.target.value,
                                                                                        };
                                                                                        setFull({
                                                                                            ...full,
                                                                                            samples: next,
                                                                                        });
                                                                                    }}
                                                                                    className="h-7 text-xs bg-background border border-border"
                                                                                    placeholder={t("lab.analyses.matrixId")}
                                                                                />
                                                                            </td>

                                                                            <td className="px-2 py-1.5">
                                                                                <Input
                                                                                    type="number"
                                                                                    value={analysis.feeAfterTax}
                                                                                    onChange={(e) => {
                                                                                        const next = [...full.samples];
                                                                                        const s = next[sampleIndex];
                                                                                        if (!s) return;
                                                                                        const a = s.analyses[analysisIndex];
                                                                                        if (!a) return;
                                                                                        s.analyses[analysisIndex] = {
                                                                                            ...a,
                                                                                            feeAfterTax: Number(e.target.value) || 0,
                                                                                        };
                                                                                        setFull({
                                                                                            ...full,
                                                                                            samples: next,
                                                                                        });
                                                                                    }}
                                                                                    className="h-7 text-xs text-left bg-background border border-border"
                                                                                    placeholder="0"
                                                                                />
                                                                            </td>

                                                                            <td className="px-2 py-1.5 text-center">
                                                                                {sample.analyses.length > 1 && (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => handleRemoveAnalysis(sampleIndex, analysisIndex)}
                                                                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                        disabled={submitting}
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>

                                                            <div className="p-2 bg-muted/30 border-t border-border">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleAddAnalysis(sampleIndex)}
                                                                    className="w-full h-7 text-xs flex items-center justify-center gap-1.5 bg-background"
                                                                    disabled={submitting}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                    {t("reception.createReceipt.addAnalysis")}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-muted/30">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        {t("reception.createReceipt.cancelButton")}
                    </Button>
                    <Button onClick={() => void handleSubmit()} className="flex items-center gap-2" disabled={submitting}>
                        <Plus className="h-4 w-4" />
                        {mode === "basic" ? t("reception.createReceipt.createButton") : t("reception.createReceipt.createFullButton")}
                    </Button>
                </div>
            </div>
        </>
    );
}
