import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, errorMessage } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="h-full py-0">
      <CardHeader className="border-border border-b py-5">
        <CardTitle>Produk dengan pendapatan tertinggi</CardTitle>
        <CardDescription>
          Urutan kontribusi penjualan selesai pada rentang terpilih.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-5">
        {isPending ? (
          <Skeleton className="h-64 w-full rounded-[5px]" />
        ) : isError ? (
          <ErrorState
            message={errorMessage(error, "Gagal memuat produk terlaris.")}
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Belum ada penjualan"
            description="Produk terlaris akan tampil setelah ada pesanan selesai."
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#585657"
                  strokeOpacity={0.65}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#b9b9b9" }}
                  tickFormatter={(v: number) => formatRupiah(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#ffffff" }}
                  width={115}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  contentStyle={{
                    borderRadius: 5,
                    fontSize: 12,
                    backgroundColor: "#242226",
                    borderColor: "#8e8e8e",
                    color: "#ffffff",
                  }}
                  labelStyle={{ color: "#b9b9b9", marginBottom: 4 }}
                  itemStyle={{ color: "#8ef5b5" }}
                  formatter={(value, name) =>
                    name === "revenue"
                      ? [formatRupiah(Number(value)), "Pendapatan"]
                      : [String(value ?? 0), "Terjual"]
                  }
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                  isAnimationActive={false}
                >
                  {rows.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={idx === 0 ? "#8ef5b5" : idx === 1 ? "#58c996" : "#24574d"}
                    />
                  ))}
                  <LabelList
                    dataKey="revenue"
                    position="right"
                    formatter={(v) => formatRupiah(Number(v))}
                    style={{ fontSize: 11, fill: "#b9b9b9" }}
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
