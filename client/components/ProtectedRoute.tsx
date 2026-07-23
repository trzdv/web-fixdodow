import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getStoredAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const authState = getStoredAuth();

  if (!authState?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
