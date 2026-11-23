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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { SalesByCategory } from "@/types";

const COLORS = [
  "#8ef5b5",
  "#58c996",
  "#24574d",
  "#b9b9b9",
  "#8e8e8e",
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
    <Card className="h-full py-0">
      <CardHeader className="border-border border-b py-5">
        <CardTitle>Porsi pendapatan per kategori</CardTitle>
        <CardDescription>
          Perbandingan omzet antar kategori produk.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-5">
        {isPending ? (
          <Skeleton className="h-64 w-full rounded-[5px]" />
        ) : isError ? (
          <ErrorState
            message={errorMessage(error, "Gagal memuat penjualan per kategori.")}
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Belum ada penjualan"
            description="Porsi kategori akan tampil setelah ada pesanan selesai."
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
                  outerRadius={74}
                  paddingAngle={2}
                  stroke="#1e1c20"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {rows.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 5,
                    fontSize: 12,
                    backgroundColor: "#242226",
                    borderColor: "#8e8e8e",
                    color: "#ffffff",
                  }}
                  itemStyle={{ color: "#8ef5b5" }}
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
                  wrapperStyle={{ fontSize: 12, color: "#b9b9b9" }}
                  formatter={(value) => (
                    <span style={{ color: "#b9b9b9" }}>{String(value)}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
