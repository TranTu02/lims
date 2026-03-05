import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Package, Pencil, Phone, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalSupplier } from "@/types/chemical";
import { useChemicalSupplierFull } from "@/api/chemical";
import { SupplierEditModal } from "./SupplierEditModal";

type Props = {
    supplier: ChemicalSupplier | null;
    onClose: () => void;
    onEdit?: (sup: ChemicalSupplier) => void;
};

export function SupplierDetailPanel({ supplier, onClose }: Props) {
    const { t } = useTranslation();
    const [editOpen, setEditOpen] = useState(false);

    const fullSupQuery = useChemicalSupplierFull(supplier?.chemicalSupplierId || "", {
        enabled: !!supplier?.chemicalSupplierId,
    });

    const displaySup = fullSupQuery.data || supplier;

    if (!displaySup) return null;

    const suppliedSkus = (displaySup as any).suppliedSkus as any[] | undefined;
    const contact = displaySup.supplierContactPerson?.[0];

    return (
        <>
            <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
                <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Hồ sơ Nhà Cung Cấp</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{displaySup.chemicalSupplierId}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} type="button" title={String(t("common.edit", { defaultValue: "Chỉnh sửa" }))}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose} type="button">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {fullSupQuery.isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* General Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Tên pháp nhân</div>
                                <div className="text-base text-foreground font-semibold mt-1">{displaySup.supplierName || "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Trạng thái</div>
                                <div className="mt-1">
                                    <Badge variant={displaySup.supplierStatus === "Active" ? "default" : displaySup.supplierStatus === "Inactive" ? "secondary" : "destructive"}>
                                        {displaySup.supplierStatus || "-"}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Điểm đánh giá</div>
                                <div className="text-sm font-medium mt-1">{displaySup.supplierEvaluationScore ?? "-"} / 100</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Mã số thuế</div>
                                <div className="text-sm font-medium mt-1">{displaySup.supplierTaxCode || "-"}</div>
                            </div>

                            <div className="col-span-2">
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Chứng chỉ</div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {displaySup.supplierIsoCertifications?.length ? (
                                        displaySup.supplierIsoCertifications.map((c, i) => (
                                            <Badge key={i} variant="outline">
                                                {c}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm">-</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Detail */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between border-b border-border pb-1.5">
                                <h3 className="text-sm font-semibold">Thông tin Liên hệ</h3>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-md border border-border space-y-2">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <span className="text-sm">{displaySup.supplierAddress || "Chưa cập nhật địa chỉ"}</span>
                                </div>
                                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border">
                                    {contact ? (
                                        <>
                                            {contact.contactName && <div className="text-sm font-medium">{contact.contactName}</div>}
                                            {contact.contactPhone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {contact.contactPhone}
                                                </div>
                                            )}
                                            {contact.contactEmail && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {contact.contactEmail}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-sm italic text-muted-foreground">Chưa có người liên hệ</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Supplied Skus */}
                        {suppliedSkus && suppliedSkus.length > 0 && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border pb-1.5">
                                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                        <Package className="h-4 w-4 text-primary" />
                                        Danh mục Hàng cung cấp
                                    </h3>
                                    <Badge variant="secondary" className="rounded-full">
                                        {suppliedSkus.length}
                                    </Badge>
                                </div>
                                <div className="grid gap-2">
                                    {suppliedSkus.map((supSku: any) => (
                                        <div key={supSku.chemicalSku_chemicalSupplierId} className="p-3 border border-border rounded-md text-sm hover:bg-muted/10">
                                            <div className="font-medium text-foreground mb-1">{supSku.chemicalSku?.chemicalName || supSku.chemicalSkuId}</div>
                                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <span>
                                                    Mã HC: <span className="font-mono text-primary">{supSku.chemicalSkuId}</span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground text-xs mt-1 bg-muted/30 p-1.5 rounded">
                                                <span>
                                                    Mã Catalog: <strong className="text-foreground">{supSku.catalogNumber}</strong>
                                                </span>
                                                <span>
                                                    Hãng: <strong className="text-foreground">{supSku.brandManufacturer}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {editOpen && <SupplierEditModal supplier={displaySup as any} onClose={() => setEditOpen(false)} />}
        </>
    );
}
