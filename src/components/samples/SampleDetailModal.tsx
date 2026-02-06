import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { ApiResponse } from "@/api/client";
import { samplesGetFull } from "@/api/samples";
import { samplesKeys } from "@/api/samplesKeys";
import type { SampleAnalysis, SampleDetail } from "@/types/sample";

type Props = {
  open: boolean;
  sampleId: string | null;
  onClose: () => void;
};

function SampleStatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();

  if (!status) {
    return (
      <Badge variant="outline" className="text-xs">
        {t("common.noData")}
      </Badge>
    );
  }

  if (status === "Stored") {
    return (
      <Badge variant="success" className="text-xs">
        {t("samples.status.stored")}
      </Badge>
    );
  }

  if (status === "Analyzing") {
    return (
      <Badge variant="warning" className="text-xs">
        {t("samples.status.analyzing")}
      </Badge>
    );
  }

  if (status === "Received") {
    return (
      <Badge variant="secondary" className="text-xs">
        {t("samples.status.received")}
      </Badge>
    );
  }

  if (status === "Disposed") {
    return (
      <Badge variant="destructive" className="text-xs">
        {t("samples.status.disposed")}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      {status}
    </Badge>
  );
}

function AnalysisStatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();

  if (!status) {
    return (
      <Badge variant="outline" className="text-xs">
        {t("common.noData")}
      </Badge>
    );
  }

  if (status === "Completed") {
    return (
      <Badge variant="success" className="text-xs">
        {t("lab.analyses.status.Approved")}
      </Badge>
    );
  }

  if (status === "Testing") {
    return (
      <Badge variant="warning" className="text-xs">
        {t("lab.analyses.status.Testing")}
      </Badge>
    );
  }

  if (status === "Assigned") {
    return (
      <Badge variant="secondary" className="text-xs">
        {t("lab.analyses.status.Pending")}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="text-xs">
      {status}
    </Badge>
  );
}

export function SampleDetailModal({ open, sampleId, onClose }: Props) {
  const { t } = useTranslation();

  function toDash(v: unknown, dash = t("common.noData")): string {
    if (typeof v === "string") {
      const s = v.trim();
      return s.length > 0 ? s : dash;
    }
    if (v == null) return dash;
    return String(v);
  }

  const q = useQuery({
    queryKey: sampleId ? samplesKeys.detail(sampleId) : samplesKeys.detail(""),
    enabled: open && Boolean(sampleId),
    queryFn: async (): Promise<ApiResponse<SampleDetail>> => {
      if (!sampleId) throw new Error("Missing sampleId");
      const res = await samplesGetFull({ sampleId });
      if (!res.success) throw new Error(res.error?.message ?? "Request failed");
      return res as ApiResponse<SampleDetail>;
    },
  });

  const data = q.data?.data ?? null;
  const analyses: SampleAnalysis[] = data?.analyses ?? [];

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />

        <DialogPrimitive.Content
          className="
            fixed inset-4 z-50 flex flex-col
            bg-card border border-border rounded-xl shadow-lg
            outline-none
          ">
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground truncate">
                {t("reception.sampleDetail.title", { code: sampleId ?? "" })}
              </DialogPrimitive.Title>
            </div>

            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onClose}
                aria-label={t("common.close")}>
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {q.isLoading ? (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-56 bg-muted rounded" />
                  <div className="h-24 w-full bg-muted rounded" />
                  <div className="h-40 w-full bg-muted rounded" />
                </div>
              </div>
            ) : q.isError ? (
              <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">
                    {t("common.error")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("common.toast.failed")}
                  </div>
                </div>
              </div>
            ) : !data ? (
              <div className="text-sm text-muted-foreground">
                {t("common.noData")}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">
                    {t("reception.sampleDetail.sampleList")}
                  </div>

                  <div className="bg-muted/20 border border-border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("lab.samples.sampleId")}
                        </div>
                        <div className="text-sm text-foreground mt-1">
                          {toDash(data.sampleId)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("lab.samples.receiptId")}
                        </div>
                        <div className="text-sm text-foreground mt-1">
                          {toDash(data.receiptId)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("lab.samples.sampleTypeName")}
                        </div>
                        <div className="text-sm text-foreground mt-1">
                          {toDash(data.sampleTypeName)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("lab.samples.sampleStatus")}
                        </div>
                        <div className="mt-1">
                          <SampleStatusBadge
                            status={data.sampleStatus ?? null}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("lab.samples.sampleVolume")}
                        </div>
                        <div className="text-sm text-foreground mt-1">
                          {toDash(data.sampleVolume)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">
                          {t("lab.samples.sampleStorageLoc")}
                        </div>
                        <div className="text-sm text-foreground mt-1">
                          {toDash(data.sampleStorageLoc)}
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <div className="text-xs text-muted-foreground">
                          {t("lab.samples.sampleClientInfo")}
                        </div>
                        <div className="text-sm text-foreground mt-1">
                          {toDash(data.sampleClientInfo)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">
                    {t("reception.sampleDetail.analysisList")}
                  </div>

                  <div className="bg-card border border-border rounded-lg overflow-x-auto">
                    <table className="w-full min-w-5xl">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                            {t("lab.analyses.parameterName")}
                          </th>
                          <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                            {t("lab.analyses.matrixId")}
                          </th>
                          <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                            {t("lab.analyses.protocolCode")}
                          </th>
                          <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                            {t("lab.analyses.technicianIds")}
                          </th>
                          <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                            {t("lab.analyses.analysisResult")}
                          </th>
                          <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                            {t("lab.analyses.analysisUnit")}
                          </th>
                          <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                            {t("lab.analyses.analysisStatus")}
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border">
                        {analyses.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-3 py-6 text-center text-sm text-muted-foreground">
                              {t("reception.createReceipt.noAnalysis")}
                            </td>
                          </tr>
                        ) : (
                          analyses.map((a) => (
                            <tr
                              key={a.analysisId}
                              className="hover:bg-accent/30 transition-colors">
                              <td className="px-3 py-4 text-sm text-foreground">
                                {toDash(a.parameterName)}
                              </td>
                              <td className="px-3 py-4 text-sm text-muted-foreground">
                                {toDash(a.matrixId)}
                              </td>
                              <td className="px-3 py-4 text-sm text-muted-foreground">
                                {toDash(a.protocolCode)}
                              </td>
                              <td className="px-3 py-4 text-sm text-foreground">
                                {toDash(
                                  a.technicianIds?.join(", ") ?? a.technicianId
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-foreground">
                                {toDash(a.analysisResult)}
                              </td>
                              <td className="px-3 py-4 text-sm text-muted-foreground">
                                {toDash(a.analysisUnit)}
                              </td>
                              <td className="px-3 py-4">
                                <AnalysisStatusBadge
                                  status={a.analysisStatus ?? null}
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
