import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import type { ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  ownerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "Produk" },
  { to: "/categories", label: "Kategori", ownerOnly: true },
  { to: "/customers", label: "Pelanggan", ownerOnly: true },
  { to: "/orders", label: "Pesanan" },
  { to: "/reports", label: "Laporan", ownerOnly: true },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.ownerOnly || user?.role === "owner");

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2 text-xl font-bold text-blue-700">NiagaFlow</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Topbar({ children }: { children?: ReactNode }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="lg:hidden">
        {/* slot tombol menu mobile dikirim AppLayout */}
        {children}
      </div>
      <div className="hidden text-sm font-medium text-slate-500 lg:block">
        Sistem manajemen pesanan &amp; stok
      </div>
    </header>
  );
}
