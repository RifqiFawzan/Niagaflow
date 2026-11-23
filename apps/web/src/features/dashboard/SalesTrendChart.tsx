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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="py-0">
      <CardHeader className="border-border flex flex-col gap-3 border-b py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Penjualan selesai per hari</CardTitle>
          <CardDescription className="mt-1">
            {data
              ? `${formatDate(data.from)} – ${formatDate(data.to)}`
              : "Pergeseran nilai transaksi selesai pada rentang terpilih."}
          </CardDescription>
        </div>
        <div
          role="group"
          aria-label="Rentang waktu grafik penjualan"
          className="border-border bg-background inline-flex w-fit items-center gap-1 rounded-[5px] border p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              aria-pressed={days === r.days}
              onClick={() => onDaysChange(r.days)}
              className={cn(
                "min-h-10 sm:min-h-7 rounded-[4px] px-3 py-1 font-mono text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                days === r.days
                  ? "bg-surface-elevated text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="py-5">
        {isPending ? (
          <Skeleton className="h-64 w-full rounded-[5px]" />
        ) : isError ? (
          <ErrorState
            message={errorMessage(error, "Gagal memuat tren penjualan.")}
            onRetry={() => refetch()}
          />
        ) : !hasSales ? (
          <EmptyState
            title="Belum ada penjualan selesai"
            description="Pesanan berstatus selesai pada rentang ini akan tampil sebagai grafik harian."
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
                    <stop offset="0%" stopColor="#8ef5b5" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#8ef5b5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#585657"
                  strokeOpacity={0.65}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#b9b9b9" }}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={76}
                  tick={{ fontSize: 11, fill: "#b9b9b9" }}
                  tickFormatter={(v: number) => formatRupiah(v)}
                />
                <Tooltip
                  cursor={{ stroke: "#8e8e8e" }}
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
                    name === "sales"
                      ? [formatRupiah(Number(value)), "Penjualan"]
                      : [String(value ?? 0), "Pesanan"]
                  }
                  labelFormatter={(_label, payload) => {
                    const d = (
                      payload?.[0]?.payload as { date?: string } | undefined
                    )?.date;
                    return d ? formatDate(`${d}T00:00:00`) : "";
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#8ef5b5"
                  strokeWidth={2}
                  fill="url(#fillSales)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
