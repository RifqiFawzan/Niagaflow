import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { formatDate, formatRupiah, toDateInputValue } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { ORDER_STATUS_LABELS, StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState, LoadingState } from "@/components/ui/states";
import type { OrderStatus, Product, ReportSummary, TopProduct } from "@/types";

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
}

const STAT_ORDER: OrderStatus[] = [
  "pending",
  "processing",
  "completed",
  "cancelled",
];

export function ReportPage() {
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();

  const summary = useQuery({
    queryKey: ["reports", "summary", query],
    queryFn: () => api<ReportSummary>(`/reports/summary?${query}`),
  });

  const topProducts = useQuery({
    queryKey: ["reports", "top-products", query],
    queryFn: () => api<TopProduct[]>(`/reports/top-products?${query}`),
  });

  const lowStock = useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: () => api<Product[]>("/reports/low-stock"),
  });

  const loading = summary.isPending || topProducts.isPending;

  const exportCsv = () => {
    const rows = [["Produk", "SKU", "Jumlah terjual", "Pendapatan"]];
    for (const p of topProducts.data ?? []) {
      rows.push([p.name, p.sku ?? "", String(p.quantitySold), String(p.revenue)]);
    }
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produk-terlaris-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan"
        description="Ringkasan penjualan dan produk terlaris pada rentang tanggal."
      >
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={!topProducts.data?.length}
        >
          <Download />
          Ekspor CSV
        </Button>
      </PageHeader>

      <Card className="py-4">
        <CardContent className="grid gap-3 px-4 sm:grid-cols-2 xl:max-w-xl">
          <div className="space-y-1.5">
            <Label htmlFor="laporan-dari">Dari tanggal</Label>
            <Input
              id="laporan-dari"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="laporan-sampai">Sampai tanggal</Label>
            <Input
              id="laporan-sampai"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState />
      ) : summary.isError ? (
        <ErrorState
          message={errorMessage(summary.error, "Gagal memuat laporan.")}
          onRetry={() => summary.refetch()}
        />
      ) : summary.isSuccess ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  Total penjualan selesai
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {formatRupiah(summary.data.totalSalesCompleted)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDate(summary.data.from)} – {formatDate(summary.data.to)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  Pelanggan baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {summary.data.newCustomers}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Terdaftar pada rentang ini
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Pesanan per status</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Status</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="pr-4 text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STAT_ORDER.map((status) => {
                    const row = summary.data.ordersByStatus[status];
                    return (
                      <TableRow key={status}>
                        <TableCell className="pl-4">
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row?.count ?? 0}
                        </TableCell>
                        <TableCell className="pr-4 text-right tabular-nums">
                          {formatRupiah(row?.total ?? 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Produk terlaris</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {(topProducts.data ?? []).length === 0 ? (
                <p className="text-muted-foreground px-6 py-6 text-sm">
                  Belum ada penjualan selesai pada rentang ini.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Produk</TableHead>
                      <TableHead className="text-right">Terjual</TableHead>
                      <TableHead className="text-right">Pesanan</TableHead>
                      <TableHead className="pr-4 text-right">Pendapatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(topProducts.data ?? []).map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{p.name}</p>
                          {p.sku && (
                            <p className="text-muted-foreground font-mono text-xs">
                              {p.sku}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.quantitySold}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.ordersCount}
                        </TableCell>
                        <TableCell className="pr-4 text-right font-medium tabular-nums">
                          {formatRupiah(p.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card className="py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Stok menipis</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {lowStock.isPending ? (
            <p className="text-muted-foreground px-6 py-6 text-sm">Memuat...</p>
          ) : lowStock.isError ? (
            <p className="text-destructive px-6 py-6 text-sm">
              {errorMessage(lowStock.error, "Gagal memuat stok menipis.")}
            </p>
          ) : (lowStock.data ?? []).length === 0 ? (
            <p className="text-muted-foreground px-6 py-6 text-sm">
              Semua stok produk aman.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Produk</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="pr-4 text-right">Batas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lowStock.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {p.sku}
                      </p>
                    </TableCell>
                    <TableCell className="text-destructive text-right font-medium tabular-nums">
                      {p.stock}
                    </TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">
                      {p.lowStockThreshold}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
