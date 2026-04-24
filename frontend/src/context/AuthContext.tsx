import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { authService } from "../services/authService";

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "mailscope_access_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      async login(email: string, password: string) {
        const response = await authService.login({ email, password });
        setToken(response.access_token);
      },
      async register(email: string, password: string) {
        await authService.register({ email, password });
        const response = await authService.login({ email, password });
        setToken(response.access_token);
      },
      logout() {
        setToken(null);
      }
    }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
