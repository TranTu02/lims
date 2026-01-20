import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Layout } from "./Layout";
import { useEffect, useState } from "react";

// Map Routes to Tab Keys (ensure these match Sidebar keys)
const ROUTE_TO_TAB: Record<string, string> = {
    "/reception": "reception",
    "/technician": "technician",
    "/manager": "manager",
    "/assignment": "assignment",
    "/handover": "handover",
    "/stored-samples": "stored-samples",
    "/library": "library",
    "/protocols": "protocols",
    "/document": "document",
    "/inventory": "inventory",
    "/hr": "hr",
};

const TAB_INFO: Record<string, { title: string; description: string }> = {
    reception: { title: "Tiếp nhận mẫu", description: "Quản lý phiếu tiếp nhận và mẫu" },
    technician: { title: "KTV Workspace", description: "Công việc kiểm nghiệm viên" },
    manager: { title: "Quản lý Lab", description: "Duyệt kết quả & quản lý đầu ra" },
    assignment: { title: "Phân công KTV", description: "Phân công kiểm nghiệm viên" },
    handover: { title: "Bàn giao", description: "Bàn giao mẫu và phép thử" },
    "stored-samples": { title: "Mẫu lưu", description: "Quản lý mẫu đã lưu trữ" },
    library: { title: "Thư viện chỉ tiêu", description: "Danh sách chỉ tiêu" },
    protocols: { title: "Thư viện phương pháp", description: "Danh sách phương pháp" },
    document: { title: "Tài liệu", description: "Quản lý tài liệu" },
    inventory: { title: "Kho & Tài sản", description: "Hóa chất, thiết bị, vật tư" },
    hr: { title: "Quản lý Nhân sự", description: "Quản lý thông tin nhân sự" },
};

export function RouterLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("reception");

    useEffect(() => {
        // Find tab that matches current path (simple check)
        const path = location.pathname;
        const matchedTab = ROUTE_TO_TAB[path] || "reception";
        setActiveTab(matchedTab);
    }, [location]);

    const handleTabChange = (tab: string) => {
        // Find route for tab
        const route = Object.keys(ROUTE_TO_TAB).find((key) => ROUTE_TO_TAB[key] === tab);
        if (route) {
            navigate(route);
        } else {
            // Fallback or external link
            console.warn("No route found for tab:", tab);
        }
    };

    const info = TAB_INFO[activeTab] || { title: "Dashboard", description: "Hệ thống LIMS" };

    return (
        <Layout activeTab={activeTab} onTabChange={handleTabChange} title={info.title} description={info.description}>
            <Outlet />
        </Layout>
    );
}
