import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute, RoleGuard } from "./routes/guards";
import { PlaceholderPage } from "./routes/PlaceholderPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<PlaceholderPage title="Produk" issue="ISSUE-011" />} />
        <Route
          path="/categories"
          element={
            <RoleGuard role="owner">
              <PlaceholderPage title="Kategori" issue="ISSUE-011" />
            </RoleGuard>
          }
        />
        <Route
          path="/customers"
          element={
            <RoleGuard role="owner">
              <PlaceholderPage title="Pelanggan" issue="ISSUE-011" />
            </RoleGuard>
          }
        />
        <Route path="/orders" element={<PlaceholderPage title="Pesanan" issue="ISSUE-012" />} />
        <Route
          path="/reports"
          element={
            <RoleGuard role="owner">
              <PlaceholderPage title="Laporan" issue="ISSUE-012" />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
