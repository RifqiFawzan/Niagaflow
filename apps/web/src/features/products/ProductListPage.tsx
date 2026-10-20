import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Search } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import type { Category, Paginated, Product } from "@/types";

const PAGE_SIZE = 20;
const ALL = "all";

export function ProductListPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(ALL);
  const [sort, setSort] = useState("createdAt:desc");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Product | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const [sortField, sortOrder] = sort.split(":");

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (categoryId !== ALL) params.set("categoryId", categoryId);
  params.set("sort", sortField);
  params.set("order", sortOrder);
  params.set("includeArchived", String(includeArchived));
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  const query = params.toString();

  const products = useQuery({
    queryKey: ["products", query],
    queryFn: () => api<Paginated<Product>>(`/products?${query}`),
    placeholderData: (prev) => prev,
  });

  const archive = useMutation({
    mutationFn: (product: Product) =>
      api<Product>(`/products/${product.id}/archive`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Produk diarsipkan.");
      setTarget(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal mengarsipkan produk.")),
  });

  const items = products.data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produk"
        description="Kelola katalog produk, harga, dan stok."
      >
        {isOwner && (
          <Button asChild>
            <Link to="/products/new">
              <Plus />
              Produk baru
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card className="py-4">
        <CardContent className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="search-produk">Cari</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="search-produk"
                className="pl-9"
                placeholder="Nama atau SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua kategori</SelectItem>
                {(categories.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Urutkan</Label>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Terbaru</SelectItem>
                <SelectItem value="name:asc">Nama A-Z</SelectItem>
                <SelectItem value="price:desc">Harga tertinggi</SelectItem>
                <SelectItem value="stock:asc">Stok terendah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Arsip</Label>
            <Select
              value={includeArchived ? "with" : "without"}
              onValueChange={(v) => {
                setIncludeArchived(v === "with");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="without">Sembunyikan arsip</SelectItem>
                <SelectItem value="with">Tampilkan arsip</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {products.isPending ? (
        <LoadingState label="Memuat produk..." />
      ) : products.isError ? (
        <ErrorState
          message={errorMessage(products.error, "Gagal memuat produk.")}
          onRetry={() => products.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Tidak ada produk"
          description="Coba ubah kata kunci atau filter, atau tambah produk baru."
          action={
            isOwner ? (
              <Button asChild size="sm">
                <Link to="/products/new">
                  <Plus />
                  Produk baru
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">SKU</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead>Status</TableHead>
                    {isOwner && (
                      <TableHead className="pr-4 text-right">Aksi</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((product) => {
                    const low = product.stock <= product.lowStockThreshold;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="pl-4 font-mono text-xs">
                          {product.sku}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.category?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatRupiah(product.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              low
                                ? "font-semibold text-amber-600 tabular-nums"
                                : "tabular-nums"
                            }
                          >
                            {product.stock}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {" "}
                            / min {product.lowStockThreshold}
                          </span>
                        </TableCell>
                        <TableCell>
                          {product.isActive ? (
                            low ? (
                              <Badge className="border-transparent bg-amber-100 text-amber-700">
                                Stok menipis
                              </Badge>
                            ) : (
                              <Badge className="border-transparent bg-emerald-100 text-emerald-700">
                                Aktif
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Diarsipkan</Badge>
                          )}
                        </TableCell>
                        {isOwner && (
                          <TableCell className="pr-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button asChild variant="ghost" size="sm">
                                <Link to={`/products/${product.id}/edit`}>
                                  <Pencil />
                                  Ubah
                                </Link>
                              </Button>
                              {product.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTarget(product)}
                                >
                                  Arsipkan
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {products.data && (
            <Pagination
              page={products.data.page}
              totalPages={products.data.totalPages}
              total={products.data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={target !== null}
        title="Arsipkan produk?"
        message={`"${target?.name ?? ""}" akan disembunyikan dari daftar aktif. Riwayat pesanan lama tetap utuh.`}
        confirmLabel="Ya, arsipkan"
        busy={archive.isPending}
        onConfirm={() => target && archive.mutate(target)}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
