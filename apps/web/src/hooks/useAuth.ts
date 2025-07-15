import { useAuth as useAuthContext } from "@/lib/auth-context";

/**
 * Legacy useAuth hook - now uses the centralized AuthContext
 * This prevents multiple auth listeners and reduces console noise
 */
export function useAuth() {
  const { user, loading, isInitialized } = useAuthContext();

  return {
    user,
    loading: loading || !isInitialized,
    isInitialized,
  };
}