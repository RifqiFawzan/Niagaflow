import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  STOCK_MOVEMENT_LABELS,
  type Paginated,
  type Product,
  type StockMovement,
} from "@/types";

const PAGE_SIZE = 20;
const ALL = "all";

/** Riwayat pergerakan stok (pedoman §9): semua pergerakan terekam & bisa ditelusuri. */
export function StockMovementListPage() {
  const [productId, setProductId] = useState(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const products = useQuery({
    queryKey: ["products", "options"],
    queryFn: () =>
      api<Paginated<Product>>(
        "/products?pageSize=100&sort=name&order=asc&includeArchived=true",
      ),
  });

  const params = new URLSearchParams();
  if (productId !== ALL) params.set("productId", productId);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  const query = params.toString();

  const movements = useQuery({
    queryKey: ["stock-movements", query],
    queryFn: () => api<Paginated<StockMovement>>(`/stock-movements?${query}`),
    placeholderData: (prev) => prev,
  });

  const allItems = movements.data?.items ?? [];
  const q = debouncedSearch.trim().toLowerCase();
  const items = q
    ? allItems.filter(
        (m) =>
          (m.product?.name ?? "").toLowerCase().includes(q) ||
          (m.reason ?? "").toLowerCase().includes(q),
      )
    : allItems;

  const movementBadge = (type: StockMovement["type"]) => {
    if (type === "MASUK")
      return (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700">
          Masuk
        </Badge>
      );
    if (type === "KELUAR")
      return (
        <Badge className="border-transparent bg-red-100 text-red-700">
          Keluar
        </Badge>
      );
    if (type === "PEMBATALAN")
      return (
        <Badge className="border-transparent bg-sky-100 text-sky-700">
          Pembatalan
        </Badge>
      );
    return <Badge variant="secondary">{STOCK_MOVEMENT_LABELS[type]}</Badge>;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Riwayat stok"
        description="Semua pergerakan stok: penjualan, pembatalan, dan penyesuaian manual."
      />

      <Card className="py-4">
        <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="search-riwayat">Cari</Label>
            <Input
              id="search-riwayat"
              placeholder="Nama produk atau alasan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Produk</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua produk</SelectItem>
                {(products.data?.items ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {movements.isPending ? (
        <LoadingState label="Memuat riwayat stok..." />
      ) : movements.isError ? (
        <ErrorState
          message={errorMessage(movements.error, "Gagal memuat riwayat stok.")}
          onRetry={() => movements.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          description="Pergerakan stok dari penjualan dan penyesuaian akan muncul di sini."
        />
      ) : (
        <>
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Waktu</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Perubahan</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead className="pr-4">Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="pl-4 whitespace-nowrap text-muted-foreground text-sm">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.product?.name ?? "-"}
                      </TableCell>
                      <TableCell>{movementBadge(m.type)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          m.delta >= 0 ? "text-emerald-600" : "text-red-600",
                        )}
                      >
                        {m.delta >= 0 ? `+${m.delta}` : m.delta}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {m.reason ?? (m.order ? `Pesanan ${m.order.orderNumber}` : "-")}
                      </TableCell>
                      <TableCell className="pr-4 text-muted-foreground text-sm">
                        {m.user?.name ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {movements.data && (
            <Pagination
              page={movements.data.page}
              totalPages={movements.data.totalPages}
              total={movements.data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
