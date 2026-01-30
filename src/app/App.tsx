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
import { LibraryPage } from "@/pages/library/LibraryPage";
import { DocumentPage } from "@/pages/DocumentPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { ParametersPage } from "@/pages/library/ParametersPage";
import { ProtocolsPage } from "@/pages/library/ProtocolsPage";
import { MatricesPage } from "@/pages/library/MatricesPage";
import { SampleTypesPage } from "@/pages/library/SampleTypesPage";
import { ParameterGroupsPage } from "@/pages/library/ParameterGroupsPage";
import { IdentityPage } from "@/pages/IdentityPage";

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user, isGuest, loading } = useAuth();
  const isAuthenticated = !!user || isGuest;

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );

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

            <Route path="/library" element={<LibraryPage />}>
              <Route index element={<Navigate to="parameters" replace />} />

              <Route path="parameters" element={<ParametersPage />} />
              <Route path="protocols" element={<ProtocolsPage />} />
              <Route path="matrices" element={<MatricesPage />} />
              <Route path="sample-types" element={<SampleTypesPage />} />
              <Route
                path="parameter-groups"
                element={<ParameterGroupsPage />}
              />
            </Route>

            <Route path="/document" element={<DocumentPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/hr" element={<IdentityPage />} />
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
