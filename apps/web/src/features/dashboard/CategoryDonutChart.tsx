import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { api, errorMessage } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { SalesByCategory } from "@/types";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type Props = { from: string; to: string };

/** Donat penjualan per kategori (pedoman §5.5, §10.6). Persentase di tooltip & legend. */
export function CategoryDonutChart({ from, to }: Props) {
  const query = new URLSearchParams({ from, to });
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["reports", "sales-by-category", from, to],
    queryFn: () =>
      api<SalesByCategory>(`/reports/sales-by-category?${query.toString()}`),
  });

  const rows = (data?.categories ?? []).map((c) => ({
    name: c.name,
    revenue: Number(c.revenue),
  }));
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penjualan per kategori</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : isError ? (
          <ErrorState
            message={errorMessage(error, "Gagal memuat penjualan per kategori.")}
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
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                >
                  {rows.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    borderColor: "var(--border)",
                  }}
                  formatter={(value, _name, entry) => {
                    const rev = Number(value);
                    const pct = total > 0 ? Math.round((rev / total) * 100) : 0;
                    return [
                      `${formatRupiah(rev)} (${pct}%)`,
                      String(entry?.name ?? "Kategori"),
                    ];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => String(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
