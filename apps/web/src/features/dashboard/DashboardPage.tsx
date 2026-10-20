import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Package,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { DashboardData } from "@/types";

const CARD_ICONS = [Package, ReceiptText, Wallet, AlertTriangle];

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => api<DashboardData>("/reports/dashboard"),
  });

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Ringkasan operasional harian." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Ringkasan operasional harian." />
        <ErrorState
          message={errorMessage(error, "Gagal memuat dashboard.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const cards = [
    { label: "Produk aktif", value: String(data.totalActiveProducts), hint: "di katalog" },
    { label: "Pesanan hari ini", value: String(data.ordersToday), hint: "sejak 00:00" },
    {
      label: "Total penjualan",
      value: formatRupiah(data.totalSalesCompleted),
      hint: "pesanan selesai",
    },
    {
      label: "Stok menipis",
      value: String(data.lowStockCount),
      hint: data.lowStockCount > 0 ? "perlu restock" : "semua aman",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Ringkasan operasional harian." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = CARD_ICONS[i];
          return (
            <Card key={card.label} className="py-5">
              <CardContent className="px-5">
                <div className="flex items-start justify-between">
                  <p className="text-muted-foreground text-sm">{card.label}</p>
                  <Icon className="text-muted-foreground size-4" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                  {card.value}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pesanan terbaru</CardTitle>
            <CardDescription>10 pesanan terakhir.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {data.recentOrders.length === 0 ? (
              <div className="px-6">
                <EmptyState
                  title="Belum ada pesanan"
                  description="Pesanan baru akan muncul di sini."
                />
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {data.recentOrders.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-3 px-6 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tabular-nums">
                        {order.orderNumber}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {order.customer?.name ?? "Tanpa pelanggan"} ·{" "}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm tabular-nums">
                        {formatRupiah(order.total)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peringatan stok menipis</CardTitle>
            <CardDescription>
              Produk pada atau di bawah batas minimum.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {data.lowStock.length === 0 ? (
              <div className="px-6">
                <EmptyState
                  title="Semua stok aman"
                  description="Tidak ada produk di bawah batas minimum."
                />
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {data.lowStock.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 px-6 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-xs">
                        {product.sku}
                      </p>
                    </div>
                    <span
                      className={
                        product.stock === 0
                          ? "text-destructive shrink-0 text-sm font-semibold tabular-nums"
                          : "shrink-0 text-sm font-semibold text-amber-600 tabular-nums"
                      }
                    >
                      {product.stock} / min {product.lowStockThreshold}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-6 pt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/products">Kelola produk</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
