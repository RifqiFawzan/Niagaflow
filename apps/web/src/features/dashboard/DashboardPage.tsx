import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/states";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { DashboardData } from "../../types";

function formatRupiah(value: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => api<DashboardData>("/reports/dashboard"),
  });

  if (isPending) return <LoadingState label="Memuat dashboard..." />;
  if (isError)
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Gagal memuat dashboard."}
        onRetry={() => refetch()}
      />
    );

  const cards = [
    { label: "Produk aktif", value: String(data.totalActiveProducts) },
    { label: "Pesanan hari ini", value: String(data.ordersToday) },
    { label: "Total penjualan (selesai)", value: formatRupiah(data.totalSalesCompleted) },
    { label: "Stok menipis", value: String(data.lowStockCount) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 font-semibold text-slate-700">Pesanan terbaru</h2>
          {data.recentOrders.length === 0 ? (
            <EmptyState title="Belum ada pesanan" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{order.orderNumber}</p>
                    <p className="text-xs text-slate-400">
                      {order.customer?.name ?? "Tanpa pelanggan"} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      {formatRupiah(order.total)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 font-semibold text-slate-700">Peringatan stok menipis</h2>
          {data.lowStock.length === 0 ? (
            <EmptyState title="Semua stok aman" description="Tidak ada produk di bawah batas minimum." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.sku}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      product.stock === 0 ? "text-rose-600" : "text-amber-600"
                    }`}
                  >
                    {product.stock} / min {product.lowStockThreshold}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
