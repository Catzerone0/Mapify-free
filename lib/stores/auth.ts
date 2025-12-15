import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthSession {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthStore extends AuthSession {
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  logout: () => {
    set({
      user: null,
      token: null,
      error: null,
    });
  },

  isAuthenticated: () => {
    const { user, token } = get();
    return !!user && !!token;
  },
}));
