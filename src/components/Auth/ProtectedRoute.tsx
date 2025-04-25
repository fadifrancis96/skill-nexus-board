
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { currentUser, currentUserData } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && currentUserData && !requiredRole.includes(currentUserData.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
