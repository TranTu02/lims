import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

import {
  identitiesGetList,
  identitiesKeys,
  type IdentitiesListQuery,
  type IdentityListItem,
} from "@/api/identities";
import { unwrapWithMetaOrThrow } from "@/utils/api";

import { IdentityToolbar } from "@/components/hr/IdentityToolbar";
import { IdentityTable, type IdentitiesExcelFiltersState } from "@/components/hr/IdentityTable";
import { IdentityCreateModal } from "@/components/hr/IdentityCreateModal";
import { IdentityDetailPanel } from "@/components/hr/IdentityDetailPanel";
import { IdentityUpdateModal } from "@/components/hr/IdentityUpdateModal";
import { IdentityDeleteModal } from "@/components/hr/IdentityDeleteModal";

type TabKey = "all" | string;

function getEntityType(u: IdentityListItem): string {
  return u.entity?.type ?? "unknown";
}

function getTabIcon(tab: TabKey) {
  if (tab === "all") return Users;
  if (tab === "staff") return Shield;
  return Users;
}

type Props = {
  className?: string;
};

function createEmptyFilters(): IdentitiesExcelFiltersState {
  return {
    identityName: [],
    email: [],
    identityId: [],
    identityStatus: [],
  };
}

export function IdentityContainer({ className }: Props) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [excelFilters, setExcelFilters] = useState<IdentitiesExcelFiltersState>(() =>
    createEmptyFilters()
  );

  const listQuery: IdentitiesListQuery = useMemo(
    () => ({
      page,
      itemsPerPage,
      sortColumn: "createdAt",
      sortDirection: "DESC",
      search: search.trim().length > 0 ? search.trim() : null,
      entityType: activeTab === "all" ? null : activeTab,
    }),
    [activeTab, itemsPerPage, page, search]
  );

  const listQ = useQuery({
    queryKey: identitiesKeys.list(listQuery),
    queryFn: async () =>
      unwrapWithMetaOrThrow(await identitiesGetList({ query: listQuery })),
  });

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta ?? null;

  const countsByEntity =
    (meta?.countsByEntity ?? null) as Record<string, number> | null;

  const entityTypes = useMemo(() => {
    if (countsByEntity) return Object.keys(countsByEntity).sort();

    const s = new Set<string>();
    for (const u of items) s.add(getEntityType(u));
    return Array.from(s).sort();
  }, [countsByEntity, items]);

  const tabs = useMemo<TabKey[]>(() => ["all", ...entityTypes], [entityTypes]);

  const tabLabel = (tab: TabKey) => {
    if (tab === "all") return t("hr.dashboard.tabs.all");
    return t(`hr.dashboard.tabs.${tab}`, { defaultValue: tab });
  };

  const tabCount = (tab: TabKey) => {
    if (tab === "all") return meta?.total ?? 0;
    if (countsByEntity) return countsByEntity[tab] ?? 0;
    return items.filter((u) => getEntityType(u) === tab).length;
  };

  const itemsFiltered = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((u) => getEntityType(u) === activeTab);
  }, [activeTab, items]);

  return (
    <div className={className}>
      <div className="bg-card rounded-lg border border-border p-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("hr.dashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("hr.dashboard.description")}
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setPage(1);
          setExcelFilters(createEmptyFilters());
        }}
      >
        <TabsList>
          {tabs.map((tab) => {
            const Icon = getTabIcon(tab);
            return (
              <TabsTrigger key={tab} value={tab}>
                <Icon className="h-4 w-4 mr-2" />
                {tabLabel(tab)}
                <span className="ml-2 text-muted-foreground">
                  ({tabCount(tab)})
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className={`flex-1 transition-all duration-300 w-full ${detailId ? "lg:w-2/3" : "w-full"}`}>
              <IdentityToolbar
                search={search}
                onSearchChange={(v: string) => {
                  setSearch(v);
                  setPage(1);
                }}
                onCreate={() => setCreateOpen(true)}
              />

              <div className="mt-4 space-y-4">
                {listQ.isLoading ? (
                  <div className="bg-card rounded-lg border border-border p-6 text-sm text-muted-foreground">
                    {t("common.loading")}
                  </div>
                ) : listQ.isError ? (
                  <Alert>
                    <AlertDescription className="flex items-center justify-between gap-3">
                      <span>{t("common.error")}</span>
                      <Button variant="outline" onClick={() => listQ.refetch()}>
                        {t("common.retry")}
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <IdentityTable
                      items={activeTab === "all" ? items : itemsFiltered}
                      selectedId={detailId}
                      onSelectRow={(id) => setDetailId(id === detailId ? null : id)}
                      onEdit={(id) => setEditId(id)}
                      onDelete={(id) => setDeleteId(id)}
                      excelFilters={excelFilters}
                      onExcelFiltersChange={(next) => {
                        setExcelFilters(next);
                        setPage(1);
                      }}
                    />

                    <Pagination
                      currentPage={page}
                      totalPages={meta?.totalPages ?? 1}
                      itemsPerPage={itemsPerPage}
                      totalItems={meta?.total ?? 0}
                      onPageChange={setPage}
                      onItemsPerPageChange={(n) => {
                        setItemsPerPage(n);
                        setPage(1);
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {detailId && (
              <div className="w-full lg:w-1/3 min-w-[320px] sticky top-6 self-start">
                <IdentityDetailPanel
                  identityId={detailId}
                  onClose={() => setDetailId(null)}
                  onEdit={(id) => setEditId(id)}
                  onDelete={(id) => setDeleteId(id)}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <IdentityCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />


      <IdentityUpdateModal
        open={Boolean(editId)}
        identityId={editId}
        onClose={() => setEditId(null)}
      />

      <IdentityDeleteModal
        open={Boolean(deleteId)}
        identityId={deleteId}
        onClose={() => setDeleteId(null)}
        onDeleted={() => setDeleteId(null)}
      />
    </div>
  );
}
