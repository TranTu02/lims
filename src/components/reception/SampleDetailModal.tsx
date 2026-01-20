import { useState, useMemo } from "react";
import { X, Edit, Save, Plus, Trash2, Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DraggableInfoTable } from "@/components/common/DraggableInfoTable";

import type { Sample, Analysis, Receipt } from "@/types/lab";
import type { FileEntity } from "@/types/document";

import { useTranslation } from "react-i18next";
import { mockAnalyses } from "@/types/mockdata";

interface SampleDetailModalProps {
    sample: Sample;
    receipt: Receipt;
    onClose: () => void;
    onSave: (updatedSample: Sample) => void;
}

export function SampleDetailModal({ sample, receipt, onClose, onSave }: SampleDetailModalProps) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedSample, setEditedSample] = useState(sample);

    // Initialize analyses from mock data based on sampleId
    const initialAnalyses = useMemo(() => {
        return mockAnalyses.filter((a) => a.sampleId === sample.sampleId);
    }, [sample.sampleId]);

    const [sampleAnalyses, setSampleAnalyses] = useState<Analysis[]>(initialAnalyses);

    // Mock attached files state for now as it is not in the core Sample type yet
    const [attachedFiles] = useState<FileEntity[]>([]);

    // DraggableInfoTable items
    const [productDetails, setProductDetails] = useState<any[]>((editedSample.sampleInfo || []).map((i) => ({ label: i.label, value: String(i.value) })));
    const [testingInfo, setTestingInfo] = useState<any[]>((editedSample.sampleReceiptInfo || []).map((i) => ({ label: i.label, value: String(i.value) })));

    const handleSave = () => {
        const updatedSample = {
            ...editedSample,
            sampleInfo: productDetails,
            sampleReceiptInfo: testingInfo,
        };
        onSave(updatedSample);
        setIsEditing(false);
    };

    const handleAnalysisChange = (index: number, field: keyof Analysis, value: any) => {
        setSampleAnalyses((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
    };

    const handleAddAnalysis = () => {
        const newAnalysis: Analysis = {
            analysisId: `new-${Date.now()}`,
            sampleId: sample.sampleId,
            matrixId: "", // To be filled
            technicianId: "",
            analysisStatus: "Pending",
            analysisResultStatus: "NotEvaluated",
            createdAt: new Date().toISOString(),
            createdById: "CURRENT_USER",
            modifiedAt: new Date().toISOString(),
            modifiedById: "CURRENT_USER",
            parameterName: "",
            protocolCode: "",
            analysisLocation: "",
            analysisUnit: "",
        };
        setSampleAnalyses([...sampleAnalyses, newAnalysis]);
    };

    const handleDeleteAnalysis = (index: number) => {
        setSampleAnalyses((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-4 bg-background rounded-lg shadow-xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{t("reception.sampleDetail.title", { code: sample.sampleId })}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("reception.sampleDetail.description")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs">
                                <Edit className="h-3.5 w-3.5" />
                                {t("common.edit")}
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" onClick={handleSave} className="flex items-center gap-1.5 text-xs">
                                    <Save className="h-3.5 w-3.5" />
                                    {t("common.save")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setEditedSample(sample);
                                        setProductDetails(sample.sampleInfo || []);
                                        setTestingInfo(sample.sampleReceiptInfo || []);
                                        setSampleAnalyses(initialAnalyses);
                                        setIsEditing(false);
                                    }}
                                    className="text-xs"
                                >
                                    {t("common.cancel")}
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Top Section: Sample Info & Receipt Ref */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Receipt Reference */}
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3">{t("reception.sampleDetail.relatedReceipt")}</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{t("lab.receipts.receiptCode")}:</span>
                                    <div className="font-medium text-foreground">{receipt.receiptCode}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t("crm.clients.clientName")}:</span>
                                    <div className="text-foreground">{receipt.client?.clientName}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{t("lab.receipts.receiptDate")}:</span>
                                    <div className="text-foreground">{receipt.receiptDate?.split("T")[0]}</div>
                                </div>
                            </div>
                        </div>

                        {/* Sample Basic Info */}
                        <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3">{t("lab.samples.sampleName")}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.sampleName")}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.sampleClientInfo}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleClientInfo: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleClientInfo}</div>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.sampleType")}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.sampleTypeName}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleTypeName: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleTypeName}</div>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.status.title")}</Label>
                                    <div className="mt-1">
                                        <Badge variant="outline">{sample.sampleStatus}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{t("lab.samples.preservation")}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.samplePreservation || ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, samplePreservation: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm text-foreground mt-1">{sample.samplePreservation || "-"}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DraggableInfoTable Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DraggableInfoTable title={t("reception.sampleDetail.productDetails")} data={productDetails} isEditing={isEditing} onChange={setProductDetails} />
                        <DraggableInfoTable title={t("reception.sampleDetail.testingInfo")} data={testingInfo} isEditing={isEditing} onChange={setTestingInfo} />
                    </div>

                    {/* Analyses Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{t("reception.sampleDetail.analysisList")}</h3>
                        </div>
                        <div className="bg-background border border-border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.parameterName")}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.method")}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.unit")}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t("lab.analyses.result")}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sampleAnalyses.map((analysis, index) => (
                                        <tr key={analysis.analysisId} className="hover:bg-muted/30">
                                            <td className="px-3 py-2">
                                                {isEditing ? (
                                                    <Input
                                                        value={analysis.parameterName}
                                                        onChange={(e) => handleAnalysisChange(index, "parameterName", e.target.value)}
                                                        className="h-7 text-xs bg-background"
                                                    />
                                                ) : (
                                                    <span className="text-foreground">{analysis.parameterName}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {isEditing ? (
                                                    <Input
                                                        value={analysis.protocolCode}
                                                        onChange={(e) => handleAnalysisChange(index, "protocolCode", e.target.value)}
                                                        className="h-7 text-xs bg-background"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">{analysis.protocolCode}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {isEditing ? (
                                                    <Input
                                                        value={analysis.analysisUnit}
                                                        onChange={(e) => handleAnalysisChange(index, "analysisUnit", e.target.value)}
                                                        className="h-7 text-xs bg-background"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">{analysis.analysisUnit}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-foreground">{analysis.analysisResult || "-"}</td>
                                            <td className="px-3 py-2 text-center">
                                                {isEditing && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteAnalysis(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {isEditing && (
                                <div className="p-2 border-t border-border bg-muted/30">
                                    <Button variant="outline" size="sm" className="w-full text-xs flex items-center justify-center gap-1 bg-background" onClick={handleAddAnalysis}>
                                        <Plus className="h-3 w-3" />
                                        {t("reception.sampleDetail.addAnalysis")}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attached Files Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{t("reception.sampleDetail.attachedFiles")}</h3>
                            {isEditing && (
                                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    {t("common.upload")}
                                </Button>
                            )}
                        </div>
                        <div className="bg-background border border-border rounded-lg overflow-hidden">
                            {attachedFiles.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.fileName")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.type")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.size")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.uploadedBy")}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.uploadedAt")}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("common.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {attachedFiles.map((file) => (
                                            <tr key={file.fileId} className="hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-foreground">{file.fileName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-xs">
                                                        {file.mimeType}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-foreground">{file.fileSize}</td>
                                                <td className="px-4 py-3 text-sm text-foreground">{file.createdById}</td>
                                                <td className="px-4 py-3 text-sm text-foreground">{file.createdAt}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        {isEditing && (
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                    <p>{t("reception.receiptDetail.noFile")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
