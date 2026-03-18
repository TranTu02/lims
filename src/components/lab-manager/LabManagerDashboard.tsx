import { useLocation } from "react-router-dom";
import { LabManagerApprovals } from "./views/LabManagerApprovals";
import { LabManagerExceptions } from "./views/LabManagerExceptions";
import { LabManagerSamples } from "./views/LabManagerSamples";
import { LabManagerAnalyses } from "./views/LabManagerAnalyses";
import { LabManagerReports } from "./views/LabManagerReports";

export function LabManagerDashboard() {
    const location = useLocation();
    const path = location.pathname;

    // Determine which sub-view to render based on URL
    if (path.startsWith("/manager/exceptions")) return <LabManagerExceptions />;
    if (path.startsWith("/manager/samples")) return <LabManagerSamples />;
    if (path.startsWith("/manager/analyses")) return <LabManagerAnalyses />;
    if (path.startsWith("/manager/reports")) return <LabManagerReports />;

    // Default: approvals
    return <LabManagerApprovals />;
}
