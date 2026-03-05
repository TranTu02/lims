import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { chemicalApi } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import type { ChemicalSupplier } from "@/types/chemical";

type Props = {
    supplier: ChemicalSupplier;
    onClose: () => void;
};

type ContactPerson = { contactName: string; contactEmail: string; contactPhone: string };

export function SupplierEditModal({ supplier, onClose }: Props) {
    const qc = useQueryClient();

    const [form, setForm] = useState({
        chemicalSupplierId: supplier.chemicalSupplierId,
        supplierName: supplier.supplierName ?? "",
        supplierAddress: (supplier as any).supplierAddress ?? "",
        supplierStatus: (supplier as any).supplierStatus ?? "Active",
        supplierTaxCode: (supplier as any).supplierTaxCode ?? "",
        supplierEvaluationScore: String((supplier as any).supplierEvaluationScore ?? ""),
        supplierIsoCertifications: ((supplier as any).supplierIsoCertifications as string[] | null) ?? [],
    });

    const [contacts, setContacts] = useState<ContactPerson[]>(((supplier as any).supplierContactPerson as ContactPerson[] | null) ?? []);

    const [newCert, setNewCert] = useState("");

    const mutation = useMutation({
        mutationFn: () =>
            chemicalApi.suppliers.update({
                body: {
                    ...form,
                    supplierEvaluationScore: form.supplierEvaluationScore ? Number(form.supplierEvaluationScore) : null,
                    supplierContactPerson: contacts,
                },
            }),
        onSuccess: (res) => {
            if (!res.success) {
                toast.error(res.error?.message || "Cập nhật thất bại");
                return;
            }
            toast.success("Đã cập nhật nhà cung cấp thành công");
            qc.invalidateQueries({ queryKey: chemicalKeys.suppliers.all() });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.message || "Lỗi không xác định");
        },
    });

    const set = (key: string, val: string | string[]) => setForm((f) => ({ ...f, [key]: val }));

    const addCert = () => {
        if (newCert.trim()) {
            setForm((f) => ({ ...f, supplierIsoCertifications: [...f.supplierIsoCertifications, newCert.trim()] }));
            setNewCert("");
        }
    };

    const removeCert = (idx: number) => setForm((f) => ({ ...f, supplierIsoCertifications: f.supplierIsoCertifications.filter((_, i) => i !== idx) }));

    const updateContact = (idx: number, key: keyof ContactPerson, val: string) => {
        setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [key]: val } : c)));
    };

    const addContact = () => setContacts((prev) => [...prev, { contactName: "", contactEmail: "", contactPhone: "" }]);
    const removeContact = (idx: number) => setContacts((prev) => prev.filter((_, i) => i !== idx));

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border w-[600px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-semibold">Chỉnh sửa Nhà Cung Cấp</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{supplier.chemicalSupplierId}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tên nhà cung cấp</label>
                            <Input value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} id="edit-sup-name" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Địa chỉ</label>
                            <Input value={form.supplierAddress} onChange={(e) => set("supplierAddress", e.target.value)} id="edit-sup-addr" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mã số thuế</label>
                                <Input value={form.supplierTaxCode} onChange={(e) => set("supplierTaxCode", e.target.value)} id="edit-sup-tax" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Điểm đánh giá</label>
                                <Input type="number" min="0" max="100" value={form.supplierEvaluationScore} onChange={(e) => set("supplierEvaluationScore", e.target.value)} id="edit-sup-score" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trạng thái</label>
                                <select
                                    id="edit-sup-status"
                                    value={form.supplierStatus}
                                    onChange={(e) => set("supplierStatus", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ISO Certifications */}
                    <div className="border-t border-border pt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chứng chỉ ISO</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {form.supplierIsoCertifications.map((cert, idx) => (
                                <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs">
                                    {cert}
                                    <button type="button" onClick={() => removeCert(idx)} className="text-muted-foreground hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="VD: ISO 9001:2015"
                                value={newCert}
                                onChange={(e) => setNewCert(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCert()}
                                id="edit-sup-cert-input"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={addCert}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Người liên hệ</p>
                            <Button type="button" variant="outline" size="sm" onClick={addContact}>
                                <Plus className="h-4 w-4 mr-1" /> Thêm
                            </Button>
                        </div>
                        {contacts.map((c, idx) => (
                            <div key={idx} className="grid grid-cols-3 gap-2 border border-border rounded-md p-3 relative">
                                <button type="button" onClick={() => removeContact(idx)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Tên</label>
                                    <Input value={c.contactName} onChange={(e) => updateContact(idx, "contactName", e.target.value)} id={`edit-contact-name-${idx}`} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Email</label>
                                    <Input value={c.contactEmail} onChange={(e) => updateContact(idx, "contactEmail", e.target.value)} id={`edit-contact-email-${idx}`} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Điện thoại</label>
                                    <Input value={c.contactPhone} onChange={(e) => updateContact(idx, "contactPhone", e.target.value)} id={`edit-contact-phone-${idx}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Lưu thay đổi
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
