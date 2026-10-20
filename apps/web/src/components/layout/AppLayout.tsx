import { useNavigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";

import { Sidebar } from "./Nav";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="bg-muted/40 flex min-h-screen">
      <aside className="bg-background hidden w-60 shrink-0 border-r lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="bg-background absolute inset-y-0 left-0 w-60 shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background flex h-14 items-center gap-3 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Buka menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <span className="text-muted-foreground text-sm font-medium">
            Sistem manajemen pesanan &amp; stok
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm leading-none font-medium">{user?.name}</p>
              <p className="text-muted-foreground text-xs">
                {user?.role === "owner" ? "Pemilik" : "Staf"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut />
              Keluar
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
