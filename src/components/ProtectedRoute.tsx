import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const SETTINGS_PATH = '/settings';
const PAYMENT_SUCCESS_PATH = '/payment-success';

/** Protects routes that require authentication. Redirects to / if not logged in.
 * When trial has expired (no paid subscription), only the subscription page is allowed — redirect to /settings. */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { trialExpired, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();
  const pathname = location.pathname;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)' }}>
        <div className="text-center" style={{ color: 'var(--landing-primary)' }}>
          <div className="h-16 w-16 mx-auto mb-4 rounded-full border-4 border-current border-t-transparent animate-spin" />
          <p className="font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!subscriptionLoading && trialExpired && pathname !== SETTINGS_PATH && pathname !== PAYMENT_SUCCESS_PATH) {
    return <Navigate to={SETTINGS_PATH} replace state={{ trialExpiredRedirect: true }} />;
  }

  return <>{children}</>;
};
