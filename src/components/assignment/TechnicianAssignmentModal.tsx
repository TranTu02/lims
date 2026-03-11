import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, Loader2, User, Users } from "lucide-react";

import { useIdentitiesList } from "@/api/identities";
import { useAnalysesUpdateBulk } from "@/api/analyses";
import { useIdentityGroupsList, useIdentityGroupFull } from "@/api/identityGroups";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TechnicianAssignmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAnalysisIds: string[];
    onSuccess: () => void;
}

export function TechnicianAssignmentModal({ open, onOpenChange, selectedAnalysisIds, onSuccess }: TechnicianAssignmentModalProps) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"technician" | "group">("technician");
    const [selectedTechId, setSelectedTechId] = useState<string>("");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);

    // Fetch technicians
    const { data: identitiesRes, isLoading: isTechLoading } = useIdentitiesList({
        query: {
            identityRoles: ["ROLE_TECHNICIAN"],
            identityStatus: ["active"],
            itemsPerPage: 100,
        },
    });

    const techniciansList = useMemo(() => {
        return (identitiesRes?.data as Array<{ identityId: string; identityName: string; identityPhone?: string }>) ?? [];
    }, [identitiesRes?.data]);

    // Fetch identity groups
    const { data: groupsRes, isLoading: isGroupsLoading } = useIdentityGroupsList({
        query: {
            identityGroupMainRole: ["ROLE_TECHNICIAN"],
            option: "full",
            itemsPerPage: 100,
        },
    });

    const groupsList = useMemo(() => groupsRes?.data ?? [], [groupsRes?.data]);

    // Fetch selected group details to get snapshot data for update
    const { data: fullGroup, isLoading: isFullGroupLoading } = useIdentityGroupFull(selectedGroupId, {
        enabled: mode === "group" && !!selectedGroupId,
    });

    // Bulk Update Mutator
    const { mutateAsync: mutateBulk, isPending } = useAnalysesUpdateBulk();

    const handleConfirm = async () => {
        if (mode === "technician" && !selectedTechId) return;
        if (mode === "group" && !selectedGroupId) return;
        if (selectedAnalysisIds.length === 0) return;

        try {
            const body = selectedAnalysisIds.map((id) => {
                if (mode === "group" && fullGroup) {
                    return {
                        analysisId: id,
                        technicianGroupId: fullGroup.identityGroupId,
                        technicianGroupName: fullGroup.identityGroupName,
                        technicianId: fullGroup.identityGroupInChargeId,
                        technicianIds: fullGroup.identityIds,
                    };
                }
                return {
                    analysisId: id,
                    technicianId: selectedTechId,
                    technicianIds: [selectedTechId],
                    technicianGroupId: null,
                    technicianGroupName: null,
                };
            });

            await mutateBulk({ body });
            onSuccess();
        } catch (error) {
            console.error("Failed to assign:", error);
        }
    };

    const isButtonDisabled = isPending || (mode === "technician" ? !selectedTechId : !selectedGroupId);

    const selectedTechName = useMemo(() => {
        return techniciansList.find((tech) => tech.identityId === selectedTechId)?.identityName ?? "";
    }, [selectedTechId, techniciansList]);

    const selectedGroupName = useMemo(() => {
        return groupsList.find((g) => g.identityGroupId === selectedGroupId)?.identityGroupName ?? "";
    }, [selectedGroupId, groupsList]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t("assignment.modal.title")}</DialogTitle>
                    <DialogDescription>{t("assignment.modal.description").replace("{{count}}", selectedAnalysisIds.length.toString())}</DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={(v) => setMode(v as "technician" | "group")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="technician">
                            <User className="mr-2 h-4 w-4" />
                            {t("assignment.modal.tabs.technician")}
                        </TabsTrigger>
                        <TabsTrigger value="group">
                            <Users className="mr-2 h-4 w-4" />
                            {t("assignment.modal.tabs.group")}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="technician" className="space-y-4 pt-4">
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between" disabled={isTechLoading}>
                                    {selectedTechId ? selectedTechName : t("assignment.modal.selectPlaceholder")}
                                    {isTechLoading ? <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[550px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder={t("assignment.modal.searchPlaceholder")} />
                                    <CommandList>
                                        <CommandEmpty>{t("assignment.modal.empty")}</CommandEmpty>
                                        <CommandGroup>
                                            {techniciansList.map((tech) => (
                                                <CommandItem
                                                    key={tech.identityId}
                                                    value={tech.identityName}
                                                    onSelect={() => {
                                                        setSelectedTechId(tech.identityId);
                                                        setPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedTechId === tech.identityId ? "opacity-100" : "opacity-0")} />
                                                    {tech.identityName} {tech.identityPhone ? `(${tech.identityPhone})` : ""}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </TabsContent>

                    <TabsContent value="group" className="space-y-4 pt-4">
                        <Popover open={groupPopoverOpen} onOpenChange={setGroupPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={groupPopoverOpen} className="w-full justify-between" disabled={isGroupsLoading}>
                                    {selectedGroupId ? selectedGroupName : t("assignment.modal.selectGroupPlaceholder")}
                                    {isGroupsLoading ? <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[550px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder={t("assignment.modal.searchPlaceholder")} />
                                    <CommandList>
                                        <CommandEmpty>{t("assignment.modal.empty")}</CommandEmpty>
                                        <CommandGroup>
                                            {groupsList.map((group) => (
                                                <CommandItem
                                                    key={group.identityGroupId}
                                                    value={group.identityGroupName}
                                                    onSelect={() => {
                                                        setSelectedGroupId(group.identityGroupId);
                                                        setGroupPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedGroupId === group.identityGroupId ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col">
                                                        <span>{group.identityGroupName}</span>
                                                        {group.identityGroupDescription && <span className="text-xs text-muted-foreground">{group.identityGroupDescription}</span>}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {fullGroup && (
                            <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{t("assignment.modal.groupInCharge")}</span>
                                    <span className="text-sm">
                                        {fullGroup.identityGroupInCharge?.identityName}
                                        {fullGroup.identityGroupInCharge?.alias && <span className="ml-1 text-xs text-muted-foreground italic">({fullGroup.identityGroupInCharge.alias})</span>}
                                        {!fullGroup.identityGroupInCharge && "-"}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">
                                        {t("assignment.modal.groupMembers")} ({fullGroup.identities?.length || 0})
                                    </span>
                                    <ScrollArea className="h-[120px] w-full rounded-md border p-2 bg-background">
                                        <div className="flex flex-wrap gap-2">
                                            {fullGroup.identities?.map((member) => (
                                                <Badge key={member.identityId} variant="secondary" className="font-normal">
                                                    {member.identityName}
                                                    {member.alias && <span className="ml-1 text-[10px] opacity-70 italic">{member.alias}</span>}
                                                </Badge>
                                            ))}
                                            {(!fullGroup.identities || fullGroup.identities.length === 0) && <span className="text-xs text-muted-foreground italic">{t("common.noData")}</span>}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        )}
                        {isFullGroupLoading && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        {t("assignment.modal.cancel")}
                    </Button>
                    <Button onClick={handleConfirm} disabled={isButtonDisabled}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("assignment.modal.confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
