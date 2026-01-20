import { LayoutDashboard, Users, FileText, FlaskConical, Settings, Package, Truck, Wallet } from "lucide-react";

export type NavItem = {
    title: string;
    href: string;
    icon?: any; // LucideIcon type
    children?: NavItem[];
    permissions?: string[]; // RBAC roles required
};

export const MAIN_NAV: NavItem[] = [
    {
        title: "sidebar.dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "sidebar.orders",
        href: "/orders",
        icon: FileText,
        children: [
            { title: "order.management", href: "/orders" },
            { title: "order.create", href: "/orders/create" },
        ],
    },
    {
        title: "sidebar.samples",
        href: "/samples",
        icon: FlaskConical,
        children: [
            { title: "reception.title", href: "/reception" },
            { title: "lab.analysis", href: "/analysis" },
            { title: "lab.results", href: "/results" },
        ],
    },
    {
        title: "sidebar.clients",
        href: "/clients",
        icon: Users,
    },
    {
        title: "sidebar.inventory",
        href: "/inventory",
        icon: Package,
    },
    {
        title: "sidebar.accounting",
        href: "/accounting",
        icon: Wallet,
    },
    {
        title: "sidebar.settings",
        href: "/settings",
        icon: Settings,
        children: [
            { title: "library.matrices.matrixId", href: "/settings/matrices" }, // Example key usage
            { title: "library.parameters.parameterName", href: "/settings/parameters" },
            { title: "identity.identities.roles", href: "/settings/users" },
        ],
    },
];
