import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { Order, OrderStatus, Paginated } from "@/types";

const PAGE_SIZE = 20;
const ALL = "all";

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Menunggu" },
  { value: "processing", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export function OrderListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (status !== ALL) params.set("status", status);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  const query = params.toString();

  const orders = useQuery({
    queryKey: ["orders", query],
    queryFn: () => api<Paginated<Order>>(`/orders?${query}`),
    placeholderData: (prev) => prev,
  });

  const items = orders.data?.items ?? [];
  const hasFilter =
    Boolean(debouncedSearch) || status !== ALL || Boolean(from) || Boolean(to);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pesanan"
        description="Buat pesanan baru dan pantau statusnya."
      >
        <Button asChild>
          <Link to="/orders/new">
            <Plus />
            Pesanan baru
          </Link>
        </Button>
      </PageHeader>

      <Card className="py-4">
        <CardContent className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="search-pesanan">Cari</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="search-pesanan"
                className="pl-9"
                placeholder="No. pesanan atau pelanggan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dari-tanggal">Dari tanggal</Label>
            <Input
              id="dari-tanggal"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sampai-tanggal">Sampai tanggal</Label>
            <Input
              id="sampai-tanggal"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {orders.isPending ? (
        <Card className="py-0">
          <CardContent className="px-0">
            <TableSkeleton columns={6} />
          </CardContent>
        </Card>
      ) : orders.isError ? (
        <ErrorState
          message={errorMessage(orders.error, "Gagal memuat pesanan.")}
          onRetry={() => orders.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Tidak ada pesanan"
          description={
            hasFilter
              ? "Tidak ada pesanan yang cocok dengan filter. Coba ubah kata kunci atau rentang tanggal."
              : "Pesanan yang dibuat akan muncul di sini."
          }
          action={
            <Button asChild size="sm">
              <Link to="/orders/new">
                <Plus />
                Pesanan baru
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">No. pesanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Item</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="pl-4 font-mono text-xs">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.customer?.name ?? "Tanpa pelanggan"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {order.items?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatRupiah(order.total)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/orders/${order.id}`}>Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {orders.data && (
            <Pagination
              page={orders.data.page}
              totalPages={orders.data.totalPages}
              total={orders.data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
