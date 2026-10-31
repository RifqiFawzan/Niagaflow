import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Tags,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Sembunyikan dari peran di luar daftar (otorisasi tetap di backend). */
  roles?: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Produk", icon: Package },
  {
    to: "/categories",
    label: "Kategori",
    icon: Tags,
    roles: ["owner", "stock_manager"],
  },
  { to: "/customers", label: "Pelanggan", icon: Users },
  { to: "/orders", label: "Pesanan", icon: ReceiptText },
  { to: "/reports", label: "Laporan", icon: TrendingUp, roles: ["owner"] },
  {
    to: "/users",
    label: "Pengguna",
    icon: UserCog,
    roles: ["owner", "admin"],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || (user ? item.roles.includes(user.role) : false)
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
