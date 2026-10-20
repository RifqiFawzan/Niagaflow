import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute, RoleGuard } from "./routes/guards";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ProductListPage } from "./features/products/ProductListPage";
import { ProductFormPage } from "./features/products/ProductFormPage";
import { CategoriesPage } from "./features/categories/CategoriesPage";
import { CustomerListPage } from "./features/customers/CustomerListPage";
import { CustomerDetailPage } from "./features/customers/CustomerDetailPage";
import { OrderListPage } from "./features/orders/OrderListPage";
import { OrderCreatePage } from "./features/orders/OrderCreatePage";
import { OrderDetailPage } from "./features/orders/OrderDetailPage";
import { ReportPage } from "./features/reports/ReportPage";

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

        <Route path="/products" element={<ProductListPage />} />
        <Route
          path="/products/new"
          element={
            <RoleGuard role="owner">
              <ProductFormPage />
            </RoleGuard>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <RoleGuard role="owner">
              <ProductFormPage />
            </RoleGuard>
          }
        />

        <Route
          path="/categories"
          element={
            <RoleGuard role="owner">
              <CategoriesPage />
            </RoleGuard>
          }
        />

        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />

        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/new" element={<OrderCreatePage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route
          path="/reports"
          element={
            <RoleGuard role="owner">
              <ReportPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
