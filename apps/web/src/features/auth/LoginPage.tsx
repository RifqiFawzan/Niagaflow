import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
    <main
      className="bg-background text-foreground flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage:
          "linear-gradient(170deg, rgba(36, 87, 77, 0.28) 0%, rgba(21, 19, 22, 0) 45%)",
      }}
    >
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="bg-primary inline-block size-3 rounded-[3px]"
            />
            <span className="font-mono text-xs font-medium tracking-[0.03em] text-primary uppercase">
              NiagaFlow
            </span>
          </div>
          <div>
            <CardTitle as="h1" className="text-2xl font-medium tracking-[-0.03em]">
              Masuk ke akun
            </CardTitle>
            <CardDescription className="mt-1">
              Kelola pesanan, stok, dan laporan usahamu.
            </CardDescription>
          </div>
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
                placeholder="Masukkan password"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="border-destructive-text/40 bg-destructive/15 text-destructive-text rounded-[5px] border px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 aria-hidden="true" className="animate-spin" />}
              {busy ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="border-border mt-6 space-y-2.5 border-t pt-5">
            <p className="text-muted-foreground text-center font-mono text-xs uppercase tracking-[0.02em]">
              Akun demo: klik untuk mengisi
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
