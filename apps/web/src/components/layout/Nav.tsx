import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Produk", icon: Package },
  { to: "/categories", label: "Kategori", icon: Tags, ownerOnly: true },
  { to: "/customers", label: "Pelanggan", icon: Users, ownerOnly: true },
  { to: "/orders", label: "Pesanan", icon: ReceiptText },
  { to: "/reports", label: "Laporan", icon: TrendingUp, ownerOnly: true },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter(
    (item) => !item.ownerOnly || user?.role === "owner"
  );

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-3 px-2 py-1 text-lg font-bold tracking-tight">
        NiagaFlow
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Kompatibilitas: AppLayout baru memakai header sendiri. */
export function Topbar({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-background flex h-14 items-center border-b px-4">
      {children}
    </header>
  );
}
