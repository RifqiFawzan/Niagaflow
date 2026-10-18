import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiRequestError } from "../../lib/api";
import type { User } from "../../types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isPending } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api<User>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<User>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      queryClient.setQueryData(["auth", "me"], data);
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    await api<null>("/auth/logout", { method: "POST" });
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user: user ?? null, isLoading: isPending, login, logout }),
    [user, isPending, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  return ctx;
}

export { ApiRequestError };
