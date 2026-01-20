import { useTranslation } from "react-i18next";
import { X, Package, Phone, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/crm";

interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
    onCreateReceipt: (order: Order) => void;
}

export function OrderDetailModal({ order, onClose, onCreateReceipt }: OrderDetailModalProps) {
    const { t } = useTranslation();

    const formatCurrency = (amount: string | number | undefined) => {
        if (amount === undefined) return "0 ₫";
        const num = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-foreground">{t("crm.orders.title")}</h2>
                        <Badge variant="outline" className="text-base">
                            {order.orderId}
                        </Badge>
                        {order.orderStatus === "Completed" ? (
                            <Badge variant="default" className="bg-success hover:bg-success/90">
                                {t("crm.orders.status.Completed")}
                            </Badge>
                        ) : order.orderStatus === "Pending" ? (
                            <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning-200">
                                {t("crm.orders.status.Pending")}
                            </Badge>
                        ) : (
                            <Badge variant="outline">{order.orderStatus}</Badge>
                        )}
                        {order.paymentStatus === "Paid" && (
                            <Badge variant="default" className="bg-primary hover:bg-primary/90">
                                {t("crm.orders.paymentStatus.Paid")}
                            </Badge>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Customer & Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Customer Info */}
                        <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <h3 className="font-semibold text-sm mb-3 text-foreground">{t("crm.clients.clientName")}</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{t("crm.clients.clientName")}:</span>
                                    <div className="font-medium text-foreground">{order.client?.clientName}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t("crm.clients.legalId")}:</span>
                                    <div className="font-medium text-foreground">{order.client?.legalId}</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="text-foreground">{order.client?.clientAddress}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-foreground">{order.client?.clientPhone}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-foreground">{order.client?.clientEmail}</div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Person Info */}
                        <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <h3 className="font-semibold text-sm mb-3 text-foreground">{t("reception.createReceipt.contactInfo")}</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{t("crm.contacts.contactName")}:</span>
                                    <div className="font-medium text-foreground">{order.contactPerson?.contactName}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-foreground">{order.contactPerson?.contactPhone}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-foreground">{order.contactPerson?.contactEmail}</div>
                                </div>
                                {order.salePerson && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <span className="text-muted-foreground">{t("crm.orders.salePerson")}:</span>
                                        <div className="font-medium text-foreground">{order.salePerson}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="border border-border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-sm mb-3 text-foreground">{t("crm.orders.title")}</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">{t("crm.orders.createdAt")}:</span>
                                <div className="font-medium text-foreground">{formatDate(order.createdAt as string)}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{t("crm.orders.sampleCount")}:</span>
                                <div className="font-medium text-foreground">{order.samples.length}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{t("crm.orders.parameterCount")}:</span>
                                <div className="font-medium text-foreground">{order.samples.reduce((sum, s) => sum + s.analyses.length, 0)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Samples & Analyses */}
                    <div className="border border-border rounded-lg overflow-hidden bg-background">
                        <div className="bg-muted/50 px-4 py-3 border-b border-border">
                            <h3 className="font-semibold text-sm text-foreground">{t("reception.createReceipt.samplesList")}</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {order.samples.map((sample, sampleIndex) => (
                                <div key={sampleIndex} className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-primary" />
                                                <span className="font-semibold text-foreground">
                                                    {t("lab.samples.sampleId")} #{sampleIndex + 1}: {sample.sampleName}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 ml-6">{sample.sampleTypeName}</div>
                                        </div>
                                        <Badge variant="outline" className="text-base">
                                            {sample.analyses.length} {t("lab.analyses.title")}
                                        </Badge>
                                    </div>

                                    {/* Analysis Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-muted/30 border-y border-border">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">STT</th>
                                                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t("lab.analyses.parameterName")}</th>
                                                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">{t("lab.analyses.method")}</th>
                                                    <th className="px-3 py-2 text-center text-muted-foreground font-medium">{t("common.quantity")}</th>
                                                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">{t("crm.quotes.unitPrice")}</th>
                                                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">{t("crm.quotes.tax")}(%)</th>
                                                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">{t("crm.quotes.total")}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {sample.analyses.map((analysis, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/20">
                                                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium text-foreground">{analysis.parameterName}</div>
                                                            <div className="text-muted-foreground">ID: {analysis.parameterId}</div>
                                                        </td>
                                                        <td className="px-3 py-2 text-foreground">{analysis.protocolCode || "-"}</td>
                                                        <td className="px-3 py-2 text-center text-foreground">{analysis.quantity || 1}</td>
                                                        <td className="px-3 py-2 text-right text-foreground">{formatCurrency(analysis.unitPrice)}</td>
                                                        <td className="px-3 py-2 text-right text-foreground">{analysis.taxRate}%</td>
                                                        <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(analysis.feeAfterTax)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attached Files/Documents */}
                    <div className="border border-border rounded-lg overflow-hidden bg-background">
                        <div className="bg-muted/50 px-4 py-3 border-b border-border">
                            <h3 className="font-semibold text-sm text-foreground">{t("reception.receiptDetail.digitalRecords")}</h3>
                        </div>
                        <div className="p-4">
                            <div className="text-sm text-muted-foreground text-center py-3">{t("reception.receiptDetail.noFile")}</div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="border border-border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-sm mb-3 text-foreground">{t("crm.quotes.subTotal")}</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("crm.quotes.subTotal")}:</span>
                                <span className="font-medium text-foreground">{formatCurrency(order.totalFeeBeforeTax)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("crm.quotes.tax")}:</span>
                                <span className="font-medium text-foreground">{formatCurrency(order.totalTaxValue)}</span>
                            </div>
                            {order.totalDiscountValue > 0 && (
                                <div className="flex justify-between text-destructive">
                                    <span>{t("crm.quotes.discount")}:</span>
                                    <span className="font-medium">-{formatCurrency(order.totalDiscountValue)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-border">
                                <span className="font-semibold text-foreground">{t("crm.quotes.total")}:</span>
                                <span className="font-bold text-lg text-primary">{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                    <Button variant="outline" onClick={onClose}>
                        {t("common.close")}
                    </Button>
                    {!order.receiptId && (
                        <Button
                            variant="default"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => {
                                onCreateReceipt(order);
                                onClose();
                            }}
                        >
                            {t("reception.dashboard.createReceipt")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
