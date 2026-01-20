import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RouterLayout } from "@/components/layout/RouterLayout";
import { Toaster } from "sonner";

// Import Pages
import { LoginPage } from "@/pages/LoginPage";
import { ReceptionPage } from "@/pages/ReceptionPage";
import { TechnicianPage } from "@/pages/TechnicianPage";
import { LabManagerPage } from "@/pages/LabManagerPage";
import { AssignmentPage } from "@/pages/AssignmentPage";
import { HandoverPage } from "@/pages/HandoverPage";
import { StoredSamplesPage } from "@/pages/StoredSamplesPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { DocumentPage } from "@/pages/DocumentPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { HRPage } from "@/pages/HRPage";

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { user, isGuest, loading } = useAuth();
    const isAuthenticated = !!user || isGuest;

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <RouterLayout />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Private Dashboard Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Navigate to="/reception" replace />} />

                        <Route path="/reception" element={<ReceptionPage />} />
                        <Route path="/technician" element={<TechnicianPage />} />
                        <Route path="/manager" element={<LabManagerPage />} />
                        <Route path="/assignment" element={<AssignmentPage />} />
                        <Route path="/handover" element={<HandoverPage />} />
                        <Route path="/stored-samples" element={<StoredSamplesPage />} />

                        {/* Library with props */}
                        <Route path="/library" element={<LibraryPage viewType="parameters" />} />
                        <Route path="/protocols" element={<LibraryPage viewType="protocols" />} />

                        <Route path="/document" element={<DocumentPage />} />
                        <Route path="/inventory" element={<InventoryPage />} />
                        <Route path="/hr" element={<HRPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster position="top-right" expand={true} richColors />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
