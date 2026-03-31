import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useReceiptFull } from "@/api/receipts";
import { useShipmentFull } from "@/api/shipments";
import { Loader2, X as XIcon, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShipmentContextView from "./ShipmentContextView";
import ShipmentActionForm from "./ShipmentActionForm";
import ShipmentLabelPrint, { SHIPMENT_PRINT_CSS } from "./ShipmentLabelPrint";
import type { ReceiptDetail } from "@/types/receipt";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receiptId: string;
}

export default function ShipmentManagerModal({ open, onOpenChange, receiptId }: Props) {
    const { t } = useTranslation();
    const { data: receipt, isLoading, refetch, isFetching } = useReceiptFull({ receiptId }, { enabled: open && !!receiptId }) as { data: ReceiptDetail | undefined; isLoading: boolean; refetch: () => void; isFetching: boolean };
    
    const [printShipmentId, setPrintShipmentId] = useState<string | null>(null);
    const { data: shipmentData, isLoading: isPrintLoading } = useShipmentFull(printShipmentId || "", { enabled: !!printShipmentId });
    const [copies, setCopies] = useState<number>(1);
    
    const printRef = useRef<HTMLDivElement>(null);

    // Open in new tab and inject HTML directly (identical to SamplePrintLabelModal)
    const handleFinalPrint = useCallback(() => {
        if (!printShipmentId || !printRef.current) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const content = printRef.current.innerHTML;

        printWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"/>
    <title>In vận đơn — ${printShipmentId}</title>
    <style>${SHIPMENT_PRINT_CSS}</style>
</head>
<body onload="setTimeout(function() { window.print(); window.close(); }, 500);">
<div class="print-body">
${content}
</div>
</body>
</html>`);
        printWindow.document.close();
    }, [printShipmentId]);

    const handlePrint = (shipmentId: string) => {
        setPrintShipmentId(shipmentId);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setPrintShipmentId(null);
            onOpenChange(val);
        }}>
            <DialogContent className="max-w-none sm:max-w-none !w-[95vw] !h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-none shadow-2xl rounded-xl [&>button]:z-[70]">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b flex-none bg-accent/30 shadow-sm z-10 relative">
                    <DialogTitle className="text-xl flex items-center gap-3 font-bold text-primary">
                        {t("shipments.title", "Hồ sơ Giao nhận & Vận đơn")}
                        {isPrintLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-auto"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            title="Làm mới"
                        >
                            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                        </Button>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {t("shipments.subtitle", "Quản lý dữ liệu logisics của mã hồ sơ:")} {receipt ? <span className="font-bold underline text-primary">{String(receipt.receiptCode ?? "")}</span> : ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* The Print Overlay layer - PREVIEW ONLY */}
                    {printShipmentId && shipmentData && (
                        <>
                            <div className="absolute inset-0 z-[60] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8 overflow-y-auto animate-in fade-in zoom-in duration-200">
                                <div className="flex flex-col items-center gap-6 py-10 w-full max-w-2xl">
                                    <div className="text-center space-y-2 mb-2">
                                        <h3 className="text-2xl font-black text-primary uppercase">Xem trước tem in</h3>
                                        <p className="text-muted-foreground text-sm font-medium">Bạn cần in bao nhiêu liên cho vận đơn này?</p>
                                    </div>

                                    {/* Choice Circle boxes */}
                                    <div className="flex items-center gap-8">
                                        {[1, 2].map((num) => (
                                            <button 
                                                key={num}
                                                onClick={() => setCopies(num)}
                                                className={`
                                                    w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 relative
                                                    ${copies === num 
                                                        ? "border-primary bg-primary/10 scale-110 shadow-xl shadow-primary/20" 
                                                        : "border-muted-foreground/30 bg-transparent opacity-60 hover:opacity-100 hover:border-primary/50"}
                                                `}
                                            >
                                                <div className="text-2xl font-black">{num}</div>
                                                <div className="text-[10px] font-extrabold uppercase tracking-tighter opacity-80">Liên</div>
                                                {copies === num && (
                                                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-white p-4 rounded-xl shadow-2xl border border-primary/20 scale-[0.8] ring-4 ring-primary/5">
                                        <ShipmentLabelPrint shipment={shipmentData as any} />
                                    </div>
                                    
                                    <div className="flex items-center gap-4 w-full justify-center mt-2">
                                        <Button 
                                            variant="default" 
                                            size="lg" 
                                            className="gap-3 shadow-xl px-12 h-14 text-lg font-black bg-primary hover:bg-primary/90 rounded-full transition-all hover:scale-105 active:scale-95" 
                                            onClick={handleFinalPrint}
                                        >
                                            <Printer className="w-6 h-6" /> Thực hiện in ngay
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="lg" 
                                            className="gap-2 h-14 px-8 rounded-full font-bold hover:bg-destructive/10 hover:text-destructive" 
                                            onClick={() => setPrintShipmentId(null)}
                                        >
                                            <XIcon className="w-5 h-5" /> Hủy bỏ
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Hidden container to capture HTML for printing */}
                            <div className="hidden">
                                <div ref={printRef}>
                                    {Array.from({ length: copies }).map((_, i) => (
                                        <ShipmentLabelPrint key={`print-${i}`} shipment={shipmentData as any} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex-1 flex flex-col overflow-hidden">
                        {isLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                                <p className="text-sm">Đang tải hồ sơ Phiếu Nhận Mẫu...</p>
                            </div>
                        ) : receipt ? (
                            <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden">
                                {/* Left Panel: Context 60% */}
                                <div className="flex-[6] border-r overflow-y-auto bg-card hidden md:block">
                                    <ShipmentContextView receipt={receipt} />
                                </div>

                                {/* Right Panel: Action 40% */}
                                <div className="flex-[4] overflow-y-auto p-6 bg-background relative selection:bg-primary/20">
                                    <ShipmentActionForm 
                                        receipt={receipt} 
                                        onSuccess={() => {
                                            onOpenChange(false);
                                        }} 
                                        onPrintLabel={handlePrint}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-accent/20">
                                Không tìm thấy dữ liệu hoặc lỗi truy xuất hồ sơ
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

ShipmentManagerModal.displayName = "ShipmentManagerModal";
