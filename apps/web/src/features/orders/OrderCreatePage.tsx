import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { api, errorMessage, isApiErrorCode } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, InlineLoading } from "@/components/ui/states";
import type {
  Category,
  Customer,
  Order,
  Paginated,
  Product,
} from "@/types";

const NONE = "none";

type CartLine = {
  product: Product;
  quantity: number;
};

export function OrderCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState(NONE);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  const customers = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => api<Paginated<Customer>>("/customers?pageSize=100"),
  });

  const params = new URLSearchParams({ pageSize: "50" });
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (categoryId !== "all") params.set("categoryId", categoryId);
  const query = params.toString();

  const products = useQuery({
    queryKey: ["products", "picker", query],
    queryFn: () => api<Paginated<Product>>(`/products?${query}`),
    placeholderData: (prev) => prev,
  });

  const catalog = products.data?.items ?? [];

  const cartQuantities = useMemo(
    () => new Map(lines.map((l) => [l.product.id, l.quantity])),
    [lines]
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0),
    [lines]
  );

  const discountValue = /^\d+$/.test(discount.trim()) ? Number(discount) : 0;
  const estimatedTotal = Math.max(0, subtotal - discountValue);
  const discountInvalid = !/^\d+$/.test(discount.trim());
  const discountTooBig = !discountInvalid && discountValue > subtotal;

  const addProduct = (product: Product) => {
    setError(null);
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: l.quantity + 1 }
            : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const setQuantity = (productId: string, quantity: number) => {
    setError(null);
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId
          ? { ...l, quantity: Math.max(1, quantity) }
          : l
      )
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const overStock = lines.filter((l) => l.quantity > l.product.stock);

  const create = useMutation({
    mutationFn: () =>
      api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerId: customerId === NONE ? null : customerId,
          items: lines.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
          })),
          discount: discountValue,
          notes: notes.trim() ? notes.trim() : null,
        }),
      }),
    onSuccess: (order) => {
      toast.success(`Pesanan ${order.orderNumber} dibuat.`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate(`/orders/${order.id}`);
    },
    onError: (err) => {
      const message = isApiErrorCode(err, "INSUFFICIENT_STOCK")
        ? "Stok salah satu produk tidak mencukupi. Kurangi jumlah lalu coba lagi."
        : errorMessage(err, "Gagal membuat pesanan.");
      setError(message);
      toast.error(message);
      // Stok di server sudah berubah? Muat ulang katalog agar qty tervalidasi ulang.
      if (isApiErrorCode(err, "INSUFFICIENT_STOCK")) {
        products.refetch();
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Pesanan minimal berisi 1 produk.");
      return;
    }
    if (overStock.length > 0) {
      setError("Ada jumlah yang melebihi stok tersedia. Periksa kembali.");
      return;
    }
    if (discountInvalid) {
      setError("Diskon harus angka bulat 0 atau lebih.");
      return;
    }
    if (discountTooBig) {
      setError("Diskon tidak boleh melebihi subtotal.");
      return;
    }
    setError(null);
    create.mutate();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pesanan baru"
        description="Pilih produk, atur jumlah, lalu simpan. Total dihitung di server."
      >
        <Button asChild variant="outline">
          <Link to="/orders">
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-3" noValidate>
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pilih produk</CardTitle>
              <CardDescription>
                Hanya produk aktif yang bisa dipesan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    placeholder="Cari nama atau SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Cari produk"
                  />
                </div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full" aria-label="Filter kategori">
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua kategori</SelectItem>
                    {(categories.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {products.isPending ? (
                <InlineLoading rows={4} />
              ) : products.isError ? (
                <ErrorState
                  message={errorMessage(products.error, "Gagal memuat produk.")}
                  onRetry={() => products.refetch()}
                />
              ) : catalog.length === 0 ? (
                <EmptyState
                  title="Produk tidak ditemukan"
                  description="Coba ubah kata kunci atau filter kategori."
                />
              ) : (
                <ul className="divide-border max-h-96 divide-y overflow-y-auto rounded-lg border">
                  {catalog.map((product) => {
                    const inCart = cartQuantities.get(product.id) ?? 0;
                    const remaining = product.stock - inCart;
                    const disabled = product.stock === 0;
                    return (
                      <li
                        key={product.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            <span className="font-mono">{product.sku}</span> ·{" "}
                            {formatRupiah(product.price)} · stok {product.stock}
                            {inCart > 0 && ` · di keranjang ${inCart}`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={disabled ? "secondary" : "outline"}
                          disabled={disabled || remaining <= 0}
                          onClick={() => addProduct(product)}
                        >
                          <Plus />
                          {disabled
                            ? "Stok habis"
                            : remaining <= 0
                              ? "Maksimum"
                              : "Tambah"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keranjang</CardTitle>
              <CardDescription>
                Total di bawah adalah estimasi; nilai final dari server.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {lines.length === 0 ? (
                <div className="px-6">
                  <EmptyState
                    title="Keranjang masih kosong"
                    description="Tambahkan produk dari daftar di atas."
                  />
                </div>
              ) : (
                <ul className="divide-border divide-y">
                  {lines.map((line) => {
                    const exceeds = line.quantity > line.product.stock;
                    return (
                      <li
                        key={line.product.id}
                        className="flex flex-wrap items-center gap-3 px-6 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {line.product.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatRupiah(line.product.price)} ×{" "}
                            {line.quantity} ={" "}
                            {formatRupiah(
                              Number(line.product.price) * line.quantity
                            )}
                          </p>
                          {exceeds && (
                            <p className="text-destructive text-xs">
                              Melebihi stok tersedia ({line.product.stock}).
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Kurangi jumlah"
                            onClick={() =>
                              setQuantity(line.product.id, line.quantity - 1)
                            }
                            disabled={line.quantity <= 1}
                          >
                            <Minus />
                          </Button>
                          <Input
                            className="w-16 text-center"
                            inputMode="numeric"
                            aria-label={`Jumlah ${line.product.name}`}
                            value={String(line.quantity)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              setQuantity(line.product.id, Number(raw || 1));
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Tambah jumlah"
                            onClick={() =>
                              setQuantity(line.product.id, line.quantity + 1)
                            }
                          >
                            <Plus />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${line.product.name}`}
                            onClick={() => removeLine(line.product.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Detail pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p
                  role="alert"
                  className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
                >
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <Label>Pelanggan (opsional)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tanpa pelanggan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tanpa pelanggan</SelectItem>
                    {(customers.data?.items ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="diskon">Diskon (Rp)</Label>
                <Input
                  id="diskon"
                  inputMode="numeric"
                  value={discount}
                  onChange={(e) => {
                    setDiscount(e.target.value);
                    setError(null);
                  }}
                  aria-invalid={discountInvalid || discountTooBig}
                />
                {discountInvalid && (
                  <p className="text-destructive text-xs">
                    Diskon harus angka bulat 0 atau lebih.
                  </p>
                )}
                {discountTooBig && (
                  <p className="text-destructive text-xs">
                    Diskon tidak boleh melebihi subtotal.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catatan">Catatan (opsional)</Label>
                <Textarea
                  id="catatan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruksi pengiriman, dll."
                />
              </div>

              <div className="border-t pt-4">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{formatRupiah(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Diskon</dt>
                    <dd className="tabular-nums">
                      −{formatRupiah(discountValue)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <dt>Perkiraan total</dt>
                    <dd className="tabular-nums">
                      {formatRupiah(estimatedTotal)}
                    </dd>
                  </div>
                </dl>
                <p className="text-muted-foreground mt-2 text-xs">
                  {lines.length} produk ·{" "}
                  {lines.reduce((n, l) => n + l.quantity, 0)} unit
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={create.isPending || lines.length === 0}
              >
                {create.isPending && <Loader2 className="animate-spin" />}
                Simpan pesanan
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
