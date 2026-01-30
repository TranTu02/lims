import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";

type TabKey =
  | "reception"
  | "technician"
  | "manager"
  | "assignment"
  | "handover"
  | "stored-samples"
  | "document"
  | "inventory"
  | "crm"
  | "hr"
  | "library-parameters"
  | "library-protocols"
  | "library-matrices"
  | "library-sample-types"
  | "library-parameter-groups";

type TabInfo = { title: string; description: string };

function getTabFromPath(pathname: string): TabKey {
  if (pathname.startsWith("/library")) {
    if (pathname.startsWith("/library/protocols")) return "library-protocols";
    if (pathname.startsWith("/library/matrices")) return "library-matrices";
    if (pathname.startsWith("/library/sample-types")) return "library-sample-types";
    if (pathname.startsWith("/library/parameter-groups")) return "library-parameter-groups";
    return "library-parameters";
  }

  switch (pathname) {
    case "/reception":
      return "reception";
    case "/technician":
      return "technician";
    case "/manager":
      return "manager";
    case "/assignment":
      return "assignment";
    case "/handover":
      return "handover";
    case "/stored-samples":
      return "stored-samples";
    case "/document":
      return "document";
    case "/inventory":
      return "inventory";
    case "/crm":
      return "crm";
    case "/hr":
      return "hr";
    default:
      return "reception";
  }
}

function getRouteFromTab(tab: TabKey): string {
  switch (tab) {
    case "library-parameters":
      return "/library/parameters";
    case "library-protocols":
      return "/library/protocols";
    case "library-matrices":
      return "/library/matrices";
    case "library-sample-types":
      return "/library/sample-types";
    case "library-parameter-groups":
      return "/library/parameter-groups";
    default:
      return `/${tab}`;
  }
}

export function RouterLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const activeTab = useMemo<TabKey>(
    () => getTabFromPath(location.pathname),
    [location.pathname],
  );

  const TAB_INFO = useMemo<Record<TabKey, TabInfo>>(
    () => ({
      reception: {
        title: t("nav.receptionTitle"),
        description: t("nav.receptionDescription"),
      },
      technician: {
        title: t("nav.technicianTitle"),
        description: t("nav.technicianDescription"),
      },
      manager: {
        title: t("nav.managerTitle"),
        description: t("nav.managerDescription"),
      },
      assignment: {
        title: t("nav.assignmentTitle"),
        description: t("nav.assignmentDescription"),
      },
      handover: {
        title: t("nav.handOverTitle"),
        description: t("nav.handOverDescription"),
      },
      "stored-samples": {
        title: t("nav.storedSamplesTitle"),
        description: t("nav.storedSamplesDescription"),
      },

      "library-parameters": {
        title: t("nav.parameterTitle"),
        description: t("nav.parameterDescription"),
      },
      "library-protocols": {
        title: t("nav.protocolsTitle"),
        description: t("nav.protocolsDescription"),
      },
      "library-matrices": {
        title: t("nav.matricesTitle"),
        description: t("nav.matricesDescription"),
      },
      "library-sample-types": {
        title: t("nav.sampleTypesTitle"),
        description: t("nav.sampleTypesDescription"),
      },
      "library-parameter-groups": {
        title: t("nav.parameterGroupsTitle"),
        description: t("nav.parameterGroupsDescription"),
      },

      document: {
        title: t("nav.documentTitle"),
        description: t("nav.documentDescription"),
      },
      inventory: {
        title: t("nav.inventoryTitle"),
        description: t("nav.inventoryDescription"),
      },
      crm: {
        title: t("nav.crmTitle"),
        description: t("nav.crmDescription"),
      },
      hr: {
        title: t("nav.hrTitle"),
        description: t("nav.hrDescription"),
      },
    }),
    [t],
  );

  const info =
    TAB_INFO[activeTab] ??
    ({
      title: t("nav.dashboard.title"),
      description: t("nav.dashboard.description"),
    } satisfies TabInfo);

  const handleTabChange = (tab: string) => {
    const next = tab as TabKey;
    navigate(getRouteFromTab(next));
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      title={info.title}
      description={info.description}
    >
      <Outlet />
    </Layout>
  );
}
