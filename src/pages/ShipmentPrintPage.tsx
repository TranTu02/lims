import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useShipmentFull } from "@/api/shipments";
import ShipmentLabelPrint from "@/components/reception/shipment/ShipmentLabelPrint";
import { Loader2 } from "lucide-react";

export function ShipmentPrintPage() {
    const { shipmentId } = useParams();
    const [searchParams] = useSearchParams();
    const copies = parseInt(searchParams.get("copies") || "1", 10);
    
    const { data: shipment, isLoading, isError } = useShipmentFull(shipmentId || "", { enabled: !!shipmentId });

    useEffect(() => {
        if (shipment && !isLoading) {
            // Wait for SVG/Components to render
            const timer = setTimeout(() => {
                window.print();
                // Optionally close tab after print? (Common but can be annoying)
                // window.close(); 
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [shipment, isLoading]);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-medium">Đang chuẩn bị tem in...</p>
            </div>
        );
    }

    if (isError || !shipment) {
        return (
            <div className="h-screen w-full flex items-center justify-center text-red-500 font-bold">
                Lỗi: Không tìm thấy thông tin vận đơn ({shipmentId})
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen flex flex-col items-center py-4">
            {/* Render the label multiple times based on copies */}
            {Array.from({ length: copies }).map((_, i) => (
                <div key={`${shipmentId}-${i}`} className="mb-4">
                    <ShipmentLabelPrint shipment={shipment as any} />
                </div>
            ))}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; }
                    .print-label-container { page-break-after: always; }
                }
            `}} />
        </div>
    );
}
