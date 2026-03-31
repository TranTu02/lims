import { useTranslation } from "react-i18next";
import { X, Edit, Trash2, Calendar, Mail, Phone, MapPin, Hash, UserCircle, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useIdentityFull } from "@/api/identities";
import { IdentityRoleBadges } from "./IdentityRoleBadges";

type Props = {
  identityId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function IdentityDetailPanel({ identityId, onClose, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  const fullQ = useIdentityFull(identityId, { enabled: Boolean(identityId) });
  const data = fullQ.data;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const last = parts[parts.length - 1] ?? "";
    return (last[0] ?? "?").toUpperCase();
  };

  if (!identityId) return null;

  return (
    <div className="flex flex-col h-full bg-card border-l border-border animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          {t("hr.detail.title", { defaultValue: "Chi tiết nhân sự" })}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {fullQ.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground whitespace-pre-wrap">
            {t("common.loading")}
          </div>
        ) : fullQ.isError ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-sm text-destructive">{t("common.error")}</div>
            <Button variant="outline" size="sm" onClick={() => fullQ.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("common.empty")}
          </div>
        ) : (
          <div className="p-0">
            {/* Header Section */}
            <div className="p-6 bg-gradient-to-b from-muted/50 to-transparent flex flex-col items-center text-center space-y-4">
              <Avatar className="h-20 w-20 border-2 border-primary/10 ring-4 ring-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(data.identityName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  {data.identityName}
                </h3>
                <div className="flex items-center justify-center gap-2">
                   <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 bg-background/50">
                    {data.identityId}
                  </Badge>
                  <Badge variant={data.identityStatus === "active" ? "success" : "warning"}>
                    {t(`hr.status.${data.identityStatus}`, { defaultValue: data.identityStatus })}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(data.identityId)} className="gap-2 h-8">
                  <Edit className="h-3.5 w-3.5" />
                  {t("common.edit")}
                </Button>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2 h-8"
                    onClick={() => onDelete(data.identityId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("common.delete")}
                </Button>
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <UserCircle className="h-3 w-3" />
                  {t("hr.detail.sections.contact", { defaultValue: "Thông tin liên hệ" })}
                </h4>
                
                <div className="grid grid-cols-1 gap-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 text-primary/60" />
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">Email</div>
                      <div className="text-sm font-medium break-all">{data.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 text-primary/60" />
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t("hr.fields.identityPhone", { defaultValue: "Số điện thoại" })}</div>
                      <div className="text-sm font-medium">{data.identityPhone || "-"}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary/60" />
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t("hr.fields.identityAddress", { defaultValue: "Địa chỉ" })}</div>
                      <div className="text-sm font-medium leading-relaxed">{data.identityAddress || "-"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Identity Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  {t("hr.detail.sections.identity", { defaultValue: "Thông tin định danh" })}
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t("hr.fields.identityGroupId", { defaultValue: "Nhóm / Vị trí" })}</div>
                    <div className="text-sm font-medium flex items-center gap-2">
                       <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                       {data.identityGroupId || "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t("hr.fields.identityNID", { defaultValue: "Số CCCD/NID" })}</div>
                    <div className="text-sm font-medium">{data.identityNID || "-"}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t("hr.fields.alias", { defaultValue: "Bí danh" })}</div>
                    <div className="text-sm font-medium italic text-muted-foreground">{data.alias || "-"}</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">{t("hr.fields.roles_alias", { defaultValue: "Vị trí chuyên môn" })}</div>
                    <div className="flex flex-wrap gap-1.5">
                      <IdentityRoleBadges roles={data.roles} max={20} />
                    </div>
                  </div>
                </div>
              </div>

              {Array.isArray(data.documents) && data.documents.length > 0 && (
                <>
                  <Separator className="bg-border/60" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {t("hr.fields.documents", { defaultValue: "Hồ sơ năng lực" })}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {(data.documents as any[]).map(doc => (
                        <div key={doc.documentId} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors group">
                           <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="h-4 w-4 text-primary/40 flex-shrink-0" />
                              <div className="overflow-hidden">
                                 <div className="text-sm font-medium truncate">{doc.documentTitle || doc.documentId}</div>
                                 <div className="text-[10px] text-muted-foreground uppercase">{doc.documentId}</div>
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FileText className="h-3.5 w-3.5" />
                           </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <Separator className="bg-border/60" />
              
              <div className="pt-2">
                 <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {t("common.createdAt")}: {new Date(data.createdAt).toLocaleString()}
                 </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
