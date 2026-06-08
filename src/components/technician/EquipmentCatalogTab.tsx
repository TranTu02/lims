import { useState, useMemo } from "react";
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Loader2, 
    Settings, 
    Wrench,
    FileText,
    History,
    RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
    useEquipmentsList, 
    useEquipmentTechnicians, 
    useEquipmentFull,
    useCreateEquipment, 
    useUpdateEquipment, 
    useDeleteEquipment 
} from "@/api/equipments";
import type { Equipment } from "@/types/equipment";

export function EquipmentCatalogTab() {
    const { user } = useAuth();
    
    // Check if user has ROLE_SUPER_ADMIN to allow modifications
    const isSuperAdmin = user?.identityRoles?.some(r => ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "admin", "superAdmin"].includes(r)) || false;

    const [search, setSearch] = useState("");
    const [page] = useState(1);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");

    // Form state
    const [formData, setFormData] = useState<Partial<Equipment>>({
        equipmentName: "",
        stt: "",
        equipmentSpecification: "",
        equipmentManufactuer: "",
        receivedDate: "",
        operatingDate: "",
        inspectionFrequency: "",
        calibrationFrequency: "",
        nextCalibrationDate: "",
        calibrationCertificateNumber: "",
        calibrationParameters: "",
        department: "",
        usageLogBook: "",
        equipmentBackground: "",
        evaluationReport: "",
        purposeChangeAfterCalibration: "",
        status: "",
        equipmentModel: "",
        identityChargeIds: [],
        equipmentDocumentIds: []
    });

    // Queries
    const { data: equipmentsRes, isLoading: isListLoading, refetch } = useEquipmentsList({
        page,
        itemsPerPage: 50,
        search: search || undefined
    });

    const { data: technicians, isLoading: isTechLoading } = useEquipmentTechnicians();
    const { data: fullDetails, isLoading: isDetailLoading } = useEquipmentFull(selectedEquipmentId);

    const equipments = useMemo(() => equipmentsRes?.data ?? [], [equipmentsRes?.data]);

    // Mutations
    const createMutation = useCreateEquipment();
    const updateMutation = useUpdateEquipment();
    const deleteMutation = useDeleteEquipment();

    const formatDateForInput = (dateStr?: string | null) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "";
            return d.toISOString().slice(0, 10);
        } catch {
            return "";
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            equipmentName: "",
            stt: "",
            equipmentSpecification: "",
            equipmentManufactuer: "",
            receivedDate: "",
            operatingDate: "",
            inspectionFrequency: "",
            calibrationFrequency: "",
            nextCalibrationDate: "",
            calibrationCertificateNumber: "",
            calibrationParameters: "",
            department: "",
            usageLogBook: "",
            equipmentBackground: "",
            evaluationReport: "",
            purposeChangeAfterCalibration: "",
            status: "",
            equipmentModel: "",
            identityChargeIds: [],
            equipmentDocumentIds: []
        });
        setSelectedEquipmentId(null);
        setModalMode("create");
        setModalOpen(true);
    };

    const handleOpenEdit = (eq: Equipment) => {
        setSelectedEquipmentId(eq.equipmentId);
        setFormData({
            equipmentId: eq.equipmentId,
            stt: eq.stt ?? "",
            equipmentName: eq.equipmentName,
            equipmentSpecification: eq.equipmentSpecification ?? "",
            equipmentManufactuer: eq.equipmentManufactuer ?? "",
            receivedDate: formatDateForInput(eq.receivedDate),
            operatingDate: formatDateForInput(eq.operatingDate),
            inspectionFrequency: eq.inspectionFrequency ?? "",
            calibrationFrequency: eq.calibrationFrequency ?? "",
            nextCalibrationDate: formatDateForInput(eq.nextCalibrationDate),
            calibrationCertificateNumber: eq.calibrationCertificateNumber ?? "",
            calibrationParameters: eq.calibrationParameters ?? "",
            department: eq.department ?? "",
            usageLogBook: eq.usageLogBook ?? "",
            equipmentBackground: eq.equipmentBackground ?? "",
            evaluationReport: eq.evaluationReport ?? "",
            purposeChangeAfterCalibration: eq.purposeChangeAfterCalibration ?? "",
            status: eq.status ?? "",
            equipmentModel: eq.equipmentModel ?? "",
            identityChargeIds: eq.identityChargeIds ?? [],
            equipmentDocumentIds: eq.equipmentDocumentIds ?? []
        });
        setModalMode("edit");
        setModalOpen(true);
    };

    const handleOpenView = (eq: Equipment) => {
        setSelectedEquipmentId(eq.equipmentId);
        setFormData({
            equipmentId: eq.equipmentId,
            stt: eq.stt ?? "",
            equipmentName: eq.equipmentName,
            equipmentSpecification: eq.equipmentSpecification ?? "",
            equipmentManufactuer: eq.equipmentManufactuer ?? "",
            receivedDate: formatDateForInput(eq.receivedDate),
            operatingDate: formatDateForInput(eq.operatingDate),
            inspectionFrequency: eq.inspectionFrequency ?? "",
            calibrationFrequency: eq.calibrationFrequency ?? "",
            nextCalibrationDate: formatDateForInput(eq.nextCalibrationDate),
            calibrationCertificateNumber: eq.calibrationCertificateNumber ?? "",
            calibrationParameters: eq.calibrationParameters ?? "",
            department: eq.department ?? "",
            usageLogBook: eq.usageLogBook ?? "",
            equipmentBackground: eq.equipmentBackground ?? "",
            evaluationReport: eq.evaluationReport ?? "",
            purposeChangeAfterCalibration: eq.purposeChangeAfterCalibration ?? "",
            status: eq.status ?? "",
            equipmentModel: eq.equipmentModel ?? "",
            identityChargeIds: eq.identityChargeIds ?? [],
            equipmentDocumentIds: eq.equipmentDocumentIds ?? []
        });
        setModalMode("view");
        setModalOpen(true);
    };

    const handleDelete = async (eqId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thiết bị này? Hành động này sẽ thực hiện soft delete.")) return;
        
        try {
            await deleteMutation.mutateAsync(eqId);
            toast.success("Đã xóa thiết bị thành công.");
        } catch (e: any) {
            toast.error(e.message || "Lỗi xóa thiết bị.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.equipmentName) {
            toast.error("Vui lòng nhập tên thiết bị.");
            return;
        }

        const payload = {
            ...formData,
            receivedDate: formData.receivedDate ? new Date(formData.receivedDate).toISOString() : null,
            operatingDate: formData.operatingDate ? new Date(formData.operatingDate).toISOString() : null,
            nextCalibrationDate: formData.nextCalibrationDate ? new Date(formData.nextCalibrationDate).toISOString() : null
        };

        try {
            if (modalMode === "create") {
                await createMutation.mutateAsync(payload);
                toast.success("Khai báo thiết bị mới thành công.");
            } else {
                await updateMutation.mutateAsync(payload);
                toast.success("Cập nhật thiết bị thành công.");
            }
            setModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Lỗi lưu thông tin thiết bị.");
        }
    };

    // Helper to map Technician names
    const getTechNames = (ids?: string[] | null) => {
        if (!ids || ids.length === 0 || !technicians) return "-";
        return ids
            .map(id => technicians.find(t => t.identityId === id)?.identityName)
            .filter(Boolean)
            .join(", ") || "-";
    };

    return (
        <div className="flex flex-col gap-4 bg-background">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên, hãng, model..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-9 bg-background shadow-xs text-xs"
                    />
                </div>
                
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-background">
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Làm mới
                    </Button>
                    {isSuperAdmin && (
                        <Button size="sm" onClick={handleOpenCreate}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            Khai báo thiết bị
                        </Button>
                    )}
                </div>
            </div>

            <div className="border border-border/60 bg-card rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-32">Mã thiết bị</TableHead>
                            <TableHead className="w-64">Tên thiết bị</TableHead>
                            <TableHead className="w-40">Hãng sản xuất</TableHead>
                            <TableHead className="w-40">Model / Dòng</TableHead>

                            <TableHead className="w-48">Người phụ trách</TableHead>
                            <TableHead className="w-44">Hiệu chuẩn tiếp theo</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isListLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : equipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground text-xs">
                                    Chưa có thiết bị nào được khai báo.
                                </TableCell>
                            </TableRow>
                        ) : (
                            equipments.map((eq: Equipment) => (
                                <TableRow key={eq.equipmentId} className="cursor-pointer hover:bg-muted/10" onClick={() => handleOpenView(eq)}>
                                    <TableCell className="font-mono text-xs font-semibold text-primary">{eq.equipmentId}</TableCell>
                                    <TableCell className="font-medium text-xs text-foreground">{eq.equipmentName}</TableCell>
                                    <TableCell className="text-xs">{eq.equipmentManufactuer ?? "-"}</TableCell>
                                    <TableCell className="text-xs">{eq.equipmentModel ?? "-"}</TableCell>
                                    <TableCell className="text-xs max-w-xs truncate">{getTechNames(eq.identityChargeIds)}</TableCell>
                                    <TableCell className="text-xs">
                                        {eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate).toLocaleDateString("vi-VN") : "-"}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1.5">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleOpenEdit(eq)}
                                                title="Sửa thông tin"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            {isSuperAdmin && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(eq.equipmentId)}
                                                    title="Xóa thiết bị"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View/Edit/Create Modal - width 80% and height 80% */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="!max-w-[80vw] !w-[80vw] h-[80vh] min-h-[80vh] flex flex-col p-0 overflow-hidden bg-background border border-border shadow-2xl">
                    <DialogHeader className="p-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                            <Settings className="w-4 h-4 text-primary" />
                            {modalMode === "create" ? "Khai báo thiết bị mới" : modalMode === "edit" ? `Chỉnh sửa thiết bị: ${formData.equipmentName}` : `Chi tiết thiết bị: ${formData.equipmentName}`}
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <div className="px-6 border-b border-border bg-card shrink-0">
                            <TabsList className="bg-transparent border-b-0 h-11 p-0 flex gap-2">
                                <TabsTrigger value="info" className="h-11 border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2 font-semibold text-xs gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    Thông tin chung
                                </TabsTrigger>
                                {modalMode !== "create" && (
                                    <TabsTrigger value="logs" className="h-11 border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2 font-semibold text-xs gap-1.5">
                                        <History className="w-3.5 h-3.5" />
                                        Nhật ký hoạt động
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-background">
                            <TabsContent value="info" className="m-0 h-full flex flex-col justify-between">
                                <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Column 1: Basic Info & Specs */}
                                        <div className="space-y-4">
                                            <div className="bg-muted/10 p-4 rounded-lg border border-border/50 space-y-4">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/80 pb-2">Thông tin chung</h4>
                                                
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="stt" className="text-[11px] font-semibold">STT</Label>
                                                        <Input
                                                            id="stt"
                                                            disabled={modalMode === "view"}
                                                            value={formData.stt ?? ""}
                                                            onChange={e => setFormData({ ...formData, stt: e.target.value })}
                                                            placeholder="STT"
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-1">
                                                        <Label htmlFor="status" className="text-[11px] font-semibold">Tình trạng</Label>
                                                        <Input
                                                            id="status"
                                                            disabled={modalMode === "view"}
                                                            value={formData.status ?? ""}
                                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                            placeholder="Tình trạng thiết bị..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <Label htmlFor="equipmentName" className="text-[11px] font-semibold">Tên thiết bị <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        id="equipmentName"
                                                        disabled={modalMode === "view"}
                                                        value={formData.equipmentName ?? ""}
                                                        onChange={e => setFormData({ ...formData, equipmentName: e.target.value })}
                                                        placeholder="Nhập tên thiết bị..."
                                                        className="h-8 bg-background text-xs"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="equipmentManufactuer" className="text-[11px] font-semibold">Hãng sản xuất</Label>
                                                        <Input
                                                            id="equipmentManufactuer"
                                                            disabled={modalMode === "view"}
                                                            value={formData.equipmentManufactuer ?? ""}
                                                            onChange={e => setFormData({ ...formData, equipmentManufactuer: e.target.value })}
                                                            placeholder="Nhập hãng sản xuất..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="equipmentModel" className="text-[11px] font-semibold">Model / Dòng máy</Label>
                                                        <Input
                                                            id="equipmentModel"
                                                            disabled={modalMode === "view"}
                                                            value={formData.equipmentModel ?? ""}
                                                            onChange={e => setFormData({ ...formData, equipmentModel: e.target.value })}
                                                            placeholder="Nhập model..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="department" className="text-[11px] font-semibold">Bộ phận sử dụng</Label>
                                                        <Input
                                                            id="department"
                                                            disabled={modalMode === "view"}
                                                            value={formData.department ?? ""}
                                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                            placeholder="Phòng ban..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="usageLogBook" className="text-[11px] font-semibold">Tên sổ theo dõi</Label>
                                                        <Input
                                                            id="usageLogBook"
                                                            disabled={modalMode === "view"}
                                                            value={formData.usageLogBook ?? ""}
                                                            onChange={e => setFormData({ ...formData, usageLogBook: e.target.value })}
                                                            placeholder="Sổ theo dõi..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-muted/10 p-4 rounded-lg border border-border/50 space-y-4">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/80 pb-2">Thông số & Lý lịch</h4>
                                                
                                                <div className="space-y-1">
                                                    <Label htmlFor="equipmentSpecification" className="text-[11px] font-semibold">Thông số kỹ thuật</Label>
                                                    <Textarea
                                                        id="equipmentSpecification"
                                                        disabled={modalMode === "view"}
                                                        value={formData.equipmentSpecification ?? ""}
                                                        onChange={e => setFormData({ ...formData, equipmentSpecification: e.target.value })}
                                                        placeholder="Thông số kỹ thuật chi tiết..."
                                                        className="min-h-16 text-xs bg-background"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="equipmentBackground" className="text-[11px] font-semibold">Lý lịch thiết bị</Label>
                                                        <Input
                                                            id="equipmentBackground"
                                                            disabled={modalMode === "view"}
                                                            value={formData.equipmentBackground ?? ""}
                                                            onChange={e => setFormData({ ...formData, equipmentBackground: e.target.value })}
                                                            placeholder="Lý lịch..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="evaluationReport" className="text-[11px] font-semibold">Biên bản thẩm định</Label>
                                                        <Input
                                                            id="evaluationReport"
                                                            disabled={modalMode === "view"}
                                                            value={formData.evaluationReport ?? ""}
                                                            onChange={e => setFormData({ ...formData, evaluationReport: e.target.value })}
                                                            placeholder="Biên bản..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2: Operation, Calibration & Staffs */}
                                        <div className="space-y-4">
                                            <div className="bg-muted/10 p-4 rounded-lg border border-border/50 space-y-4">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/80 pb-2">Vận hành & Hiệu chuẩn</h4>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="receivedDate" className="text-[11px] font-semibold">Ngày nhận</Label>
                                                        <Input
                                                            id="receivedDate"
                                                            type="date"
                                                            disabled={modalMode === "view"}
                                                            value={formData.receivedDate ?? ""}
                                                            onChange={e => setFormData({ ...formData, receivedDate: e.target.value })}
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="operatingDate" className="text-[11px] font-semibold">Ngày đưa vào vận hành</Label>
                                                        <Input
                                                            id="operatingDate"
                                                            type="date"
                                                            disabled={modalMode === "view"}
                                                            value={formData.operatingDate ?? ""}
                                                            onChange={e => setFormData({ ...formData, operatingDate: e.target.value })}
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="inspectionFrequency" className="text-[11px] font-semibold">Tần suất kiểm định</Label>
                                                        <Input
                                                            id="inspectionFrequency"
                                                            disabled={modalMode === "view"}
                                                            value={formData.inspectionFrequency ?? ""}
                                                            onChange={e => setFormData({ ...formData, inspectionFrequency: e.target.value })}
                                                            placeholder="Tần suất..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="calibrationFrequency" className="text-[11px] font-semibold">Tần suất hiệu chuẩn</Label>
                                                        <Input
                                                            id="calibrationFrequency"
                                                            disabled={modalMode === "view"}
                                                            value={formData.calibrationFrequency ?? ""}
                                                            onChange={e => setFormData({ ...formData, calibrationFrequency: e.target.value })}
                                                            placeholder="Tần suất..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="nextCalibrationDate" className="text-[11px] font-semibold">Ngày hiệu chuẩn tiếp theo</Label>
                                                        <Input
                                                            id="nextCalibrationDate"
                                                            type="date"
                                                            disabled={modalMode === "view"}
                                                            value={formData.nextCalibrationDate ?? ""}
                                                            onChange={e => setFormData({ ...formData, nextCalibrationDate: e.target.value })}
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="calibrationCertificateNumber" className="text-[11px] font-semibold">Số chứng nhận hiệu chuẩn</Label>
                                                        <Input
                                                            id="calibrationCertificateNumber"
                                                            disabled={modalMode === "view"}
                                                            value={formData.calibrationCertificateNumber ?? ""}
                                                            onChange={e => setFormData({ ...formData, calibrationCertificateNumber: e.target.value })}
                                                            placeholder="Số chứng nhận..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="calibrationParameters" className="text-[11px] font-semibold">Chỉ tiêu hiệu chuẩn</Label>
                                                        <Input
                                                            id="calibrationParameters"
                                                            disabled={modalMode === "view"}
                                                            value={formData.calibrationParameters ?? ""}
                                                            onChange={e => setFormData({ ...formData, calibrationParameters: e.target.value })}
                                                            placeholder="Chỉ tiêu..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="purposeChangeAfterCalibration" className="text-[11px] font-semibold">Thay đổi mục đích sau hiệu chuẩn</Label>
                                                        <Input
                                                            id="purposeChangeAfterCalibration"
                                                            disabled={modalMode === "view"}
                                                            value={formData.purposeChangeAfterCalibration ?? ""}
                                                            onChange={e => setFormData({ ...formData, purposeChangeAfterCalibration: e.target.value })}
                                                            placeholder="Thay đổi mục đích..."
                                                            className="h-8 bg-background text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-muted/10 p-4 rounded-lg border border-border/50 flex flex-col space-y-3">
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/80 pb-1.5">Nhân sự phụ trách vận hành</h4>
                                                
                                                {isTechLoading ? (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border border-border rounded bg-muted/10 justify-center h-28">
                                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                        Đang tải danh sách nhân sự...
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 overflow-y-auto border border-border p-3 rounded bg-muted/10 h-28 space-y-2">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {technicians?.map(tech => {
                                                                const isChecked = formData.identityChargeIds?.includes(tech.identityId) ?? false;
                                                                return (
                                                                    <label 
                                                                        key={tech.identityId} 
                                                                        className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer select-none transition-all ${
                                                                            isChecked 
                                                                                ? "bg-primary/5 border-primary/30" 
                                                                                : "border-border/60 hover:bg-card bg-background"
                                                                        }`}
                                                                    >
                                                                        <Checkbox
                                                                            disabled={modalMode === "view"}
                                                                            checked={isChecked}
                                                                            onCheckedChange={(checked) => {
                                                                                const current = formData.identityChargeIds || [];
                                                                                const next = checked 
                                                                                    ? [...current, tech.identityId]
                                                                                    : current.filter(id => id !== tech.identityId);
                                                                                setFormData({ ...formData, identityChargeIds: next });
                                                                            }}
                                                                        />
                                                                        <span className="text-xs font-medium truncate">{tech.identityName}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons footer inside form */}
                                    {modalMode !== "view" && (
                                        <div className="flex justify-end gap-3 mt-6 border-t border-border pt-4 shrink-0">
                                            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                                                Hủy
                                            </Button>
                                            <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                                {(createMutation.isPending || updateMutation.isPending) && (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                )}
                                                Lưu thay đổi
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </TabsContent>

                            <TabsContent value="logs" className="m-0 h-full flex flex-col min-h-0">
                                {isDetailLoading ? (
                                    <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        Đang tải dữ liệu nhật ký...
                                    </div>
                                ) : !fullDetails?.logs || fullDetails.logs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center p-12 text-muted-foreground border border-dashed border-border rounded-xl">
                                        <Wrench className="w-8 h-8 opacity-30 mb-2" />
                                        <p className="text-xs">Không tìm thấy nhật ký vận hành cho thiết bị này.</p>
                                    </div>
                                ) : (
                                    <div className="border border-border bg-card rounded-lg overflow-hidden flex-1 overflow-y-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="w-32">Ngày & Giờ</TableHead>
                                                    <TableHead className="w-32">Hoạt động</TableHead>
                                                    <TableHead className="w-44">Vị trí</TableHead>
                                                    <TableHead>Nội dung chi tiết</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {fullDetails.logs.map(log => (
                                                    <TableRow key={log.equipmentLogId} className="text-xs">
                                                        <TableCell className="font-mono text-muted-foreground text-[11px]">
                                                            {log.actionTime ? new Date(log.actionTime).toLocaleString("vi-VN") : "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                log.equipmentLogType === "Calibration" 
                                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                                                    : log.equipmentLogType === "Maintenance"
                                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                                                        : log.equipmentLogType === "Incident"
                                                                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                            }`}>
                                                                {log.equipmentLogType === "Calibration" ? "Hiệu chuẩn" : log.equipmentLogType === "Maintenance" ? "Bảo trì" : log.equipmentLogType === "Incident" ? "Sự cố" : "Sử dụng"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{log.equipmentLogLocation ?? "-"}</TableCell>
                                                        <TableCell className="break-words font-medium text-foreground">{log.equipmentLogDescription ?? "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
}
