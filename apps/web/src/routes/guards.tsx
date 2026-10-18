import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { LoadingState } from "../components/ui/states";
import type { Role } from "../types";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState label="Memeriksa sesi..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

export function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (user && user.role !== role) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
