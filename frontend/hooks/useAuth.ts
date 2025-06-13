import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { isAuthenticated, user, isLoading } = useAuthContext();
  const router = useRouter();

  const redirectToLogin = () => {
    router.replace("/login");
  };

  const redirectToMain = () => {
    router.replace("/(tabs)/focus");
  };

  useEffect(() => {
    if (!isLoading) {
      // Auto-redirect logic can be handled here if needed
    }
  }, [isAuthenticated, isLoading]);

  return {
    isAuthenticated,
    user,
    isLoading,
    redirectToLogin,
    redirectToMain,
  };
}
