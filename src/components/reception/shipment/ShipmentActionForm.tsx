import { useMemo, useState } from "react";
import type { ReceiptDetail } from "@/types/receipt";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateShipment, useShipmentsList, useShipmentFull, useShipmentsEnumList, useDeleteShipment, shipmentsGetFull, addressParseAddress, addressGetProvinces, addressGetDistricts, addressGetWards } from "@/api/shipments";
import type { AddressParseResult } from "@/api/shipments";
import type { ShipmentDetail } from "@/types/shipment";
import { Loader2, Truck, CheckCircle2, Box, Printer, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

function formatAddress(addr: any): string {
    if (!addr) return "—";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
        const { address, wardName, districtName, provinceName } = addr;
        return [address, wardName, districtName, provinceName].filter(Boolean).join(", ");
    }
    return String(addr);
}


const AddressSplitter = ({ form, prefix }: { form: any, prefix: "sender" | "receiver" }) => {
    const addressKey = `${prefix}Address`;

    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<{ ok: boolean; data?: AddressParseResult; msg?: string } | null>(null);

    const fwProvinceId = form.watch(`${prefix}ProvinceId`);
    const fwDistrictId = form.watch(`${prefix}DistrictId`);
    const fwAddressMode = form.watch(`${prefix}AddressMode`) || "NEW";
    
    const { data: pRes } = useQuery({ queryKey: ["vtp-provs", fwAddressMode], queryFn: () => addressGetProvinces({ addressType: fwAddressMode }) });
    const { data: dRes, isFetching: loadingD } = useQuery({ queryKey: ["vtp-dists", fwProvinceId, fwAddressMode], queryFn: () => addressGetDistricts(fwProvinceId!, { addressType: fwAddressMode }), enabled: !!fwProvinceId });
    
    const rawProvs = Array.isArray((pRes as any)?.data) ? (pRes as any).data : ((pRes as any) || []);
    const rawDists = Array.isArray((dRes as any)?.data) ? (dRes as any).data : ((dRes as any) || []);
    
    // Check if there is a NEW district
    const newDistrict = rawDists.find((d: any) => (d.districtValue ?? d.DISTRICT_VALUE) === "NEW" || String(d.districtId ?? d.DISTRICT_ID).length >= 8);
    const hideDistrict = !!newDistrict && fwAddressMode === "NEW";
    
    // Auto-select NEW district to bypass the District level
    if (hideDistrict && newDistrict && fwDistrictId !== (newDistrict.districtId ?? newDistrict.DISTRICT_ID)) {
        setTimeout(() => {
            const targetId = newDistrict.districtId ?? newDistrict.DISTRICT_ID;
            const targetName = newDistrict.districtName ?? newDistrict.DISTRICT_NAME;
            form.setValue(`${prefix}DistrictId`, targetId);
            form.setValue(`${prefix}DistrictName`, targetName);
            
            // Only clear ward if it's not already validly set (to avoid killing handleCheck result)
            if (!form.getValues(`${prefix}WardId`)) {
                form.setValue(`${prefix}WardId`, null);
            }
        }, 0);
    }
    
    // Wards use the active district ID
    const activeDistrictId = hideDistrict && newDistrict ? (newDistrict.districtId ?? newDistrict.DISTRICT_ID) : fwDistrictId;
    const { data: wRes, isFetching: loadingW } = useQuery({ queryKey: ["vtp-wards", activeDistrictId, fwAddressMode], queryFn: () => addressGetWards(activeDistrictId!, { addressType: fwAddressMode }), enabled: !!activeDistrictId });
    const rawWards = Array.isArray((wRes as any)?.data) ? (wRes as any).data : ((wRes as any) || []);




    const handleCheck = async () => {
        const address = form.getValues(addressKey);
        if (!address) return;
        setChecking(true);
        setCheckResult(null);
        try {
            const raw = await addressParseAddress(address, { addressType: fwAddressMode });
            // Unwrap .data wrapper if present (API envelope pattern)
            const parsed = ((raw as any)?.data ?? raw) as unknown as AddressParseResult;

            // Hợp lệ khi đủ cả 3 ID: province + district + ward
            const isValid = parsed.isValid ?? (!!parsed.provinceId && !!parsed.districtId && !!parsed.wardId);

            if (!isValid) {
                // Báo lỗi theo tầng: cụ thể chính xác phần nào sai
                let msg = "";
                if (!parsed.provinceId) {
                    msg = "Không nhận diện được Tỉnh/TP — kiểm tra lại phần cuối địa chỉ";
                } else if (!parsed.districtId) {
                    msg = `Nhận diện được tỉnh "${parsed.provinceName}" nhưng chưa đúng Huyện/Quận — kiểm tra lại`;
                } else if (!parsed.wardId) {
                    msg = `Nhận diện được Huyện "${parsed.districtName}" nhưng sai Xã/Phường — kiểm tra lại`;
                } else {
                    msg = "Địa chỉ không hợp lệ";
                }
                setCheckResult({ ok: false, msg, data: parsed });
                form.setValue(`${prefix}IsValid`, false);
            } else {
                setCheckResult({ ok: true, data: parsed });
                // Fill text fields
                form.setValue(`${prefix}Street`,   parsed.address       || "", { shouldValidate: true });
                form.setValue(`${prefix}Ward`,     parsed.wardName      || "", { shouldValidate: true });
                form.setValue(`${prefix}District`, parsed.districtName  || "", { shouldValidate: true });
                form.setValue(`${prefix}Province`, parsed.provinceName  || "", { shouldValidate: true });
                
                // Store numeric IDs and names
                form.setValue(`${prefix}ProvinceId`,   parsed.provinceId,   { shouldValidate: false });
                form.setValue(`${prefix}ProvinceName`, parsed.provinceName, { shouldValidate: false });

                // If in NEW flow and hideDistrict is likely, we should ensure the districtId is set to what we expect
                // However, parsed result should already contain the correct districtId if backend is compliant.
                form.setValue(`${prefix}DistrictId`,   parsed.districtId,   { shouldValidate: false });
                form.setValue(`${prefix}DistrictName`, parsed.districtName, { shouldValidate: false });

                form.setValue(`${prefix}WardId`,       parsed.wardId,       { shouldValidate: false });
                form.setValue(`${prefix}WardName`,     parsed.wardName,     { shouldValidate: false });
                
                form.setValue(`${prefix}IsValid`, true);
            }
        } catch {
            setCheckResult({ ok: false, msg: "Lỗi kết nối API kiểm tra địa chỉ" });
            form.setValue(`${prefix}IsValid`, false);
        } finally {
            setChecking(false);
        }
    };


    return (
        <div className="mt-3 p-3 border rounded-lg bg-muted/40 space-y-3">
            {/* Header / Config Mode */}
            <div className="flex flex-col gap-2 bg-background p-2 rounded border border-border/50">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                    <div className="text-xs text-muted-foreground font-medium uppercase">
                        Hệ thống định tuyến
                    </div>
                </div>
                <FormField
                    control={form.control}
                    name={`${prefix}AddressMode` as any}
                    render={({ field }) => (
                        <FormItem className="space-y-0">
                            <FormControl>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`${prefix}AddressMode`}
                                            value="OLD"
                                            checked={field.value === "OLD"}
                                            onChange={() => {
                                                field.onChange("OLD");
                                                form.setValue(`${prefix}ProvinceId`, null);
                                            }}
                                            className="w-3.5 h-3.5 text-primary"
                                        />
                                        Địa chỉ cũ (trước sáp nhập)
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`${prefix}AddressMode`}
                                            value="NEW"
                                            checked={field.value !== "OLD"}
                                            onChange={() => {
                                                field.onChange("NEW");
                                                form.setValue(`${prefix}ProvinceId`, null);
                                            }}
                                            className="w-3.5 h-3.5 text-primary"
                                        />
                                        Địa chỉ mới (sau sáp nhập)
                                    </label>
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            {/* Sub-header for Action */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1 border-t">
                <div className="text-xs text-muted-foreground font-medium uppercase">
                    Địa chỉ chi tiết (Auto Map)
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button" variant="outline" size="sm"
                        className="h-7 text-xs px-2 shadow-sm border-border text-foreground gap-1"
                        disabled={checking}
                        onClick={handleCheck}
                    >
                        {checking
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra...</>
                            : "🔍 Trích xuất tự động từ văn bản"
                        }
                    </Button>
                </div>
            </div>


            {/* Status feedback banner */}
            {checkResult && (
                <div className={`text-xs rounded px-3 py-2 border space-y-1 ${checkResult.ok ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300" : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300"}`}>
                    {checkResult.ok ? (
                        <>
                            <div><span className="font-semibold">✓ Địa chỉ hợp lệ đầy đủ</span></div>
                            <div className="opacity-80">
                                ProvinceId: <b>{checkResult.data?.provinceId}</b> ({checkResult.data?.provinceName})
                                {checkResult.data?.districtId ? <> · DistrictId: <b>{checkResult.data.districtId}</b> ({checkResult.data.districtName})</> : null}
                                {checkResult.data?.wardId     ? <> · WardId: <b>{checkResult.data.wardId}</b> ({checkResult.data.wardName})</> : null}
                            </div>
                        </>
                    ) : (
                        <>
                            <div><span className="font-semibold">⚠ {checkResult.msg}</span></div>
                            {/* Hiển thị phần đã nhận diện được */}
                            {(checkResult.data?.provinceId || checkResult.data?.districtId) && (
                                <div className="opacity-70">
                                    Đã nhận diện:
                                    {checkResult.data?.provinceId ? <> Tỉnh "<b>{checkResult.data.provinceName}</b>"</> : null}
                                    {checkResult.data?.districtId ? <> → Huyện "<b>{checkResult.data.districtName}</b>"</> : null}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Editable address fields via Selects */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-3 rounded border">
                <FormField control={form.control} name={`${prefix}ProvinceId` as any} render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground font-bold">Tỉnh/Thành Phố</FormLabel>
                        <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => {
                            const p = rawProvs.find((x: any) => String(x.provinceId ?? x.PROVINCE_ID) === v);
                            if (!p) return;
                            const id = p.provinceId ?? p.PROVINCE_ID;
                            const name = p.provinceName ?? p.PROVINCE_NAME;
                            field.onChange(id);
                            form.setValue(`${prefix}ProvinceName`, name);
                            form.setValue(`${prefix}DistrictId`, null);
                            form.setValue(`${prefix}WardId`, null);
                            form.setValue(`${prefix}IsValid`, false);
                        }}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Chọn Tỉnh/TP" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {rawProvs.map((p: any) => {
                                    const id = p.provinceId ?? p.PROVINCE_ID;
                                    const name = p.provinceName ?? p.PROVINCE_NAME;
                                    return <SelectItem key={String(id)} value={String(id)} className="text-xs">{name}</SelectItem>
                                })}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />

                {!hideDistrict && (
                    <FormField control={form.control} name={`${prefix}DistrictId` as any} render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] uppercase text-muted-foreground font-bold">Quận/Huyện</FormLabel>
                            <Select disabled={!fwProvinceId || loadingD} value={field.value ? String(field.value) : undefined} onValueChange={(v) => {
                                const d = rawDists.find((x: any) => String(x.districtId ?? x.DISTRICT_ID) === v);
                                if (!d) return;
                                const id = d.districtId ?? d.DISTRICT_ID;
                                const name = d.districtName ?? d.DISTRICT_NAME;
                                field.onChange(id);
                                form.setValue(`${prefix}DistrictName`, name);
                                form.setValue(`${prefix}WardId`, null);
                                form.setValue(`${prefix}IsValid`, false);
                            }}>
                                <FormControl>
                                    <SelectTrigger className="h-8 text-xs bg-background">
                                        <SelectValue placeholder={loadingD ? "Đang tải..." : "Chọn Quận/Huyện"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {rawDists.map((d: any) => {
                                        const id = d.districtId ?? d.DISTRICT_ID;
                                        const name = d.districtName ?? d.DISTRICT_NAME;
                                        return <SelectItem key={String(id)} value={String(id)} className="text-xs">{name}</SelectItem>
                                    })}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                )}

                <FormField control={form.control} name={`${prefix}WardId` as any} render={({ field }) => (
                    <FormItem className={hideDistrict ? "col-span-2" : ""}>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground font-bold">Xã/Phường</FormLabel>
                        <Select disabled={!activeDistrictId || loadingW} value={field.value ? String(field.value) : undefined} onValueChange={(v) => {
                            const w = rawWards.find((x: any) => String(x.wardId ?? x.WARD_ID ?? x.WARDS_ID) === v);
                            if (!w) return;
                            const id = w.wardId ?? w.WARD_ID ?? w.WARDS_ID;
                            const name = w.wardName ?? w.WARD_NAME ?? w.WARDS_NAME;
                            field.onChange(id);
                            form.setValue(`${prefix}WardName`, name);
                            form.setValue(`${prefix}IsValid`, true); // Usually valid if all selected
                        }}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs bg-background">
                                    <SelectValue placeholder={loadingW ? "Đang tải..." : "Chọn Xã/Phường"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {rawWards.map((w: any) => {
                                    const id = w.wardId ?? w.WARD_ID ?? w.WARDS_ID;
                                    const name = w.wardName ?? w.WARD_NAME ?? w.WARDS_NAME;
                                    return <SelectItem key={String(id)} value={String(id)} className="text-xs">{name}</SelectItem>
                                })}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />

                <FormField control={form.control} name={`${prefix}Street` as any} render={({ field }) => (
                    <FormItem className={hideDistrict ? "col-span-1" : "col-span-2 lg:col-span-1"}>
                        <FormLabel className="text-[10px] uppercase text-muted-foreground font-bold">Số nhà/Đường</FormLabel>
                        <FormControl><Input className="h-8 text-xs bg-background" {...field} value={(field.value as string) || ""} /></FormControl>
                    </FormItem>
                )} />
            </div>
        </div>
    );
};

const formSchema = z.object({
    mode: z.string(),
    existingTrackingNumber: z.string().optional(),
    attachShipmentId: z.string().optional(),
    
    senderName: z.string().min(1, "Bắt buộc"),
    senderPhone: z.string().min(1, "Bắt buộc"),
    senderAddress: z.string().min(1, "Bắt buộc"),
    senderStreet: z.string().optional(),
    senderWard: z.string().optional(),
    senderDistrict: z.string().optional(),
    senderProvince: z.string().optional(),

    receiverName: z.string().min(1, "Bắt buộc"),
    receiverPhone: z.string().min(1, "Bắt buộc"),
    receiverAddress: z.string().min(1, "Bắt buộc"),
    receiverStreet: z.string().optional(),
    receiverWard: z.string().optional(),
    receiverDistrict: z.string().optional(),
    receiverProvince: z.string().optional(),
    
    productQuantity: z.number().min(1),
    productWeight: z.number().min(0.1),
    note: z.string().optional(),
    orderService: z.string().optional(),

    // Extra fields for granular address (Snapshot JSONB)
    senderProvinceId: z.number().optional().nullable(),
    senderProvinceName: z.string().optional().nullable(),
    senderDistrictId: z.number().optional().nullable(),
    senderDistrictName: z.string().optional().nullable(),
    senderWardId: z.number().optional().nullable(),
    senderWardName: z.string().optional().nullable(),
    senderIsValid: z.boolean().optional(),
    senderAddressMode: z.enum(["NEW", "OLD"]).optional(),

    receiverProvinceId: z.number().optional().nullable(),
    receiverProvinceName: z.string().optional().nullable(),
    receiverDistrictId: z.number().optional().nullable(),
    receiverDistrictName: z.string().optional().nullable(),
    receiverWardId: z.number().optional().nullable(),
    receiverWardName: z.string().optional().nullable(),
    receiverIsValid: z.boolean().optional(),
    receiverAddressMode: z.enum(["NEW", "OLD"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
    receipt: ReceiptDetail;
    onSuccess?: () => void;
    onPrintLabel?: (shipmentId: string) => void;
}

export default function ShipmentActionForm({ receipt, onSuccess, onPrintLabel }: Props) {
    const createShipment = useCreateShipment();
    const deleteShipment = useDeleteShipment();
    
    // Dynamic carriers & services
    const { data: carriersOptions, isLoading: isLoadingCarriers } = useShipmentsEnumList("shipmentCarrier");
    const { data: vtpOrderServices, isLoading: isLoadingServices } = useShipmentsEnumList("VTPOrderService");

    // 1. Try to get the identifier directly from the receipt object
    const directShipmentId = receipt.shipmentId;
    const trackingNo = receipt.shipmentTrackingNumber;

    // 2. Only search via list if we have no ID and no tracking number to look up
    const { data: qResult, isLoading: isChecking } = useShipmentsList({
        query: { search: receipt.receiptId, itemsPerPage: 1 }
    }, { enabled: !!receipt.receiptId && !directShipmentId && !trackingNo });

    // Helper to safely get the array of shipments from the query result
    const shipments = useMemo(() => {
        const data = qResult;
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray((data as any).data)) return (data as any).data;
        return [];
    }, [qResult]) as any[];

    // 3. Determine the identifier to use for get/full
    const shipmentIdToFetch = directShipmentId || shipments.find((s: any) => s.shipmentReceiptIds?.includes(receipt.receiptId))?.shipmentId;
    
    // We pass trackingNumber if id is not available
    const { data: fullShipment, isLoading: isFullLoading } = useShipmentFull(shipmentIdToFetch || "", {
        enabled: !!shipmentIdToFetch || !!trackingNo,
        trackingNumber: !shipmentIdToFetch ? trackingNo : undefined
    } as any);

    const existingShipment = (fullShipment || shipments.find((s: any) => s.shipmentReceiptIds?.includes(receipt.receiptId))) as ShipmentDetail | undefined;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mode: "VIETTEL_POST",
            senderName: "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN",
            senderPhone: "0943 863 355 - 0912 359 499",
            senderAddress: "176 Phùng Khoang, Phường Đại Mỗ, Thành phố Hà Nội",
            senderAddressMode: "NEW",
            
            receiverName: receipt.reportRecipient?.receiverName || "",
            receiverPhone: receipt.reportRecipient?.receiverPhone || "",
            receiverAddress: receipt.reportRecipient?.receiverAddress || "",
            receiverAddressMode: "NEW",
            
            productQuantity: 1,
            productWeight: 100,
            note: "Hồ sơ và kết quả thử nghiệm mẫu",
            orderService: "VTK",
            senderIsValid: false,
            receiverIsValid: false,
        }
    });

    const mode = form.watch("mode");

    const onSubmit = async (values: FormValues) => {
        // Validation for valid addresses
        if (!values.senderIsValid) {
            toast.error("Vui lòng kiểm tra và chọn đầy đủ địa danh người gửi để đảm bảo tính hợp lệ (Tỉnh, Quận/Huyện, Xã) trước khi tạo đơn.");
            return;
        }
        if (!values.receiverIsValid) {
            toast.error("Vui lòng kiểm tra và chọn đầy đủ địa danh người nhận để đảm bảo tính hợp lệ (Tỉnh, Quận/Huyện, Xã) trước khi tạo đơn.");
            return;
        }

        if (values.mode === "ghep_don") {
            if (!values.attachShipmentId) {
                form.setError("attachShipmentId", { type: "manual", message: "Vui lòng nhập mã vận đơn khác để ghép chung" });
                return;
            }
            try {
                // Xác nhận lấy api get detail shipmentId 
                await shipmentsGetFull({ id: values.attachShipmentId });
            } catch (error) {
                form.setError("attachShipmentId", { type: "manual", message: "Không tìm thấy mã vận đơn này hợp lệ" });
                return;
            }
        }

        const refs = receipt.samples?.map(s => s.sampleId) || [];
        refs.push(receipt.receiptId);

        // Build granular address objects
        const senderAddressSnapshot = {
            address: values.senderStreet,
            wardId: values.senderWardId,
            wardName: values.senderWardName,
            districtId: values.senderDistrictId,
            districtName: values.senderDistrictName,
            provinceId: values.senderProvinceId,
            provinceName: values.senderProvinceName
        };

        const receiverAddressSnapshot = {
            address: values.receiverStreet,
            wardId: values.receiverWardId,
            wardName: values.receiverWardName,
            districtId: values.receiverDistrictId,
            districtName: values.receiverDistrictName,
            provinceId: values.receiverProvinceId,
            provinceName: values.receiverProvinceName
        };

        createShipment.mutate({
            body: {
                mode: values.mode === "ghep_don" || values.mode === "attach" ? "attach" : "pickup",
                shipmentCarrier: (values.mode !== "ghep_don" && values.mode !== "attach") ? values.mode : undefined,
                existingTrackingNumber: values.existingTrackingNumber,
                attachShipmentId: values.attachShipmentId,
                shipmentId: values.mode === "ghep_don" ? values.attachShipmentId : undefined,
                
                shipmentStatus: "CREATED",
                shipmentNote: values.note,
                shipmentReceiptIds: [receipt.receiptId],
                shipmentReferenceIds: refs,

                shipmentSender: {
                    senderName: values.senderName,
                    senderPhone: values.senderPhone,
                    senderAddress: senderAddressSnapshot as any,
                },
                shipmentReceiver: {
                    receiverName: values.receiverName,
                    receiverPhone: values.receiverPhone,
                    receiverAddress: receiverAddressSnapshot as any,
                    receiverEmail: receipt.reportRecipient?.receiverEmail || "",
                },
                shipmentProduct: {
                    name: `IRDOP gửi phiếu kết quả thử nghiệm theo đơn hàng ${receipt.orderId || "N/A"} có mã tiếp nhận: ${receipt.receiptId}`,
                    description: `gồm ${receipt.samples?.length || 0} phiếu kết quả`,
                    quantity: values.productQuantity,
                    weight: values.productWeight,
                    type: "HH",
                },
                shipmentItems: receipt.samples?.map(s => ({
                    name: s.sampleName || s.sampleId,
                    type: s.sampleTypeName || "HH",
                    weight: parseFloat((s.sampleWeight as string) || "0") || 0,
                    quantity: 1
                })) || [],
                shipmentOrder: {
                    payment: 3,
                    service: values.orderService || "VTK",
                    serviceAddress: "",
                    voucher: "",
                    note: values.note,
                }
            }
        }, {
            onSuccess: () => {
                onSuccess?.();
            }
        });
    };

    if (isChecking || isFullLoading) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Đang tải chi tiết vận chuyển...</p>
            </div>
        );
    }

    if (existingShipment) {
        return (
            <div className="space-y-6 h-full flex flex-col">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center shadow-sm">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Đã tồn tại Vận Đơn</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Phiếu nhận này đã được gán mã vận đơn: <br/>
                        <span className="inline-block mt-2 px-3 py-1 bg-background font-mono text-base border rounded uppercase tracking-wider font-semibold shadow-sm">{existingShipment.shipmentTrackingNumber || "N/A"}</span>
                    </p>
                    
                    <div className="flex flex-col gap-3 w-full max-w-[250px] mx-auto mt-2">
                        <Button className="w-full gap-2" onClick={() => onPrintLabel?.(existingShipment.shipmentId)}>
                            <Printer className="w-4 h-4" />
                            In tem vận chuyển
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30" 
                            disabled={deleteShipment.isPending}
                            onClick={() => {
                                if (!confirm("Hủy vận đơn này sẽ thao tác với hệ thống đối tác! Tiếp tục?")) return;
                                deleteShipment.mutate({ body: { shipmentId: existingShipment.shipmentId } }, { onSuccess });
                            }}
                        >
                            {deleteShipment.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Trash2 className="w-4 h-4 mr-2" />}
                            Hủy vận đơn này
                        </Button>
                        <Button variant="ghost" className="w-full text-xs" onClick={onSuccess}>Đóng cửa sổ</Button>
                    </div>
                </div>

                <div className="flex-1">
                    <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-3 px-1">Chi tiết</h4>
                    <Card className="shadow-none border-muted">
                        <CardContent className="p-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <span className="text-muted-foreground flex items-center gap-2"><Truck className="w-4 h-4"/> Đơn vị VC</span>
                                <span className="font-semibold text-foreground">{existingShipment.shipmentCarrier || "Chưa xác định"}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-muted-foreground">Trạng thái</span> 
                                <Badge variant={existingShipment.shipmentStatus === "CREATED" ? "secondary" : "default"}>
                                    {existingShipment.shipmentStatus}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-muted-foreground">Người nhận</span>
                                <span className="text-right font-medium">{String(existingShipment.shipmentReceiver?.receiverName || "—")}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground pt-0.5 whitespace-nowrap">Địa chỉ</span>
                                <span className="text-right line-clamp-2 text-xs text-muted-foreground">
                                    {formatAddress(existingShipment.shipmentReceiver?.receiverAddress)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                
                <div className="flex items-center border-b pb-4">
                    <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Khởi tạo Vận chuyển</h3>
                        <p className="text-xs text-muted-foreground">Thiết lập thông tin nhà vận chuyển và người nhận.</p>
                    </div>
                </div>
                
                <div className="flex-1 hover:overscroll-contain overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                    
                    {/* Carrier Mode */}
                    <Card className="shadow-none border border-muted bg-muted/20">
                        <CardContent className="p-4 space-y-4">
                            <FormField
                                control={form.control}
                                name="mode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5"/> Hình thức giao hàng</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue placeholder="Chọn hình thức" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {isLoadingCarriers ? (
                                                    <SelectItem value="loading" disabled>Đang tải danh sách...</SelectItem>
                                                ) : (
                                                    (carriersOptions as string[])?.map((c: string) => (
                                                        <SelectItem key={c} value={c}>
                                                            {c === "VIETTEL_POST" ? "ViettelPost" : c === "DIRECT_DELIVERY" ? "Lấy trực tiếp (Pickup)" : c}
                                                        </SelectItem>
                                                    ))
                                                )}
                                                <SelectItem value="ghep_don">Gửi cùng vận đơn khác (Ghép đơn)</SelectItem>
                                                <SelectItem value="attach">Nhập mã vận đơn ngoài có sẵn</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {mode === "attach" && (
                                <FormField
                                    control={form.control}
                                    name="existingTrackingNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã Tracking (GHTK, Grab...)</FormLabel>
                                            <FormControl>
                                                <Input className="bg-background uppercase" placeholder="VD: GHTK1234..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {mode === "ghep_don" && (
                                <FormField
                                    control={form.control}
                                    name="attachShipmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã Vận Đơn (Shipment ID)</FormLabel>
                                            <FormControl>
                                                <Input className="bg-background" placeholder="Nhập ID vận đơn để gửi cùng..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Sender Info */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Thông tin người gửi</h4>
                        <div className="grid gap-3 p-3 border rounded-lg bg-card">
                            <FormField control={form.control} name="senderName" render={({ field }) => <FormItem><FormControl><Input placeholder="Tên người gửi" {...field} /></FormControl><FormMessage/></FormItem>} />
                            <FormField control={form.control} name="senderPhone" render={({ field }) => <FormItem><FormControl><Input placeholder="Số điện thoại" {...field} /></FormControl><FormMessage/></FormItem>} />
                            <FormField control={form.control} name="senderAddress" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea className="resize-none h-16" placeholder="Địa chỉ chi tiết (nhà, ngõ, phường, huyện, tỉnh...)" {...field} />
                                    </FormControl>
                                    <AddressSplitter form={form} prefix="sender" />
                                    <FormMessage/>
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Receiver Info */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Thông tin người nhận</h4>
                        <div className="grid gap-3 p-3 border rounded-lg bg-card">
                            <FormField control={form.control} name="receiverName" render={({ field }) => <FormItem><FormControl><Input placeholder="Tên người nhận" {...field} /></FormControl><FormMessage/></FormItem>} />
                            <FormField control={form.control} name="receiverPhone" render={({ field }) => <FormItem><FormControl><Input placeholder="Số điện thoại" {...field} /></FormControl><FormMessage/></FormItem>} />
                            <FormField control={form.control} name="receiverAddress" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea className="resize-none h-16" placeholder="Địa chỉ chi tiết (nhà, ngõ, phường, huyện, tỉnh...)" {...field} />
                                    </FormControl>
                                    <AddressSplitter form={form} prefix="receiver" />
                                    <FormMessage/>
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Package Details */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-t pt-5">Chi tiết gói hàng</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="productQuantity" render={({ field }) => 
                                <FormItem>
                                    <FormLabel className="text-xs">Số lượng (kiện)</FormLabel>
                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/></FormControl>
                                </FormItem>
                            } />
                            <FormField control={form.control} name="productWeight" render={({ field }) => 
                                <FormItem>
                                    <FormLabel className="text-xs">Trọng lượng (kg)</FormLabel>
                                    <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/></FormControl>
                                </FormItem>
                            } />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="orderService" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Dịch vụ vận chuyển</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "VTK"}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn dịch vụ" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isLoadingServices ? (
                                                <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                                            ) : (
                                                (vtpOrderServices as string[])?.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="note" render={({ field }) => 
                                <FormItem>
                                    <FormLabel className="text-xs">Ghi chú (in trên tem)</FormLabel>
                                    <FormControl><Input placeholder="VD: Báo cáo kết quả..." {...field} /></FormControl>
                                </FormItem>
                            } />
                        </div>
                    </div>

                </div>

                <div className="pt-4 border-t mt-auto">
                    <Button type="submit" size="lg" className="w-full font-bold shadow-md" disabled={createShipment.isPending}>
                        {createShipment.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {createShipment.isPending ? "Đang xử lý tạo vận đơn..." : "TẠO VẬN ĐƠN MỚI"}
                    </Button>
                </div>
                
            </form>
        </Form>
    );
}
