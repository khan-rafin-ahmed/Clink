import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { FullScreenLoader } from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect flag when location changes
    hasRedirectedRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (loading || hasRedirectedRef.current) return;

    if (requireAuth && !user) {
      // Store current location for redirect after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
      hasRedirectedRef.current = true;
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo, requireAuth, location]);

  // Show loading state
  if (loading) {
    return <FullScreenLoader text="Authenticating..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-foreground">Authentication Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render anything
  // (navigation will happen in useEffect)
  if (requireAuth && !user) {
    return null;
  }

  // If auth is not required or user is authenticated, render children
  return <>{children}</>;
}