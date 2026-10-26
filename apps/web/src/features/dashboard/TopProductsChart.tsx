import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, errorMessage } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { TopProduct } from "@/types";

type Props = { from: string; to: string };

/** Batang horizontal produk terlaris (pedoman §6.2): diurutkan revenue desc,
 * pendapatan ditampilkan di ujung kanan tiap batang. */
export function TopProductsChart({ from, to }: Props) {
  const query = new URLSearchParams({ from, to });
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["reports", "top-products", from, to],
    queryFn: () => api<TopProduct[]>(`/reports/top-products?${query.toString()}`),
  });

  const rows = (data ?? []).map((p) => ({
    name: p.name,
    revenue: Number(p.revenue),
    quantitySold: p.quantitySold,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produk terlaris</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : isError ? (
          <ErrorState
            message={errorMessage(error, "Gagal memuat produk terlaris.")}
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Belum ada penjualan"
            description="Pesanan selesai pada rentang ini akan muncul sebagai grafik."
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatRupiah(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    borderColor: "var(--border)",
                  }}
                  formatter={(value, name) =>
                    name === "revenue"
                      ? [formatRupiah(Number(value)), "Pendapatan"]
                      : [String(value ?? 0), "Terjual"]
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                >
                  <LabelList
                    dataKey="revenue"
                    position="right"
                    formatter={(v) => formatRupiah(Number(v))}
                    style={{ fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
