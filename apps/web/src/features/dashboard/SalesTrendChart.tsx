import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, errorMessage } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { RANGES, shortLabel, type RangeDays } from "./period";
import type { SalesTrend } from "@/types";

type Props = {
  days: RangeDays;
  onDaysChange: (days: RangeDays) => void;
  from: string;
  to: string;
};

export function SalesTrendChart({ days, onDaysChange, from, to }: Props) {
  const query = new URLSearchParams({ from, to });

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["reports", "sales-trend", from, to],
    queryFn: () => api<SalesTrend>(`/reports/sales-trend?${query.toString()}`),
  });

  const points = (data?.points ?? []).map((p) => ({
    date: p.date,
    label: shortLabel(p.date),
    sales: Number(p.sales),
    orders: p.orders,
  }));
  const hasSales = points.some((p) => p.sales > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Tren penjualan</CardTitle>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => onDaysChange(r.days)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                days === r.days
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : isError ? (
          <ErrorState
            message={errorMessage(error, "Gagal memuat tren penjualan.")}
            onRetry={() => refetch()}
          />
        ) : !hasSales ? (
          <EmptyState
            title="Belum ada penjualan"
            description="Pesanan selesai pada rentang ini akan muncul sebagai grafik."
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={points}
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => formatRupiah(v)}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    borderColor: "var(--border)",
                  }}
                  formatter={(value, name) =>
                    name === "sales"
                      ? [formatRupiah(Number(value)), "Penjualan"]
                      : [String(value ?? 0), "Pesanan"]
                  }
                  labelFormatter={(_label, payload) => {
                    const d = (payload?.[0]?.payload as { date?: string } | undefined)?.date;
                    return d ? formatDate(`${d}T00:00:00`) : "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#fillSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {data && (
          <p className="text-muted-foreground mt-3 text-xs">
            {formatDate(data.from)} – {formatDate(data.to)} · hanya pesanan
            selesai
          </p>
        )}
      </CardContent>
    </Card>
  );
}
