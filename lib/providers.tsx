"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "./stores/auth";
import { ThemeProvider } from "next-themes";

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
          return;
        }

        // Fallback to cookie-based session
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const payload = data?.data;
          if (payload?.token && payload?.user) {
            localStorage.setItem("auth_token", payload.token);
            localStorage.setItem("auth_user", JSON.stringify(payload.user));

            useAuthStore.setState({
              token: payload.token,
              user: payload.user,
              isLoading: false,
            });
            return;
          }
        }

        setLoading(false);
      } catch {
        // Failed to initialize auth - silently set loading to false
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setLoading]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="mindmap-theme"
    >
      {children}
    </ThemeProvider>
  );
}