import { useEffect } from "react";
// import { useTranslation } from "react-i18next"; // Removed unused import
import { PackageSearch, Clock, ChevronRight, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress"; // Removed unused Progress
import { useProcessingSamples } from "../../hooks/useProcessingSamples";

export function ProcessingSamplesTab() {
    const { loading, samples, fetchSamples } = useProcessingSamples();

    useEffect(() => {
        fetchSamples();
    }, [fetchSamples]);

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border-x border-b border-border shadow-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-muted/10">
                <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <PackageSearch className="h-5 w-5 text-blue-500" />
                        Tiến độ mẫu đang thực hiện
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Giám sát quá trình phân tích và kiểm nghiệm cho từng mẫu cụ thể</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="px-2 py-0.5 rounded-full font-bold">
                            Tổng số: {samples.length} mẫu
                        </Badge>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-5 py-4 font-medium border-b border-border w-[15%]">Mã Phiếu / Mẫu</th>
                            <th className="px-5 py-4 font-medium border-b border-border w-[25%]">Thông tin mẫu & Khách hàng</th>
                            <th className="px-5 py-4 font-medium border-b border-border w-[20%]">Thời gian</th>
                            <th className="px-5 py-4 font-medium border-b border-border w-[25%]">Mức độ hoàn thành</th>
                            <th className="px-5 py-4 font-medium border-b border-border  w-[15%]">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {samples.map((item) => {
                            const percent = item.totalAnalyses > 0 ? Math.round((item.completedAnalyses / item.totalAnalyses) * 100) : 0;
                            const isLate = new Date(item.deadline) < new Date();
                            const isNearDeadline = !isLate && (new Date(item.deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000); // < 24h

                            return (
                                <tr key={item.sampleId} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-semibold text-foreground text-sm">{item.receiptId}</div>
                                        <div className="text-muted-foreground mt-1 text-xs font-mono bg-muted inline-flex px-1.5 py-0.5 rounded">{item.sampleId}</div>
                                        {item.status === 'Approving' && (
                                            <div className="mt-2">
                                                <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-[10px]">Đang duyệt chốt</Badge>
                                            </div>
                                        )}
                                        {item.status === 'Pending' && (
                                            <div className="mt-2">
                                                <Badge variant="outline" className="text-[10px] text-muted-foreground">Chưa bắt đầu</Badge>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-medium text-primary text-sm line-clamp-1" title={item.sampleName}>{item.sampleName}</div>
                                        <div className="text-muted-foreground mt-1 text-xs line-clamp-2" title={item.customerName}>{item.customerName}</div>
                                        
                                        {item.notes && (
                                            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-1.5 rounded-md border border-amber-100">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <span className="leading-snug">{item.notes}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 align-top">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5 opacity-70" />
                                                <span>Nhận: {new Date(item.receivedAt).toLocaleDateString("vi-VN")}</span>
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs font-medium ${isLate ? 'text-destructive' : isNearDeadline ? 'text-orange-600' : 'text-foreground'}`}>
                                                <Clock className={`h-3.5 w-3.5 ${isLate ? 'text-destructive' : isNearDeadline ? 'text-orange-500' : 'opacity-70'}`} />
                                                <span>Trả: {new Date(item.deadline).toLocaleDateString("vi-VN")} {new Date(item.deadline).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            {isLate ? (
                                                <Badge variant="destructive" className="mt-1 text-[10px]">Trễ hẹn trả</Badge>
                                            ) : isNearDeadline ? (
                                                <Badge variant="outline" className="mt-1 text-[10px] border-orange-200 text-orange-700 bg-orange-50">Sắp đến hạn ({'>'} 24h)</Badge>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 align-middle">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-end text-xs">
                                                <span className="font-medium text-foreground">{percent}%</span>
                                                <span className="text-muted-foreground font-medium">{item.completedAnalyses} / {item.totalAnalyses} <span className="font-normal opacity-70">chỉ tiêu</span></span>
                                            </div>
                                            <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                                                <div 
                                                    className={`absolute top-0 left-0 h-full transition-all duration-500 ease-in-out ${
                                                        percent === 100 
                                                            ? 'bg-emerald-500' 
                                                            : percent > 50 
                                                                ? 'bg-blue-500' 
                                                                : percent > 0 
                                                                    ? 'bg-amber-400' 
                                                                    : 'bg-transparent'
                                                    }`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            {percent === 100 && item.completedAnalyses > 0 && item.status !== 'Approving' && (
                                                <p className="text-[10px] text-emerald-600 font-medium">Hoàn thành thực hiện, chờ chuyển duyệt.</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 align-middle ">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 ease-in-out w-9 h-9 p-0"
                                            title="Xem chi tiết mẫu"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}

                        {samples.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-muted-foreground bg-muted/5">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 bg-background rounded-full border border-border/50 shadow-sm">
                                            <PackageSearch className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <p>Không có mẫu nào đang quá trình thực hiện.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        
                        {loading && samples.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                                         <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                         <p>Đang tải dữ liệu tiến độ...</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
