import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Inbox,
  TestTube2,
  Activity,
  Users,
  ArrowRightLeft,
  Archive,
  BookOpen,
  FileText,
  Package,
  Briefcase,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Languages,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/config/theme/ThemeContext";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  sidebarOpen?: boolean;
}

type LucideIcon = ComponentType<{ className?: string }>;

type NavSubItem = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  to: string;
};

type NavItem =
  | {
      type: "item";
      id: string;
      icon: LucideIcon;
      titleKey: string;
      descriptionKey: string;
    }
  | {
      type: "group";
      id: string;
      icon: LucideIcon;
      titleKey: string;
      descriptionKey: string;
      subItems: NavSubItem[];
    };

export function Sidebar({ activeTab, onTabChange, sidebarOpen = true }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("libraries");
  const [language, setLanguageState] = useState(i18n.language?.startsWith("en") ? "en" : "vi");

  const currentView = activeTab;
  const setCurrentView = (id: string) => onTabChange(id);

  const setLanguage = (lang: "vi" | "en") => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
  };

  const navigation: NavItem[] = useMemo(
    () => [
      {
        type: "item",
        id: "reception",
        icon: Inbox,
        titleKey: "nav.receptionTitle",
        descriptionKey: "nav.receptionDescription",
      },
      {
        type: "item",
        id: "technician",
        icon: TestTube2,
        titleKey: "nav.technicianTitle",
        descriptionKey: "nav.technicianDescription",
      },
      {
        type: "item",
        id: "manager",
        icon: Activity,
        titleKey: "nav.managerTitle",
        descriptionKey: "nav.managerDescription",
      },
      {
        type: "item",
        id: "assignment",
        icon: Users,
        titleKey: "nav.assignmentTitle",
        descriptionKey: "nav.assignmentDescription",
      },
      {
        type: "item",
        id: "handover",
        icon: ArrowRightLeft,
        titleKey: "nav.handOverTitle",
        descriptionKey: "nav.handOverDescription",
      },
      {
        type: "item",
        id: "stored-samples",
        icon: Archive,
        titleKey: "nav.storedSamplesTitle",
        descriptionKey: "nav.storedSamplesDescription",
      },
      {
        type: "item",
        id: "analyses",
        icon: TestTube2,
        titleKey: "nav.analysesTitle",
        descriptionKey: "nav.analysesDescription",
      },
      {
        type: "group",
        id: "libraries",
        icon: BookOpen,
        titleKey: "nav.libraryTitle",
        descriptionKey: "nav.libraryDescription",
        subItems: [
          {
            id: "library-parameters",
            titleKey: "nav.parameterTitle",
            descriptionKey: "nav.parameterDescription",
            to: "/library/parameters",
          },
          {
            id: "library-protocols",
            titleKey: "nav.protocolsTitle",
            descriptionKey: "nav.protocolsDescription",
            to: "/library/protocols",
          },
          {
            id: "library-matrices",
            titleKey: "nav.matricesTitle",
            descriptionKey: "nav.matricesDescription",
            to: "/library/matrices",
          },
          {
            id: "library-sample-types",
            titleKey: "nav.sampleTypesTitle",
            descriptionKey: "nav.sampleTypesDescription",
            to: "/library/sample-types",
          },
          {
            id: "library-parameter-groups",
            titleKey: "nav.parameterGroupsTitle",
            descriptionKey: "nav.parameterGroupsDescription",
            to: "/library/parameter-groups",
          },
        ],
      },
      {
        type: "item",
        id: "document",
        icon: FileText,
        titleKey: "nav.documentTitle",
        descriptionKey: "nav.documentDescription",
      },
      {
        type: "item",
        id: "inventory",
        icon: Package,
        titleKey: "nav.inventoryTitle",
        descriptionKey: "nav.inventoryDescription",
      },
      {
        type: "item",
        id: "crm",
        icon: Briefcase,
        titleKey: "nav.crmTitle",
        descriptionKey: "nav.crmDescription",
      },
      {
        type: "item",
        id: "hr",
        icon: Briefcase,
        titleKey: "nav.hrTitle",
        descriptionKey: "nav.hrDescription",
      },
    ],
    [],
  );

  // Update expanded group if active tab is in a subgroup
  useEffect(() => {
    const parentGroup = navigation.find(
      (item): item is Extract<NavItem, { type: "group" }> =>
        item.type === "group" && item.subItems.some((sub) => sub.id === activeTab),
    );
    if (parentGroup) setExpandedGroup(parentGroup.id);
  }, [activeTab, navigation]);

  return (
    <aside
      className={`${
        sidebarOpen ? (sidebarCollapsed ? "w-16" : "w-64") : "w-0"
      } bg-background border-r border-border transition-all duration-300 overflow-hidden flex flex-col`}
    >
      {!sidebarCollapsed ? (
        <>
          {/* Expanded Sidebar */}
          <div className="p-3 border-b border-border flex items-center justify-between h-16">
            <div className="flex items-center gap-2 overflow-hidden">
              <LayoutDashboard className="h-6 w-6 text-primary shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{t("nav.sidebar.title")}</h1>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{t("nav.sidebar.description")}</p>
              </div>
            </div>

            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 hover:bg-muted rounded transition-colors shrink-0"
              title={t("nav.sidebar.collapse")}
              type="button"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.type === "group") {
                const isParentActive = item.subItems.some((sub) => sub.id === currentView);
                const isExpanded = expandedGroup === item.id;

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : item.id)}
                      className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isParentActive && !isExpanded ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                      type="button"
                    >
                      <Icon
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          isParentActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t(item.titleKey)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{t(item.descriptionKey)}</div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="ml-3 mt-0.5 space-y-0.5 pl-2">
                        {item.subItems.map((subItem) => {
                          const isSubActive = currentView === subItem.id;

                          return (
                            <button
                              key={subItem.id}
                              onClick={() => setCurrentView(subItem.id)}
                              className={`w-full flex items-start gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                                isSubActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-foreground hover:bg-muted"
                              }`}
                              type="button"
                            >
                              <div className="text-left min-w-0">
                                <div className="text-sm font-medium truncate">{t(subItem.titleKey)}</div>
                                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {t(subItem.descriptionKey)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                  }`}
                  type="button"
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t(item.titleKey)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{t(item.descriptionKey)}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="p-3 border-t border-border space-y-2 shrink-0">
            {/* Language */}
            <div>
              <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Languages className="h-3 w-3" />
                {t("nav.sidebar.language")}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setLanguage("vi")}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    language === "vi"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                  type="button"
                >
                  {t("nav.sidebar.langVi")}
                </button>

                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    language === "en"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                  type="button"
                >
                  {t("nav.sidebar.langEn")}
                </button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Sun className="h-3 w-3" />
                {t("nav.sidebar.theme")}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                    theme === "light"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                  type="button"
                >
                  <Sun className="h-3 w-3" />
                  <span className="text-xs">{t("nav.sidebar.themeLight")}</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                    theme === "dark"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                  type="button"
                >
                  <Moon className="h-3 w-3" />
                  <span className="text-xs">{t("nav.sidebar.themeDark")}</span>
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                    theme === "system"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                  type="button"
                >
                  <Monitor className="h-3 w-3" />
                  <span className="text-xs">{t("nav.sidebar.themeSystem")}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Collapsed Sidebar */}
          <div className="p-2 border-b border-border flex flex-col items-center gap-2 h-16 justify-center">
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-lg">L</span>
            </div>

            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title={t("nav.sidebar.expand")}
              type="button"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.type === "group") {
                const isAnySubActive = item.subItems.some((sub) => sub.id === currentView);
                const isExpanded = expandedGroup === item.id;

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : item.id)}
                      className={`w-full p-2 rounded-lg transition-colors flex items-center justify-center ${
                        isAnySubActive ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                      title={t(item.titleKey)}
                      type="button"
                    >
                      <Icon className={`h-5 w-5 ${isAnySubActive ? "text-primary" : "text-muted-foreground"}`} />
                    </button>

                    {isExpanded &&
                      item.subItems.map((subItem) => {
                        const isSubActive = currentView === subItem.id;
                        const firstLetter = t(subItem.titleKey).charAt(0).toUpperCase();

                        return (
                          <button
                            key={subItem.id}
                            onClick={() => setCurrentView(subItem.id)}
                            className={`w-full p-1.5 rounded transition-colors flex items-center justify-center text-xs font-medium ${
                              isSubActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            title={t(subItem.titleKey)}
                            type="button"
                          >
                            {firstLetter}
                          </button>
                        );
                      })}
                  </div>
                );
              }

              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full p-2 rounded-lg transition-colors flex items-center justify-center ${
                    isActive ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  title={t(item.titleKey)}
                  type="button"
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </button>
              );
            })}
          </nav>

          <div className="p-2 border-t border-border flex flex-col items-center gap-1 shrink-0">
            <button
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title={t("nav.sidebar.language")}
              onClick={() => setLanguage(language === "en" ? "vi" : "en")}
              type="button"
            >
              <Languages className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title={t("nav.sidebar.theme")}
              onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
              type="button"
            >
              {theme === "light" && <Sun className="h-4 w-4 text-muted-foreground" />}
              {theme === "dark" && <Moon className="h-4 w-4 text-muted-foreground" />}
              {theme === "system" && <Monitor className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
