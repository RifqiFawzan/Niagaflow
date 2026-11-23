import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Package,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
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
import { SalesTrendChart } from "./SalesTrendChart";
import { TopProductsChart } from "./TopProductsChart";
import { CategoryDonutChart } from "./CategoryDonutChart";
import { buildRange, type RangeDays } from "./period";
import type { DashboardData } from "@/types";

export function DashboardPage() {
  const { user } = useAuth();
  const [days, setDays] = useState<RangeDays>(30);
  const { from, to } = buildRange(days);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => api<DashboardData>("/reports/dashboard"),
  });

  if (isPending) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <PageHeader
          title="Dashboard"
          description="Ringkasan operasional dan stok hari ini."
        />
        <span className="sr-only">Memuat ringkasan dashboard...</span>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Skeleton className="h-36 rounded-[5px] lg:col-span-5" />
          <Skeleton className="h-36 rounded-[5px] lg:col-span-7" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <Skeleton className="h-72 rounded-[5px] xl:col-span-7" />
          <Skeleton className="h-72 rounded-[5px] xl:col-span-5" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Ringkasan operasional dan stok hari ini."
        />
        <ErrorState
          message={errorMessage(error, "Gagal memuat dashboard.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const operationalStats = [
    {
      label: "Pesanan hari ini",
      value: String(data.ordersToday),
      hint: "sejak 00:00",
      icon: ReceiptText,
      tone: "default" as const,
    },
    {
      label: "Produk aktif",
      value: String(data.totalActiveProducts),
      hint: "di katalog",
      icon: Package,
      tone: "default" as const,
    },
    {
      label: "Stok menipis",
      value: String(data.lowStockCount),
      hint: data.lowStockCount > 0 ? "perlu restock" : "semua aman",
      icon: AlertTriangle,
      tone: data.lowStockCount > 0 ? ("warning" as const) : ("ok" as const),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional dan stok hari ini."
      >
        <Button asChild variant="outline">
          <Link to="/orders">Semua pesanan</Link>
        </Button>
        <Button asChild>
          <Link to="/orders/new">
            <Plus aria-hidden="true" />
            Pesanan baru
          </Link>
        </Button>
      </PageHeader>

      <section
        aria-label="Ringkasan utama"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <Card
          className="relative overflow-hidden py-5 lg:col-span-5"
          style={{
            background:
              "linear-gradient(170deg, rgba(36, 87, 77, 0.45) 0%, rgba(30, 28, 32, 0.96) 100%)",
          }}
        >
          <CardContent className="flex h-full flex-col justify-between px-6">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium tracking-[0.02em] text-primary uppercase">
                Total penjualan selesai
              </span>
              <Wallet aria-hidden="true" className="text-primary size-4" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-medium tracking-[-0.03em] text-foreground tabular-nums sm:text-4xl">
                {formatRupiah(data.totalSalesCompleted)}
              </p>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Akumulasi seluruh pesanan berstatus selesai
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 lg:col-span-7">
          <CardContent className="divide-border grid h-full grid-cols-1 divide-y px-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {operationalStats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col justify-between px-6 py-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-sm">{item.label}</p>
                    <Icon
                      aria-hidden="true"
                      className={
                        item.tone === "warning"
                          ? "text-warning-text size-4 shrink-0"
                          : item.tone === "ok"
                            ? "text-primary size-4 shrink-0"
                            : "text-muted-foreground size-4 shrink-0"
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-medium tracking-[-0.03em] text-foreground tabular-nums">
                      {item.value}
                    </p>
                    <p
                      className={
                        item.tone === "warning"
                          ? "text-warning-text mt-1 font-mono text-xs uppercase tracking-[0.01em]"
                          : item.tone === "ok"
                            ? "text-primary mt-1 font-mono text-xs uppercase tracking-[0.01em]"
                            : "text-muted-foreground mt-1 font-mono text-xs uppercase tracking-[0.01em]"
                      }
                    >
                      {item.hint}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {user?.role === "owner" && (
        <SalesTrendChart
          days={days}
          onDaysChange={setDays}
          from={from}
          to={to}
        />
      )}

      {user?.role === "owner" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <TopProductsChart from={from} to={to} />
          </div>
          <div className="xl:col-span-5">
            <CategoryDonutChart from={from} to={to} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="py-0 xl:col-span-7">
          <CardHeader className="border-border flex flex-row items-center justify-between border-b py-5">
            <div>
              <CardTitle>Pesanan terbaru</CardTitle>
              <CardDescription className="mt-1">
                5 transaksi terakhir yang masuk.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/orders">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {data.recentOrders.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada pesanan"
                  description="Buat pesanan pertama agar aktivitas transaksi tercatat di sini."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link to="/orders/new">Buat pesanan</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {data.recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/orders/${order.id}`}
                      className="hover:bg-surface-elevated/40 focus-visible:ring-ring flex min-h-14 items-center justify-between gap-3 px-6 py-3.5 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-medium text-foreground tabular-nums">
                          {order.orderNumber}
                        </p>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-medium text-foreground tabular-nums">
                          {formatRupiah(order.total)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="py-0 xl:col-span-5">
          <CardHeader className="border-border flex flex-row items-center justify-between border-b py-5">
            <div>
              <CardTitle>Peringatan stok menipis</CardTitle>
              <CardDescription className="mt-1">
                Produk pada atau di bawah batas minimum.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/products">Kelola produk</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 py-0">
            {data.lowStock.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Semua stok aman"
                  description="Belum ada produk yang menyentuh batas stok minimum."
                />
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {data.lowStock.map((product) => {
                  const isOut = product.stock === 0;
                  return (
                    <li
                      key={product.id}
                      className="flex min-h-14 items-center justify-between gap-3 px-6 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                          {product.sku}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={
                            isOut
                              ? "text-destructive-text text-sm font-medium tabular-nums"
                              : "text-warning-text text-sm font-medium tabular-nums"
                          }
                        >
                          {product.stock} / min {product.lowStockThreshold}
                        </p>
                        <p
                          className={
                            isOut
                              ? "text-destructive-text font-mono text-[11px] uppercase"
                              : "text-warning-text font-mono text-[11px] uppercase"
                          }
                        >
                          {isOut ? "Habis" : "Menipis"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
