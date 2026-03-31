import { forwardRef, useEffect, useState } from "react";
import Barcode from "react-barcode";
import QRCode from "qrcode";
import { format } from "date-fns";
import type { ShipmentDetail } from "@/types/shipment";

interface Props {
    shipment: ShipmentDetail;
}

export const SHIPMENT_PRINT_CSS = `
    @page {
        size: 100mm 100mm;
        margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: white;
    }
    .print-label-container {
        width: 100mm;
        height: 100mm;
        padding: 1mm;
        box-sizing: border-box;
        background: white;
        overflow: hidden;
        page-break-after: always;
    }
    .print-label-container:last-child {
        page-break-after: avoid;
    }
`;

const ShipmentLabelPrint = forwardRef<HTMLDivElement, Props>(({ shipment }, ref) => {
    const [qrSvg, setQrSvg] = useState<string>("");
    
    const trackingNo = shipment?.shipmentTrackingNumber || shipment?.shipmentId || "N/A";
    const shipmentId = shipment?.shipmentId || "N/A";

    // Generate QR Code SVG
    useEffect(() => {
        QRCode.toString(shipmentId, { 
            type: 'svg', 
            margin: 0, 
            width: 80,
            color: { dark: "#000000", light: "#ffffff" }
        }, (err, string) => {
            if (!err) setQrSvg(string);
        });
    }, [shipmentId]);

    const sender = typeof shipment?.shipmentSender === 'string' 
        ? JSON.parse(shipment.shipmentSender) 
        : (shipment?.shipmentSender || {});
        
    const receiver = typeof shipment?.shipmentReceiver === 'string' 
        ? JSON.parse(shipment.shipmentReceiver) 
        : (shipment?.shipmentReceiver || {});
        
    const product = typeof shipment?.shipmentProduct === 'string' 
        ? JSON.parse(shipment.shipmentProduct) 
        : (shipment?.shipmentProduct || {});
        
    const order = typeof shipment?.shipmentOrder === 'string' 
        ? JSON.parse(shipment.shipmentOrder) 
        : (shipment?.shipmentOrder || {});

    const formatAddress = (addr: any) => {
        if (!addr) return "";
        if (typeof addr === "string") return addr;
        if (addr && typeof addr === "object") {
            const parts = [
                addr.address,
                addr.wardName,
                addr.districtName,
                addr.provinceName
            ].filter(Boolean);
            return parts.join(", ");
        }
        return "";
    };

    return (
        <div 
            ref={ref} 
            className="print-label-container" 
            style={{ 
                width: '100mm', 
                height: '100mm', 
                padding: '1mm', 
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: 'black'
            }}
        >
            <div style={{ width: "100%", height: "100%", border: "2pt solid black", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                
                {/* 1. Header Row - Carrier & QR */}
                <div style={{ display: "flex", borderBottom: "1.5pt solid black", height: "20mm", boxSizing: "border-box", overflow: "hidden" }}>
                    <div style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box" }}>
                        <div style={{ fontWeight: 900, fontSize: "16pt", textTransform: "uppercase", lineHeight: 1 }}>
                            {shipment.shipmentCarrier || "VIETTEL POST"}
                        </div>
                        <div style={{ fontSize: "8pt", fontWeight: 700, marginTop: "4px", opacity: 0.8 }}>
                            LIMS SHIPMENT | {format(new Date(), "dd/MM/yyyy HH:mm")}
                        </div>
                    </div>
                    <div style={{ width: "20mm", borderLeft: "1.5pt solid black", display: "flex", alignItems: "center", justifyContent: "center", padding: "2px", boxSizing: "border-box" }}>
                        {qrSvg && (
                            <div 
                                style={{ width: "18mm", height: "18mm", display: "flex", alignItems: "center", justifyContent: "center" }}
                                dangerouslySetInnerHTML={{ __html: qrSvg }} 
                            />
                        )}
                    </div>
                </div>

                {/* 2. Barcode Row */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderBottom: "1.5pt solid black", height: "25mm", padding: "5px", boxSizing: "border-box" }}>
                    <Barcode 
                        value={trackingNo} 
                        width={2.2} 
                        height={50} 
                        fontSize={14} 
                        margin={0} 
                        displayValue={true} 
                        renderer="svg"
                        fontOptions="bold"
                    />
                </div>

                {/* 3. Info Grid - Sender & Receiver */}
                <div style={{ height: "30mm", borderBottom: "1.5pt solid black", display: "flex", boxSizing: "border-box", overflow: "hidden" }}>
                    <div style={{ width: "38%", borderRight: "1.2pt solid black", padding: "6px", display: "flex", flexDirection: "column", boxSizing: "border-box", height: "100%" }}>
                        <div style={{ fontSize: "7pt", fontWeight: 900, textTransform: "uppercase", marginBottom: "4px" }}>Người gửi (Sender)</div>
                        <div style={{ fontSize: "8.5pt", fontWeight: 900, lineHeight: 1.2 }}>{sender.senderName || sender.name || "IRDOP"}</div>
                        <div style={{ fontSize: "8.5pt", fontWeight: 900, lineHeight: 1.2, marginTop: "2px" }}>{sender.senderPhone || sender.phone || ""}</div>
                        <div style={{ fontSize: "7pt", fontWeight: 700, lineHeight: 1.1, marginTop: "2px", wordBreak: "break-word" }}>
                            {formatAddress(sender.senderAddress || sender.address)}
                        </div>
                    </div>
                    <div style={{ flex: 1, padding: "6px", display: "flex", flexDirection: "column", boxSizing: "border-box", height: "100%" }}>
                        <div style={{ fontSize: "7pt", fontWeight: 900, textTransform: "uppercase", marginBottom: "4px" }}>Người nhận (Receiver)</div>
                        <div style={{ fontSize: "11pt", fontWeight: 900, textTransform: "uppercase", lineHeight: 1.1 }}>
                            {receiver.receiverName || receiver.name || "Phòng Thí Nghiệm"}
                        </div>
                        <div style={{ fontSize: "10pt", fontWeight: 900, lineHeight: 1.2, marginTop: "2px" }}>
                            {receiver.receiverPhone || receiver.phone || ""}
                        </div>
                        <div style={{ fontSize: "8.5pt", fontWeight: 900, textTransform: "uppercase", lineHeight: 1.1, marginTop: "2px", wordBreak: "break-word" }}>
                            {formatAddress(receiver.receiverAddress || receiver.address)}
                        </div>
                    </div>
                </div>

                {/* 4. Details Footer */}
                <div style={{ flex: 1, display: "flex", boxSizing: "border-box", overflow: "hidden" }}>
                    <div style={{ flex: 1, borderRight: "1.2pt solid black", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box" }}>
                        <div style={{ fontSize: "7pt", fontWeight: 900, textTransform: "uppercase", marginBottom: "4px" }}>Nội dung:</div>
                        <div style={{ fontSize: "10pt", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", lineHeight: 1.2 }}>
                            {product.name || "Hồ sơ / Mẫu thử nghiệm"}
                        </div>
                    </div>
                    <div style={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6px", textAlign: "center", boxSizing: "border-box" }}>
                        <div style={{ fontSize: "7pt", fontWeight: 900, textTransform: "uppercase", opacity: 0.6, marginBottom: "4px" }}>Ghi chú</div>
                        <div style={{ fontSize: "10pt", fontWeight: 900, textTransform: "uppercase", lineHeight: 1 }}>
                            {order.note || shipment.shipmentStatus || "DELIVERED"}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
});

ShipmentLabelPrint.displayName = "ShipmentLabelPrint";

export default ShipmentLabelPrint;
