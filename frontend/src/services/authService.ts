import { apiClient } from "./apiClient";

type AuthPayload = { email: string; password: string };

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export const authService = {
  register(payload: AuthPayload) {
    return apiClient<{ id: number; email: string; is_active: boolean }>("/auth/register", {
      method: "POST",
      body: payload
    });
  },
  login(payload: AuthPayload) {
    return apiClient<TokenResponse>("/auth/login", {
      method: "POST",
      body: payload
    });
  },
  me(token: string) {
    return apiClient<{ id: number; email: string; is_active: boolean }>("/users/me", { token });
  }
};
