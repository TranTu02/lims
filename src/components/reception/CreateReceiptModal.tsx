import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { X, Plus, Copy, Trash2, Building2, User, FileText, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

import { receiptsCreate, receiptsCreateFull } from "@/api/receipts";
import { clientsGetList, clientsGetDetail } from "@/api/crm/clients";
import { ordersGetFull } from "@/api/crm/orders";
import { useIncomingRequestConvert } from "@/api/incomingRequests";
import { documentApi } from "@/api/documents";

import type { ReceiptDetail, ReceiptsCreateBody, ReceiptsCreateFullBody, ReceiptPriority, ReceiptDeliveryMethod, SampleInfoItem, ReceiptStatus } from "@/types/receipt";

import type { ClientDetail, ClientListItem } from "@/types/crm/client";
// import type { SampleInfoValue } from "@/types/sample"; // Removed unused import
import type { IncomingRequestListItem } from "@/types/incomingRequest";

function DatePicker({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
    const date = value ? new Date(value) : undefined;
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className="w-full h-8 px-3 text-xs bg-background font-normal flex items-center justify-between text-left border border-border rounded-md hover:bg-muted/30 mt-1"
                >
                    <span>{date && !isNaN(date.getTime()) ? format(date, "dd/MM/yyyy") : "Chọn ngày (DD/MM/YYYY)"}</span>
                    <CalendarIcon className="ml-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border border-border shadow-md" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        if (d) {
                            const pad = (n: number) => String(n).padStart(2, "0");
                            const y = d.getFullYear();
                            const m = pad(d.getMonth() + 1);
                            const day = pad(d.getDate());
                            onChange(`${y}-${m}-${day}`);
                        } else {
                            onChange("");
                        }
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

type Mode = "basic" | "full";

type BasicFormState = {
    orderId: string;
    receiptDate: string;
    receiptDeadline: string;

    receiptPriority: ReceiptPriority | "";
    receiptDeliveryMethod: ReceiptDeliveryMethod | "";
    trackingNumber: string;

    clientId: string;
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    legalId: string;

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
    feeBeforeTax: number;
    _raw?: any;
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
    _raw?: any;
};

type FullFormState = {
    orderId: string;
    receiptDate: string;
    receiptDeadline: string;

    clientId: string;
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    legalId: string;

    taxAddress: string;
    taxCode: string;
    taxName: string;
    taxEmail: string;

    notes: string;

    contactPerson: {
        contactId?: string;
        contactName: string;
        contactPhone: string;
        contactEmail: string;
        contactPosition: string;
        contactAddress: string;
    };

    reportRecipient: {
        receiverName: string;
        receiverPhone: string;
        receiverAddress: string;
        receiverEmail: string;
    };

    senderInfo?: any;

    samples: FormSample[];
};

interface Props {
    onClose: () => void;
    onCreated?: (receipt: ReceiptDetail) => void;
    initialIncomingRequest?: IncomingRequestListItem | null;
}

const SAMPLE_INFO_LABELS = [
    "Tên mẫu thử",
    "Số lô",
    "Ngày sản xuất",
    "Hạn sử dụng",
    "Nơi sản xuất",
    "Địa chỉ sản xuất",
    "Số công bố",
    "Số đăng ký",
    "Thông tin khác",
] as const;

function normalizeSampleInfo(
    raw: { label?: string; value?: string }[] | null | undefined,
    sampleName: string
): FormSampleInfoRow[] {
    const map = new Map<string, string>();
    if (Array.isArray(raw)) {
        for (const r of raw) {
            if (r.label) map.set(r.label.trim(), r.value ?? "");
        }
    }
    // Luôn dùng sampleName cho "Tên mẫu thử"
    map.set("Tên mẫu thử", sampleName || map.get("Tên mẫu thử") || "");
    return SAMPLE_INFO_LABELS.map((label, i) => ({
        id: `sinfo-${label}-${i}`,
        label,
        value: map.get(label) ?? "",
    }));
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





export function CreateReceiptModal({ onClose, onCreated, initialIncomingRequest }: Props) {
    const { t } = useTranslation();
    const convertMutation = useIncomingRequestConvert();

    const now = useMemo(() => new Date(), []);
    const today = useMemo(() => now.toISOString().split("T")[0] ?? "", [now]);

    const [mode, setMode] = useState<Mode>(initialIncomingRequest ? "full" : "full");
    const [submitting, setSubmitting] = useState(false);

    const DEFAULT_RECEIPT_STATUS: ReceiptStatus = "Draft";

    const [basic, setBasic] = useState<BasicFormState>(() => {
        const c = initialIncomingRequest?.client;
        const inv = c?.invoiceInfo;
        const s = initialIncomingRequest?.senderInfo;
        const cp = initialIncomingRequest?.contactPerson;

        return {
            orderId: String(initialIncomingRequest?.orderId || ""),
            receiptDate: today,
            receiptDeadline: "",

            receiptPriority: "",
            receiptDeliveryMethod: "",
            trackingNumber: "",

            clientId: String(c?.clientId || initialIncomingRequest?.clientId || ""),
            clientName: String(c?.clientName || initialIncomingRequest?.clientName || s?.senderName || s?.name || ""),
            clientEmail: String(c?.clientEmail || c?.email || initialIncomingRequest?.clientEmail || initialIncomingRequest?.email || s?.senderEmail || s?.email || ""),
            clientAddress: String(c?.clientAddress || c?.address || initialIncomingRequest?.clientAddress || initialIncomingRequest?.address || s?.senderAddress || s?.address || ""),
            legalId: String(c?.legalId || initialIncomingRequest?.legalId || ""),

            taxAddress: String(inv?.taxAddress || c?.taxAddress || initialIncomingRequest?.taxAddress || ""),
            taxCode: String(inv?.taxCode || c?.taxCode || initialIncomingRequest?.taxCode || ""),
            taxName: String(inv?.taxName || c?.taxName || initialIncomingRequest?.taxName || ""),
            taxEmail: String(inv?.taxEmail || c?.taxEmail || initialIncomingRequest?.taxEmail || ""),

            contactName: String(cp?.contactName || initialIncomingRequest?.contactName || ""),
            contactPhone: String(cp?.contactPhone || initialIncomingRequest?.contactPhone || ""),
            contactEmail: String(cp?.contactEmail || initialIncomingRequest?.contactEmail || ""),
            contactPosition: String(cp?.contactPosition || initialIncomingRequest?.contactPosition || ""),
            contactAddress: String(cp?.contactAddress || initialIncomingRequest?.contactAddress || ""),
        };
    });

    const [full, setFull] = useState<FullFormState>(() => {
        if (initialIncomingRequest) {
            const c = initialIncomingRequest.client;
            const inv = c?.invoiceInfo;
            const s = initialIncomingRequest.senderInfo;
            const cp = initialIncomingRequest.contactPerson;
            const rr = initialIncomingRequest.reportRecipient;
            const rawSamples = (initialIncomingRequest.samples as any[]) || [];

            return {
                orderId: String(initialIncomingRequest.orderId || ""),
                receiptDate: today,
                clientId: String(c?.clientId || initialIncomingRequest.clientId || ""),
                clientName: String(c?.clientName || initialIncomingRequest.clientName || s?.senderName || s?.name || ""),
                clientEmail: String(c?.clientEmail || c?.email || initialIncomingRequest.clientEmail || initialIncomingRequest.email || s?.senderEmail || s?.email || ""),
                clientAddress: String(c?.clientAddress || c?.address || initialIncomingRequest.clientAddress || initialIncomingRequest.address || s?.senderAddress || s?.address || ""),
                legalId: String(c?.legalId || initialIncomingRequest.legalId || ""),

                taxAddress: String(inv?.taxAddress || c?.taxAddress || initialIncomingRequest.taxAddress || ""),
                taxCode: String(inv?.taxCode || c?.taxCode || initialIncomingRequest.taxCode || ""),
                taxName: String(inv?.taxName || c?.taxName || initialIncomingRequest.taxName || ""),
                taxEmail: String(inv?.taxEmail || c?.taxEmail || initialIncomingRequest.taxEmail || ""),

                notes: initialIncomingRequest.requestContent || "",
                receiptDeadline: "",
                samples:
                    rawSamples.length > 0
                        ? rawSamples.map((s, idx) => ({
                              id: `new-sample-${Date.now()}-${idx}`,
                              sampleName: s.sampleName || "",
                              sampleTypeId: s.sampleTypeId || "",
                              sampleTypeName: s.sampleTypeName || "",
                              sampleVolume: "",
                              samplePreservation: "",
                              sampleInfo: normalizeSampleInfo(s.sampleInfo, s.sampleName || ""),
                              analyses:
                                  (s.analyses || []).length > 0
                                      ? s.analyses.map((a: any, aidx: number) => ({
                                            id: `new-analysis-${Date.now()}-${aidx}`,
                                            matrixId: a.matrixId || "",
                                            parameterName: a.analysis?.parameterName || a.parameterName || "",
                                            protocolCode: a.analysis?.protocolCode || a.protocolCode || "",
                                            feeAfterTax: Number(a.analysis?.feeAfterTax ?? a.feeAfterTax ?? 0),
                                            feeBeforeTax: Number(a.analysis?.feeBeforeTax ?? a.feeBeforeTax ?? 0),
                                            _raw: a,
                                        }))
                                      : [
                                            {
                                                id: `new-analysis-${Date.now()}-empty`,
                                                matrixId: "",
                                                parameterName: "",
                                                protocolCode: "",
                                                feeAfterTax: 0,
                                                feeBeforeTax: 0,
                                                _raw: null,
                                            },
                                        ],
                              _raw: s,
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
                                          _raw: null,
                                      },
                                  ],
                                  _raw: null,
                              },
                          ],
                contactPerson: {
                    contactId: String(cp?.contactId || initialIncomingRequest.contactId || ""),
                    contactName: String(cp?.contactName || initialIncomingRequest.contactName || ""),
                    contactPhone: String(cp?.contactPhone || initialIncomingRequest.contactPhone || ""),
                    contactEmail: String(cp?.contactEmail || initialIncomingRequest.contactEmail || ""),
                    contactPosition: String(cp?.contactPosition || initialIncomingRequest.contactPosition || ""),
                    contactAddress: String(cp?.contactAddress || initialIncomingRequest.contactAddress || ""),
                },
                reportRecipient: {
                    receiverName: String(rr?.receiverName || initialIncomingRequest.receiverName || ""),
                    receiverPhone: String(rr?.receiverPhone || initialIncomingRequest.receiverPhone || ""),
                    receiverAddress: String(rr?.receiverAddress || initialIncomingRequest.receiverAddress || ""),
                    receiverEmail: String(rr?.receiverEmail || initialIncomingRequest.receiverEmail || ""),
                },
                senderInfo: s || null,
            };
        }

        return {
            orderId: "",
            receiptDate: today,
            receiptDeadline: "",

            clientId: "",
            clientName: "",
            clientEmail: "",
            clientAddress: "",
            legalId: "",

            taxAddress: "",
            taxCode: "",
            taxName: "",
            taxEmail: "",

            notes: "",

            contactPerson: {
                contactId: "",
                contactName: "",
                contactPhone: "",
                contactEmail: "",
                contactPosition: "",
                contactAddress: "",
            },

            reportRecipient: {
                receiverName: "",
                receiverPhone: "",
                receiverAddress: "",
                receiverEmail: "",
            },

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
                            feeBeforeTax: 0,
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
    const [fetchedOrderDocuments, setFetchedOrderDocuments] = useState<any[]>(
        // Pre-populate from initialIncomingRequest if available
        Array.isArray((initialIncomingRequest as any)?.documents)
            ? (initialIncomingRequest as any).documents
            : []
    );

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
            clientEmail: (detail.clientEmail ?? "").trim(),
            clientAddress: (detail.clientAddress ?? "").trim(),
            legalId: (detail.legalId ?? "").trim(),

            taxAddress: detail.invoiceInfo?.taxAddress ?? "",
            taxCode: detail.invoiceInfo?.taxCode ?? "",
            taxName: detail.invoiceInfo?.taxName ?? "",
            taxEmail: detail.invoiceInfo?.taxEmail ?? "",

            contactPerson: {
                contactId: String(first?.contactId ?? ""),
                contactName: firstContactName,
                contactPhone: firstContactPhone,
                contactEmail: firstContactEmail,
                contactPosition: firstContactPosition,
                contactAddress: firstContactAddress,
            }
        }));

        setBasic((prev) => ({
            ...prev,
            clientId: (detail.clientId ?? "").trim(),
            clientName: (detail.clientName ?? "").trim(),
            clientEmail: (detail.clientEmail ?? "").trim(),
            clientAddress: (detail.clientAddress ?? "").trim(),
            legalId: (detail.legalId ?? "").trim(),

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
                    sampleInfo: normalizeSampleInfo(s.sampleInfo, s.sampleName || ""),
                    analyses:
                        analyses.length > 0
                            ? analyses.map((a: any, aidx: number) => ({
                                  id: `new-analysis-${Date.now()}-${aidx}`,
                                  matrixId: a.matrixId || "",
                                  parameterName: a.analysis?.parameterName || a.parameterName || "",
                                  protocolCode: a.analysis?.protocolCode || a.protocolCode || "",
                                  feeAfterTax: Number(a.analysis?.feeAfterTax ?? a.feeAfterTax ?? 0),
                                  feeBeforeTax: Number(a.analysis?.feeBeforeTax ?? a.feeBeforeTax ?? 0),
                                  _raw: a,
                              }))
                            : [
                                  {
                                      id: `new-analysis-${Date.now()}-empty`,
                                      matrixId: "",
                                      parameterName: "",
                                      protocolCode: "",
                                      feeAfterTax: 0,
                                      feeBeforeTax: 0,
                                      _raw: null,
                                  },
                              ],
                    _raw: s,
                };
            });

            const c = order.client;
            const inv = c?.invoiceInfo;
            const cp = order.contactPerson;
            const rr = order.reportRecipient;

            setFull((prev) => ({
                ...prev,
                orderId: order.orderId || "",
                clientId: String(c?.clientId || order.clientId || ""),
                clientName: String(c?.clientName || order.clientName || ""),
                clientEmail: String(c?.clientEmail || c?.email || ""),
                clientAddress: String(c?.clientAddress || c?.address || ""),
                legalId: String(c?.legalId || ""),

                taxAddress: String(inv?.taxAddress || c?.taxAddress || ""),
                taxCode: String(inv?.taxCode || c?.taxCode || ""),
                taxName: String(inv?.taxName || c?.taxName || ""),
                taxEmail: String(inv?.taxEmail || c?.taxEmail || ""),

                contactPerson: {
                    contactId: String(cp?.contactId || ""),
                    contactName: String(cp?.contactName || ""),
                    contactPhone: String(cp?.contactPhone || ""),
                    contactEmail: String(cp?.contactEmail || ""),
                    contactPosition: String(cp?.contactPosition || ""),
                    contactAddress: String(cp?.contactAddress || ""),
                },
                reportRecipient: {
                    receiverName: String(rr?.receiverName || ""),
                    receiverPhone: String(rr?.receiverPhone || ""),
                    receiverAddress: String(rr?.receiverAddress || ""),
                    receiverEmail: String(rr?.receiverEmail || ""),
                },
                senderInfo: order.senderInfo || null,
                samples: newSamples.length > 0 ? newSamples : prev.samples,
            }));

            if (order.clientId) {
                setBasic((prev) => ({
                    ...prev,
                    orderId: order.orderId || "",
                    clientId: String(c?.clientId || order.clientId || ""),
                    clientName: String(c?.clientName || order.clientName || ""),
                    clientEmail: String(c?.clientEmail || c?.email || ""),
                    clientAddress: String(c?.clientAddress || c?.address || ""),
                    legalId: String(c?.legalId || ""),

                    taxAddress: String(inv?.taxAddress || c?.taxAddress || ""),
                    taxCode: String(inv?.taxCode || c?.taxCode || ""),
                    taxName: String(inv?.taxName || c?.taxName || ""),
                    taxEmail: String(inv?.taxEmail || c?.taxEmail || ""),

                    contactName: String(cp?.contactName || ""),
                    contactPhone: String(cp?.contactPhone || ""),
                    contactEmail: String(cp?.contactEmail || ""),
                }));
            }

            toast.success("Đã tải dữ liệu đơn hàng thành công");
            // Save documents from fetched order
            if (Array.isArray(order.documents) && order.documents.length > 0) {
                setFetchedOrderDocuments(order.documents);
            }
        } catch (e) {
            toast.error("Lỗi khi tải thông tin đơn hàng", { description: getErrorMessage(e, t("common.tryAgain")) });
        } finally {
            setFetchingOrder(false);
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
                feeBeforeTax: 0,
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



    const buildBasicBody = (): ReceiptsCreateBody => ({
        receiptStatus: DEFAULT_RECEIPT_STATUS,
        orderId: basic.orderId.trim() || null,

        client: {
            clientId: basic.clientId.trim() || null,
            clientName: basic.clientName.trim() || null,
            clientEmail: basic.clientEmail.trim() || null,
            clientAddress: basic.clientAddress.trim() || null,
            legalId: basic.legalId.trim() || null,
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
        orderId: full.orderId.trim() || null,
        client: {
            clientId: full.clientId.trim() || null,
            clientName: full.clientName.trim() || null,
            clientEmail: full.clientEmail.trim() || null,
            clientAddress: full.clientAddress.trim() || null,
            legalId: full.legalId.trim() || null,
            invoiceInfo: {
                taxAddress: full.taxAddress.trim() || null,
                taxCode: full.taxCode.trim() || null,
                taxName: full.taxName.trim() || null,
                taxEmail: full.taxEmail.trim() || null,
            },
        },

        contactPerson: full.contactPerson,
        reportRecipient: full.reportRecipient,
        senderInfo: full.senderInfo || undefined,

        receiptDate: full.receiptDate ? new Date(full.receiptDate).toISOString() : null,
        receiptDeadline: full.receiptDeadline ? new Date(full.receiptDeadline).toISOString() : null,

        samples: full.samples.map((s) => {
            const sampleInfo: SampleInfoItem[] =
                s.sampleInfo
                    .map((r) => ({
                        label: toStr(r.label).trim(),
                        value: toStr(r.value).trim(),
                    }))
                    .filter((r) => r.label.length > 0 || r.value.length > 0) ?? [];

            return {
                ...(s._raw || {}),
                sampleName: s.sampleName.trim() || null,
                sampleTypeId: s.sampleTypeId.trim() || null,

                sampleVolume: s.sampleVolume.trim() || null,
                samplePreservation: s.samplePreservation.trim() || null,

                sampleInfo: sampleInfo.length > 0 ? sampleInfo : null,

                analyses:
                    s.analyses.map((a) => ({
                        ...(a._raw || {}),
                        matrixId: a.matrixId.trim() || null,
                    })) ?? null,
            };
        }),
    });

    const handleSubmit = async () => {
        if (submitting) return;

        // Validation orderId
        const currentOrderId = (mode === "basic" ? basic.orderId : full.orderId).trim();
        if (!currentOrderId) {
            toast.error(t("crm.orders.form.placeholders.orderId"));
            return;
        }

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

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[80] transition-all duration-300" onClick={onClose} />

            <div className="fixed inset-4 bg-background rounded-lg shadow-2xl z-[80] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

                    {/* Documents bar - from order fetch or initialIncomingRequest */}
                    {fetchedOrderDocuments.length > 0 && (
                        <div className="bg-muted/20 border border-border rounded-lg p-3 mb-4">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                Tài liệu đính kèm ({fetchedOrderDocuments.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {fetchedOrderDocuments.map((doc: any) => (
                                    <button
                                        key={doc.documentId}
                                        type="button"
                                        className="flex items-center gap-1.5 text-xs bg-background border border-border hover:border-primary/60 hover:bg-primary/5 text-foreground px-2.5 py-1.5 rounded-md transition-colors"
                                        onClick={async () => {
                                            try {
                                                const res = await documentApi.url(String(doc.documentId));
                                                const url = res?.data?.url || (res as any)?.url;
                                                if (url) window.open(url, "_blank");
                                            } catch { /* silent */ }
                                        }}
                                        title={doc.documentTitle || String(doc.documentId)}
                                    >
                                        <FileText className="h-3 w-3 text-primary/70 shrink-0" />
                                        <span className="truncate max-w-[180px]">{doc.documentTitle || doc.documentId}</span>
                                        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientEmail")}</Label>
                                                <Input
                                                    value={basic.clientEmail}
                                                    onChange={(e) => setBasic({ ...basic, clientEmail: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.email", { defaultValue: "Email" })}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientAddress")}</Label>
                                                <Input
                                                    value={basic.clientAddress}
                                                    onChange={(e) => setBasic({ ...basic, clientAddress: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.address", { defaultValue: "Address" })}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.legalId")}</Label>
                                                <Input
                                                    value={basic.legalId}
                                                    onChange={(e) => setBasic({ ...basic, legalId: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.legalId", { defaultValue: "Legal ID" })}
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
                                                <Label className="text-xs text-muted-foreground">{t("crm.orders.columns.orderId")} <span className="text-destructive">*</span></Label>
                                                <Input
                                                    value={basic.orderId}
                                                    onChange={(e) => setBasic({ ...basic, orderId: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.orders.form.placeholders.orderId")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDate")}</Label>
                                                <DatePicker
                                                    value={basic.receiptDate}
                                                    onChange={(val) => setBasic({ ...basic, receiptDate: val })}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDeadline")}</Label>
                                                <DatePicker
                                                    value={basic.receiptDeadline}
                                                    onChange={(val) => setBasic({ ...basic, receiptDeadline: val })}
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
                                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-3">{t("reception.createReceipt.receiptInfo")}</h3>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.orders.columns.orderId")} <span className="text-destructive">*</span></Label>
                                                <Input
                                                    value={full.orderId}
                                                    onChange={(e) => setFull({ ...full, orderId: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.orders.form.placeholders.orderId")}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDate")}</Label>
                                                    <DatePicker
                                                        value={full.receiptDate}
                                                        onChange={(val) => setFull({ ...full, receiptDate: val })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">{t("lab.receipts.receiptDeadline")}</Label>
                                                    <DatePicker
                                                        value={full.receiptDeadline}
                                                        onChange={(val) => setFull({ ...full, receiptDeadline: val })}
                                                    />
                                                </div>
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

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientEmail")}</Label>
                                                <Input
                                                    value={full.clientEmail}
                                                    onChange={(e) => setFull({ ...full, clientEmail: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.email", { defaultValue: "Email" })}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.clientAddress")}</Label>
                                                <Input
                                                    value={full.clientAddress}
                                                    onChange={(e) => setFull({ ...full, clientAddress: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.address", { defaultValue: "Address" })}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.legalId")}</Label>
                                                <Input
                                                    value={full.legalId}
                                                    onChange={(e) => setFull({ ...full, legalId: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.placeholders.legalId", { defaultValue: "Legal ID" })}
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
                                                    value={full.taxCode}
                                                    onChange={(e) => setFull({ ...full, taxCode: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.invoice.taxCodePlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.invoice.taxName")}</Label>
                                                <Input
                                                    value={full.taxName}
                                                    onChange={(e) => setFull({ ...full, taxName: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.invoice.taxNamePlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.invoice.taxEmail")}</Label>
                                                <Input
                                                    value={full.taxEmail}
                                                    onChange={(e) => setFull({ ...full, taxEmail: e.target.value })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder={t("crm.clients.sections.invoice.taxEmailPlaceholder")}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">{t("crm.clients.invoice.taxAddress")}</Label>
                                                <Textarea
                                                    value={full.taxAddress}
                                                    onChange={(e) => setFull({ ...full, taxAddress: e.target.value })}
                                                    className="mt-1 text-sm bg-background border border-border"
                                                    rows={3}
                                                    placeholder={t("crm.clients.sections.invoice.taxAddressPlaceholder")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-foreground">Người liên hệ</h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Họ tên</Label>
                                                <Input
                                                    value={full.contactPerson.contactName}
                                                    onChange={(e) => setFull({ ...full, contactPerson: { ...full.contactPerson, contactName: e.target.value } })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder="Họ tên người liên hệ"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Số điện thoại</Label>
                                                    <Input
                                                        value={full.contactPerson.contactPhone}
                                                        onChange={(e) => setFull({ ...full, contactPerson: { ...full.contactPerson, contactPhone: e.target.value } })}
                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                        placeholder="Số điện thoại"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                                    <Input
                                                        value={full.contactPerson.contactEmail}
                                                        onChange={(e) => setFull({ ...full, contactPerson: { ...full.contactPerson, contactEmail: e.target.value } })}
                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                        placeholder="Email"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">Chức vụ</Label>
                                                <Input
                                                    value={full.contactPerson.contactPosition}
                                                    onChange={(e) => setFull({ ...full, contactPerson: { ...full.contactPerson, contactPosition: e.target.value } })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder="Chức vụ"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">Địa chỉ</Label>
                                                <Input
                                                    value={full.contactPerson.contactAddress}
                                                    onChange={(e) => setFull({ ...full, contactPerson: { ...full.contactPerson, contactAddress: e.target.value } })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder="Địa chỉ"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 border border-border rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold text-foreground">Nơi nhận kết quả</h3>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Người nhận</Label>
                                                <Input
                                                    value={full.reportRecipient.receiverName}
                                                    onChange={(e) => setFull({ ...full, reportRecipient: { ...full.reportRecipient, receiverName: e.target.value } })}
                                                    className="mt-1 h-8 text-sm bg-background border border-border"
                                                    placeholder="Tên người nhận báo cáo"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Số điện thoại</Label>
                                                    <Input
                                                        value={full.reportRecipient.receiverPhone}
                                                        onChange={(e) => setFull({ ...full, reportRecipient: { ...full.reportRecipient, receiverPhone: e.target.value } })}
                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                        placeholder="Số điện thoại"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                                    <Input
                                                        value={full.reportRecipient.receiverEmail}
                                                        onChange={(e) => setFull({ ...full, reportRecipient: { ...full.reportRecipient, receiverEmail: e.target.value } })}
                                                        className="mt-1 h-8 text-sm bg-background border border-border"
                                                        placeholder="Email"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs text-muted-foreground">Địa chỉ nhận</Label>
                                                <Textarea
                                                    value={full.reportRecipient.receiverAddress}
                                                    onChange={(e) => setFull({ ...full, reportRecipient: { ...full.reportRecipient, receiverAddress: e.target.value } })}
                                                    className="mt-1 text-sm bg-background border border-border"
                                                    rows={2}
                                                    placeholder="Địa chỉ nhận báo cáo"
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
                                                        <Label className="text-xs text-muted-foreground mb-2 block">Thông tin mẫu</Label>
                                                        <div className="bg-background rounded-md border border-border p-2">
                                                            <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                                                                <div className="col-span-5"><Label className="text-[11px] text-muted-foreground">Trường</Label></div>
                                                                <div className="col-span-7"><Label className="text-[11px] text-muted-foreground">Giá trị</Label></div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {sample.sampleInfo.map((row, rowIndex) => (
                                                                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                                                                        <div className="col-span-5">
                                                                            <div className="h-7 flex items-center px-2 text-xs text-muted-foreground bg-muted/30 rounded border border-border/50 truncate">
                                                                                {row.label}
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-span-7">
                                                                            <Input
                                                                                value={row.value}
                                                                                onChange={(e) => {
                                                                                    const next = [...full.samples];
                                                                                    const smp = next[sampleIndex];
                                                                                    if (!smp) return;
                                                                                    const r = smp.sampleInfo[rowIndex];
                                                                                    if (!r) return;
                                                                                    smp.sampleInfo[rowIndex] = { ...r, value: e.target.value };
                                                                                    // Đồng bộ sampleName nếu là "Tên mẫu thử"
                                                                                    if (row.label === "Tên mẫu thử") {
                                                                                        next[sampleIndex] = { ...smp, sampleName: e.target.value };
                                                                                    }
                                                                                    setFull({ ...full, samples: next });
                                                                                }}
                                                                                disabled={submitting}
                                                                                className="h-7 text-xs bg-background border border-border"
                                                                                placeholder={row.label}
                                                                            />
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
                                                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">Nền mẫu</th>
                                                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">Công nhận</th>
                                                                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">Đơn vị</th>
                                                                        <th className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground">Đơn giá</th>
                                                                        <th className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground w-10" />
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

                                                                            <td className="px-2 py-1.5 text-xs text-muted-foreground">
                                                                                {(analysis._raw?.analysis?.sampleTypeName ?? analysis._raw?.sampleTypeName ?? "") || <span className="italic opacity-40">—</span>}
                                                                            </td>

                                                                            <td className="px-2 py-1.5 text-xs">
                                                                                {(() => {
                                                                                    const acc = analysis._raw?.analysis?.protocolAccreditation ?? analysis._raw?.protocolAccreditation;
                                                                                    if (!acc || typeof acc !== "object") return <span className="italic opacity-40">—</span>;
                                                                                    const keys = Object.entries(acc as Record<string, boolean>)
                                                                                        .filter(([, v]) => v === true)
                                                                                        .map(([k]) => k);
                                                                                    return keys.length > 0
                                                                                        ? <span className="flex flex-wrap gap-1">{keys.map(k => <span key={k} className="bg-primary/10 text-primary text-[10px] px-1 rounded">{k}</span>)}</span>
                                                                                        : <span className="italic opacity-40">—</span>;
                                                                                })()}
                                                                            </td>

                                                                            <td className="px-2 py-1.5 text-xs text-muted-foreground">
                                                                                {(analysis._raw?.analysis?.analysisUnit ?? analysis._raw?.analysisUnit ?? "") || <span className="italic opacity-40">—</span>}
                                                                            </td>

                                                                            <td className="px-2 py-1.5 text-right text-xs font-medium">
                                                                                {analysis.feeBeforeTax > 0
                                                                                    ? Number(analysis.feeBeforeTax).toLocaleString("vi-VN")
                                                                                    : <span className="italic opacity-40">—</span>}
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
        </>,
        document.body,
    );
}
