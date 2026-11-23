import { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";

import { Sidebar } from "./Nav";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/types";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const closeMobile = () => {
    setMobileOpen(false);
    queueMicrotask(() => menuTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!mobileOpen) return;
    drawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobile();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      <aside
        className={cn(
          "bg-sidebar border-border hidden shrink-0 border-r transition-[width] duration-150 lg:block",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </aside>

      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className="fixed inset-0 z-40 lg:hidden"
        >
          <div
            className="fixed inset-0 bg-black/70"
            onClick={closeMobile}
          />
          <aside className="bg-sidebar border-border relative z-10 flex h-full w-64 flex-col border-r shadow-2xl">
            <div className="border-border flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="bg-primary inline-block size-2.5 rounded-[2px]"
                />
                <span className="text-base font-medium tracking-[-0.02em]">
                  NiagaFlow
                </span>
              </div>
              <Button
                ref={drawerCloseRef}
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tutup menu"
                onClick={closeMobile}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background border-border flex min-h-14 items-center gap-3 border-b px-4 py-2 sm:px-6">
          <Button
            ref={menuTriggerRef}
            type="button"
            variant="secondary"
            size="sm"
            className="lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label="Buka menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" />
            <span>Menu</span>
          </Button>
          <span className="text-muted-foreground hidden truncate font-mono text-xs tracking-[0.01em] uppercase sm:inline">
            Manajemen pesanan &amp; stok
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm leading-tight font-medium text-foreground">
                {user?.name}
              </p>
              <p className="text-muted-foreground font-mono text-[11px] uppercase tracking-[0.02em]">
                {user ? (ROLE_LABELS[user.role] ?? user.role) : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              <span>Keluar</span>
            </Button>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 outline-none sm:p-6 lg:p-8"
        >
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
