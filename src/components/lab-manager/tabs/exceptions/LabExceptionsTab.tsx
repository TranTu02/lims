import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Activity, MessageSquare, Send, CheckCircle2, ChevronRight } from "lucide-react";
import { useLabExceptions } from "../../hooks/useLabExceptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ExceptionSample, ExceptionAnalysis } from "../../hooks/useLabExceptions";

export function LabExceptionsTab() {
    const { 
        loading, urgentSamples, complaintSamples, 
        retestAnalyses, subcontractAnalyses, 
        fetchData, processException 
    } = useLabExceptions();

    const [activeSection, setActiveSection] = useState<"urgent" | "complaint" | "retest" | "subcontract">("urgent");

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleProcessSample = async (id: string) => {
        await processException(id, "approve");
    };

    const renderSampleTable = (data: ExceptionSample[], title: string, subtitle: string, icon: React.ReactNode, iconBg: string) => (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className={`p-4 border-b border-border shrink-0 flex items-center justify-between ${iconBg}`}>
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        {icon}
                        {title}
                    </h2>
                    <p className="text-sm font-medium mt-0.5 opacity-80">{subtitle}</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1 bg-background text-foreground shadow-sm">
                    {data.length} mẫu
                </Badge>
            </div>
            
            <div className="flex-1 overflow-auto bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 font-medium">Mã Phiếu / Mẫu</th>
                            <th className="px-4 py-3 font-medium">Khách hàng</th>
                            <th className="px-4 py-3 font-medium">Lý do</th>
                            <th className="px-4 py-3 font-medium">{activeSection === "urgent" ? "Hạn trả" : "Trạng thái"}</th>
                            <th className="px-4 py-3 font-medium ">Xử lý</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map(item => (
                            <tr key={item.sampleId} className="hover:bg-muted/30">
                                <td className="px-4 py-3 align-top">
                                    <div className="font-semibold">{item.receiptId}</div>
                                    <div className="text-muted-foreground mt-0.5">{item.sampleId}</div>
                                </td>
                                <td className="px-4 py-3 align-top text-foreground">{item.customerName}</td>
                                <td className="px-4 py-3 align-top text-rose-600 font-medium max-w-[200px] leading-relaxed">
                                    {item.reason}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    {activeSection === "urgent" ? (
                                        <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200">
                                            {item.deadline ? new Date(item.deadline).toLocaleString("vi-VN") : "N/A"}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">{item.status}</Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top ">
                                    <Button size="sm" variant="default" onClick={() => handleProcessSample(item.sampleId)} 
                                            disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                                        Tiếp nhận
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
                                    Không có dữ liệu chờ xử lý.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAnalysisTable = (data: ExceptionAnalysis[], title: string, subtitle: string, icon: React.ReactNode, iconBg: string) => (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className={`p-4 border-b border-border shrink-0 flex items-center justify-between ${iconBg}`}>
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                        {icon}
                        {title}
                    </h2>
                    <p className="text-sm font-medium mt-0.5 opacity-80">{subtitle}</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1 bg-background text-foreground shadow-sm">
                    {data.length} chỉ tiêu
                </Badge>
            </div>

            <div className="flex-1 overflow-auto bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 font-medium">Mã Phiếu / Mẫu</th>
                            <th className="px-4 py-3 font-medium">Chỉ tiêu</th>
                            <th className="px-4 py-3 font-medium">KTV thực hiện</th>
                            <th className="px-4 py-3 font-medium max-w-xs">Ghi chú xử lý</th>
                            <th className="px-4 py-3 font-medium ">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map(item => (
                            <tr key={item.analysisId} className="hover:bg-muted/30">
                                <td className="px-4 py-3 align-top">
                                    <div className="font-semibold">{item.receiptId}</div>
                                    <div className="text-muted-foreground mt-0.5">{item.sampleId}</div>
                                </td>
                                <td className="px-4 py-3 align-top font-medium text-primary">{item.parameterName}</td>
                                <td className="px-4 py-3 align-top text-foreground">{item.technicianName}</td>
                                <td className="px-4 py-3 align-top max-w-xs text-amber-700 leading-relaxed font-medium bg-amber-50/50 rounded-md">
                                    <div className="p-2">{item.reason}</div>
                                </td>
                                <td className="px-4 py-3 align-top ">
                                    <Button size="sm" variant="outline" onClick={() => handleProcessSample(item.analysisId)} 
                                            disabled={loading} className="border-border hover:bg-muted font-medium shadow-sm">
                                        Phân công lại
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
                                    Tất cả đã xử lý xong.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-background rounded-b-lg border-x border-b border-border shadow-sm overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-border bg-muted/20 shrink-0 flex flex-col p-3 gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2 pb-1">Phân loại Exception</div>
                
                <button 
                    onClick={() => setActiveSection("urgent")}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-sm font-medium border ${
                        activeSection === "urgent" 
                            ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm" 
                            : "bg-transparent border-transparent text-foreground hover:bg-muted"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${activeSection === "urgent" ? "text-rose-500" : "text-muted-foreground"}`} />
                        Mẫu KHẨN
                    </div>
                    {urgentSamples.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === "urgent" ? "bg-rose-200" : "bg-rose-100 text-rose-600"}`}>
                            {urgentSamples.length}
                        </span>
                    )}
                </button>

                <button 
                    onClick={() => setActiveSection("complaint")}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-sm font-medium border ${
                        activeSection === "complaint" 
                            ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm" 
                            : "bg-transparent border-transparent text-foreground hover:bg-muted"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <MessageSquare className={`h-4 w-4 ${activeSection === "complaint" ? "text-orange-500" : "text-muted-foreground"}`} />
                        Mẫu Khiếu nại
                    </div>
                    {complaintSamples.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === "complaint" ? "bg-orange-200" : "bg-orange-100 text-orange-600"}`}>
                            {complaintSamples.length}
                        </span>
                    )}
                </button>

                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-6 pb-1">Chỉ tiêu / Kỹ thuật</div>

                <button 
                    onClick={() => setActiveSection("retest")}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-sm font-medium border ${
                        activeSection === "retest" 
                            ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" 
                            : "bg-transparent border-transparent text-foreground hover:bg-muted"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Activity className={`h-4 w-4 ${activeSection === "retest" ? "text-amber-500" : "text-muted-foreground"}`} />
                        Thực hiện lại
                    </div>
                    {retestAnalyses.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === "retest" ? "bg-amber-200" : "bg-amber-100 text-amber-600"}`}>
                            {retestAnalyses.length}
                        </span>
                    )}
                </button>

                <button 
                    onClick={() => setActiveSection("subcontract")}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-sm font-medium border ${
                        activeSection === "subcontract" 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                            : "bg-transparent border-transparent text-foreground hover:bg-muted"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Send className={`h-4 w-4 ${activeSection === "subcontract" ? "text-indigo-500" : "text-muted-foreground"}`} />
                        Mẫu thầu phụ
                    </div>
                    {subcontractAnalyses.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeSection === "subcontract" ? "bg-indigo-200" : "bg-indigo-100 text-indigo-600"}`}>
                            {subcontractAnalyses.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 bg-background relative">
                {activeSection === "urgent" && renderSampleTable(
                    urgentSamples, "Danh sách mẫu xử lý KHẨN", "Ưu tiên điều phối và xử lý nhanh", 
                    <Clock className="h-5 w-5 text-rose-600" />, "bg-rose-50/50"
                )}
                {activeSection === "complaint" && renderSampleTable(
                    complaintSamples, "Mẫu đang có Đơn khiếu nại", "Giải quyết thắc mắc của khách hàng / QA", 
                    <MessageSquare className="h-5 w-5 text-orange-600" />, "bg-orange-50/50"
                )}
                {activeSection === "retest" && renderAnalysisTable(
                    retestAnalyses, "Chỉ tiêu yêu cầu Làm lại (Retest)", "Quy trình kiểm tra lại do nghi ngờ kết quả", 
                    <Activity className="h-5 w-5 text-amber-600" />, "bg-amber-50/50"
                )}
                {activeSection === "subcontract" && renderAnalysisTable(
                    subcontractAnalyses, "Chỉ tiêu gửi thầu phụ", "Đang xử lý / Đã trả kết quả từ phòng Lab đối tác", 
                    <Send className="h-5 w-5 text-indigo-600" />, "bg-indigo-50/50"
                )}
            </div>
        </div>
    );
}
