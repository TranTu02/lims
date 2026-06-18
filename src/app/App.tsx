import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RouterLayout } from "@/components/layout/RouterLayout";
import { Toaster } from "sonner";

// Import Pages
import { LoginPage } from "@/pages/LoginPage";
import { ReceptionPage } from "@/pages/ReceptionPage";
import { TechnicianPage } from "@/pages/TechnicianPage";
import { EquipmentPage } from "@/pages/EquipmentPage";
import { LabManagerPage } from "@/pages/LabManagerPage";
import { AssignmentPage } from "@/pages/AssignmentPage";
import { HandoverPage } from "@/pages/HandoverPage";
import { StoredSamplesPage } from "@/pages/StoredSamplesPage";
import { LibraryPage } from "@/pages/library/LibraryPage";
import { DocumentPage } from "@/pages/DocumentPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { ParametersPage } from "@/pages/library/ParametersPage";
import { ProtocolsPage } from "@/pages/library/ProtocolsPage";
import { MatricesPage } from "@/pages/library/MatricesPage";
import { SampleTypesPage } from "@/pages/library/SampleTypesPage";
import { ParameterGroupsPage } from "@/pages/library/ParameterGroupsPage";
import { IdentityPage } from "@/pages/IdentityPage";
import { CRMPage } from "@/pages/crm/CRMPage";
import { ChemicalInventoryPage } from "@/pages/inventory/chemical/ChemicalInventoryPage";
import { GeneralInventoryPage } from "@/pages/inventory/general/GeneralInventoryPage";
import { ShipmentPrintPage } from "@/pages/ShipmentPrintPage";

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { user, isGuest, loading } = useAuth();
    const isAuthenticated = !!user || isGuest;
    const uiMode = localStorage.getItem("uiMode");

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">Loading...</div>;

    if (uiMode === "equipment" && window.location.pathname !== "/equipment") {
        return <Navigate to="/equipment" replace />;
    }

    if (!isAuthenticated) {
        if (uiMode === "equipment") {
            return <RouterLayout />;
        }
        return <Navigate to="/login" replace />;
    }

    return <RouterLayout />;
};

import { SerialBalanceProvider } from "@/contexts/SerialBalanceContext";

function App() {
    return (
        <SerialBalanceProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Private Dashboard Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Navigate to="/crm" replace />} />

                            <Route path="/incoming-requests" element={<ReceptionPage defaultTab="incoming-requests" />} />
                            <Route path="/reception" element={<ReceptionPage defaultTab="processing" />} />
                            <Route path="/return-results" element={<ReceptionPage defaultTab="return-results" />} />
                            <Route path="/technician" element={<TechnicianPage />} />
                            <Route path="/equipment" element={<EquipmentPage />} />
                            <Route path="/manager/*" element={<LabManagerPage />} />
                            <Route path="/assignment" element={<AssignmentPage />} />
                            <Route path="/handover" element={<HandoverPage />} />
                            <Route path="/stored-samples" element={<StoredSamplesPage />} />
                            <Route path="/crm" element={<CRMPage />} />

                            <Route path="/library" element={<LibraryPage />}>
                                <Route index element={<Navigate to="parameters" replace />} />

                                <Route path="parameters" element={<ParametersPage />} />
                                <Route path="protocols" element={<ProtocolsPage />} />
                                <Route path="matrices" element={<MatricesPage />} />
                                <Route path="sample-types" element={<SampleTypesPage />} />
                                <Route path="parameter-groups" element={<ParameterGroupsPage />} />
                            </Route>

                            <Route path="/document" element={<DocumentPage />} />
                            <Route path="/inventory" element={<InventoryPage defaultTab="chemicals" />} />
                            <Route path="/chemical-inventory" element={<ChemicalInventoryPage />} />
                            <Route path="/general-inventory" element={<GeneralInventoryPage />} />
                            <Route path="/hr" element={<IdentityPage />} />
                        </Route>

                        {/* Print Routes */}
                        <Route path="/print/shipment/:shipmentId" element={<ShipmentPrintPage />} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <Toaster position="top-right" expand={true} richColors />
                </BrowserRouter>
            </AuthProvider>
        </SerialBalanceProvider>
    );
}

export default App;
