import { useEffect, useMemo, useState } from "react";
import { X, Edit, Save, Plus, Trash2, Upload, FileText, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DraggableInfoTable } from "@/components/common/DraggableInfoTable";

import type { ReceiptDetail, ReceiptSample, ReceiptAnalysis } from "@/types/receipt";

type InfoRow = { label: string; value: string };

interface SampleDetailModalProps {
  sample: ReceiptSample;
  receipt: ReceiptDetail;
  onClose: () => void;
  onSave: (updatedSample: ReceiptSample) => void | Promise<unknown>;

  focusAnalysisId?: string | null;
}

function toInfoRows(v: unknown): InfoRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      const item = x as { label?: unknown; value?: unknown };
      const label = typeof item.label === "string" ? item.label : "";
      const valueRaw = item.value;
      const value = valueRaw == null ? "" : String(valueRaw);
      return { label, value };
    })
    .filter((r) => r.label.trim().length > 0);
}

export function SampleDetailModal({
  sample,
  receipt,
  onClose,
  onSave,
  focusAnalysisId = null,
}: SampleDetailModalProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSample, setEditedSample] = useState<ReceiptSample>(sample);

  useEffect(() => {
    setEditedSample(sample);
    setIsEditing(false);
  }, [sample]);

  const initialAnalyses = useMemo<ReceiptAnalysis[]>(() => {
    return (sample.analyses ?? []).filter((a) => a?.analysisId);
  }, [sample.analyses]);

  const [sampleAnalyses, setSampleAnalyses] = useState<ReceiptAnalysis[]>(initialAnalyses);

  useEffect(() => {
    setSampleAnalyses(initialAnalyses);
  }, [initialAnalyses]);

  const [attachedFiles] = useState<
    Array<{
      fileId: string;
      fileName: string;
      mimeType?: string | null;
      fileSize?: string | number | null;
      createdById?: string | null;
      createdAt?: string | null;
    }>
  >([]);

  const [productDetails, setProductDetails] = useState<InfoRow[]>(
    toInfoRows(editedSample.sampleInfo),
  );
  const [testingInfo, setTestingInfo] = useState<InfoRow[]>(
    toInfoRows(editedSample.sampleReceiptInfo),
  );

  useEffect(() => {
    setProductDetails(toInfoRows(sample.sampleInfo));
    setTestingInfo(toInfoRows(sample.sampleReceiptInfo));
  }, [sample.sampleInfo, sample.sampleReceiptInfo]);

  useEffect(() => {
    if (!focusAnalysisId) return;
    const el = document.getElementById(`analysis-row-${focusAnalysisId}`);
    el?.scrollIntoView({ block: "center" });
  }, [focusAnalysisId]);

  const handleSave = async () => {
    const updatedSample: ReceiptSample = {
      ...editedSample,
      sampleInfo: productDetails.map((r) => ({ label: r.label, value: r.value })),
      sampleReceiptInfo: testingInfo.map((r) => ({ label: r.label, value: r.value })),
      analyses: sampleAnalyses,
    };

    await onSave(updatedSample);
    setIsEditing(false);
  };

  const handleAnalysisChange = (index: number, field: keyof ReceiptAnalysis, value: unknown) => {
    setSampleAnalyses((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const handleAddAnalysis = () => {
    const newAnalysis: ReceiptAnalysis = {
      analysisId: `new-${Date.now()}`,
      sampleId: editedSample.sampleId,
      analysisStatus: "Pending",
      parameterName: "",
      protocolCode: "",
      analysisUnit: "",
      analysisResult: null,
      createdAt: new Date().toISOString(),
    };

    setSampleAnalyses((prev) => [...prev, newAnalysis]);
  };

  const handleDeleteAnalysis = (index: number) => {
    setSampleAnalyses((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/50 z-50" onClick={onClose} />

      <div className="fixed inset-4 bg-background rounded-lg shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {String(t("reception.sampleDetail.title", { code: sample.sampleId }))}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {String(t("reception.sampleDetail.description"))}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                {String(t("common.edit"))}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  {String(t("common.save"))}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditedSample(sample);
                    setProductDetails(toInfoRows(sample.sampleInfo));
                    setTestingInfo(toInfoRows(sample.sampleReceiptInfo));
                    setSampleAnalyses(initialAnalyses);
                    setIsEditing(false);
                  }}
                  className="text-xs"
                >
                  {String(t("common.cancel"))}
                </Button>
              </>
            )}

            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {String(t("reception.sampleDetail.relatedReceipt"))}
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {String(t("lab.receipts.receiptCode"))}:
                  </span>
                  <div className="font-medium text-foreground">{receipt.receiptCode ?? "-"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {String(t("crm.clients.clientName"))}:
                  </span>
                  <div className="text-foreground">{receipt.client?.clientName ?? "-"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {String(t("lab.receipts.receiptDate"))}:
                  </span>
                  <div className="text-foreground">{receipt.receiptDate?.split("T")[0] ?? "-"}</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {String(t("lab.samples.sampleName"))}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {String(t("lab.samples.sampleName"))}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedSample.sampleClientInfo ?? ""}
                      onChange={(e) =>
                        setEditedSample({ ...editedSample, sampleClientInfo: e.target.value })
                      }
                      className="mt-1 h-8 text-sm bg-background"
                    />
                  ) : (
                    <div className="text-sm font-medium text-foreground mt-1">
                      {sample.sampleClientInfo ?? "-"}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    {String(t("lab.samples.sampleTypeName"))}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedSample.sampleTypeName ?? ""}
                      onChange={(e) =>
                        setEditedSample({ ...editedSample, sampleTypeName: e.target.value })
                      }
                      className="mt-1 h-8 text-sm bg-background"
                    />
                  ) : (
                    <div className="text-sm font-medium text-foreground mt-1">
                      {sample.sampleTypeName ?? "-"}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    {String(t("lab.samples.sampleStatus"))}
                  </Label>
                  <div className="mt-1">
                    <Badge variant="outline">{sample.sampleStatus ?? "-"}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    {String(t("lab.samples.samplePreservation"))}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedSample.samplePreservation ?? ""}
                      onChange={(e) =>
                        setEditedSample({ ...editedSample, samplePreservation: e.target.value })
                      }
                      className="mt-1 h-8 text-sm bg-background"
                    />
                  ) : (
                    <div className="text-sm text-foreground mt-1">
                      {sample.samplePreservation ?? "-"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DraggableInfoTable
              title={String(t("reception.sampleDetail.productDetails"))}
              data={productDetails}
              isEditing={isEditing}
              onChange={setProductDetails}
            />
            <DraggableInfoTable
              title={String(t("reception.sampleDetail.testingInfo"))}
              data={testingInfo}
              isEditing={isEditing}
              onChange={setTestingInfo}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">
                {String(t("reception.sampleDetail.analysisList"))}
              </h3>
            </div>

            <div className="bg-background border border-border rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      {String(t("lab.analyses.parameterName"))}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      {String(t("lab.analyses.protocolCode"))}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      {String(t("lab.analyses.analysisUnit"))}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      {String(t("lab.analyses.analysisResult"))}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {sampleAnalyses.map((analysis, index) => {
                    const isFocused = Boolean(
                      focusAnalysisId && analysis.analysisId === focusAnalysisId,
                    );

                    return (
                      <tr
                        key={analysis.analysisId}
                        id={`analysis-row-${analysis.analysisId}`}
                        className={[
                          "hover:bg-muted/30",
                          isFocused ? "bg-primary/10 ring-1 ring-primary/30" : "",
                        ].join(" ")}
                      >
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={analysis.parameterName ?? ""}
                              onChange={(e) =>
                                handleAnalysisChange(index, "parameterName", e.target.value)
                              }
                              className="h-7 text-xs bg-background"
                            />
                          ) : (
                            <span className="text-foreground">{analysis.parameterName ?? "-"}</span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={analysis.protocolCode ?? ""}
                              onChange={(e) =>
                                handleAnalysisChange(index, "protocolCode", e.target.value)
                              }
                              className="h-7 text-xs bg-background"
                            />
                          ) : (
                            <span className="text-muted-foreground">{analysis.protocolCode ?? "-"}</span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={analysis.analysisUnit ?? ""}
                              onChange={(e) =>
                                handleAnalysisChange(index, "analysisUnit", e.target.value)
                              }
                              className="h-7 text-xs bg-background"
                            />
                          ) : (
                            <span className="text-muted-foreground">{analysis.analysisUnit ?? "-"}</span>
                          )}
                        </td>

                        <td className="px-3 py-2 text-foreground">
                          {analysis.analysisResult == null ? "-" : String(analysis.analysisResult)}
                        </td>

                        <td className="px-3 py-2 text-center">
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteAnalysis(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {isEditing && (
                <div className="p-2 border-t border-border bg-muted/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs flex items-center justify-center gap-1 bg-background hover:bg-muted"
                    onClick={handleAddAnalysis}
                  >
                    <Plus className="h-3 w-3" />
                    {String(t("reception.sampleDetail.addAnalysis"))}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">
                {String(t("reception.sampleDetail.attachedFiles"))}
              </h3>
              {isEditing && (
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {String(t("common.upload"))}
                </Button>
              )}
            </div>

            <div className="bg-background border border-border rounded-lg overflow-hidden overflow-x-auto">
              {attachedFiles.length > 0 ? (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("common.fileName"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("common.type"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("common.size"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("common.uploadedBy"))}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        {String(t("common.uploadedAt"))}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                        {String(t("common.actions"))}
                      </th>
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
                            {file.mimeType ?? "-"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{file.fileSize ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{file.createdById ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{file.createdAt ?? "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
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
                  <p>{String(t("reception.receiptDetail.noFile"))}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
