"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "./stores/auth";

export function Providers({ children }: { children: ReactNode }) {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage or API
    const initializeAuth = async () => {
      try {
        // Try to restore session from localStorage
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          useAuthStore.setState({
            token: storedToken,
            user: JSON.parse(storedUser),
            isLoading: false,
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize auth", error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setLoading]);

  return <>{children}</>;
}
