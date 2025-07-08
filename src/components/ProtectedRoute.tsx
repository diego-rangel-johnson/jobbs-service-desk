import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSupport?: boolean;
  requireSupervisor?: boolean;
  requireAttendant?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireSupport = false,
  requireSupervisor = false,
  requireAttendant = false
}: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin, isSupport, isSupervisor, isAttendant } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSupport && !isSupport) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSupervisor && !isSupervisor) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAttendant && !isAttendant) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;