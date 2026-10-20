import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole } from "lucide-react";
import { useAuth, ApiRequestError } from "./AuthContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isLoading && user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname;
    return <Navigate to={from ?? "/dashboard"} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: { pathname: string } } | null)
        ?.from?.pathname;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Login gagal, coba lagi."
      );
    } finally {
      setBusy(false);
    }
  };

  const prefill = (role: "owner" | "staff") => {
    setEmail(`${role}@niagaflow.test`);
    setPassword(import.meta.env.VITE_DEMO_PASSWORD ?? "password123");
    setError(null);
  };

  return (
    <main className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 flex size-10 items-center justify-center rounded-lg">
            <LockKeyhole className="size-5" />
          </div>
          <CardTitle className="text-xl">Masuk ke NiagaFlow</CardTitle>
          <CardDescription>
            Kelola pesanan, stok, dan laporan usahamu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <p className="text-muted-foreground text-center text-xs">
              Akun demo — klik untuk mengisi otomatis
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => prefill("owner")}
              >
                Pemilik
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => prefill("staff")}
              >
                Staf
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
