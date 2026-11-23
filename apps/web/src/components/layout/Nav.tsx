import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Tags,
  TrendingUp,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Sembunyikan dari peran di luar daftar (otorisasi tetap di backend). */
  roles?: Role[];
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "HARIAN",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/orders", label: "Pesanan", icon: ReceiptText },
    ],
  },
  {
    heading: "KATALOG",
    items: [
      { to: "/products", label: "Produk", icon: Package },
      {
        to: "/categories",
        label: "Kategori",
        icon: Tags,
        roles: ["owner", "stock_manager"],
      },
    ],
  },
  {
    heading: "TOKO",
    items: [
      { to: "/reports", label: "Laporan", icon: TrendingUp, roles: ["owner"] },
      {
        to: "/users",
        label: "Pengguna",
        icon: UserCog,
        roles: ["owner", "admin"],
      },
    ],
  },
];

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || (user ? item.roles.includes(user.role) : false)
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Navigasi utama" className="flex h-full flex-col p-3">
      <div
        className={cn(
          "mb-4 flex h-9 items-center",
          collapsed ? "justify-center" : "justify-between px-2"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="bg-primary inline-block size-2.5 rounded-[2px]"
            />
            <span className="text-[17px] font-medium tracking-[-0.02em] text-foreground">
              NiagaFlow
            </span>
          </div>
        )}
        {onToggleCollapse && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="size-8"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-5">
        {groups.map((group) => (
          <div key={group.heading} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 font-mono text-[11px] font-medium tracking-[0.04em] text-[#8e8e8e] uppercase">
                {group.heading}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    "group flex min-h-11 sm:min-h-10 items-center rounded-[5px] text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    collapsed ? "justify-center px-2" : "gap-2.5 px-3",
                    isActive
                      ? "bg-[#262428] text-foreground border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground border-l-2 border-transparent"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
