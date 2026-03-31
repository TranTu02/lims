import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchSelectPicker, type PickerItem } from "@/components/shared/SearchSelectPicker";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";
import { searchDocuments } from "@/api/documents";

type Props = {
    selectedIds: string[];
    selectedItems: PickerItem[];
    onChange: (ids: string[], items: PickerItem[]) => void;
    disabled?: boolean;
};

export function IdentityDocumentManager({ selectedIds, selectedItems, onChange, disabled }: Props) {
    const { t } = useTranslation();
    const [uploadOpen, setUploadOpen] = useState(false);

    return (
        <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    {String(t("hr.documents.title", { defaultValue: "Hồ sơ nhân sự (Bằng cấp, Hợp đồng...)" }))}
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setUploadOpen(true)} 
                    className="h-7 text-[10px]"
                    disabled={disabled}
                >
                    <Upload className="h-3 w-3 mr-1" /> {String(t("common.upload"))}
                </Button>
            </div>
            
            <SearchSelectPicker
                label=""
                selected={selectedItems}
                onChange={(items) => {
                    onChange(items.map(i => i.id), items);
                }}
                onSearch={async (q) => {
                    const res = await searchDocuments(q, "PERSONNEL_RECORD");
                    return res.map(d => ({ 
                        id: d.documentId, 
                        label: d.documentTitle || d.documentId, 
                        sublabel: d.documentId 
                    }));
                }}
                placeholder={String(t("hr.documents.search", { defaultValue: "Tìm hồ sơ trong hệ thống..." }))}
            />

            <DocumentUploadModal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                fixedDocumentType="PERSONNEL_RECORD"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        const newId = doc.documentId;
                        const newItem = { 
                            id: newId, 
                            label: doc.documentTitle || newId, 
                            sublabel: newId 
                        };
                        onChange([...selectedIds, newId], [...selectedItems, newItem]);
                    }
                }}
            />
        </div>
    );
}
