import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { api, errorMessage, isApiErrorCode } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ErrorState, InlineLoading } from "@/components/ui/states";
import type { Category, Product } from "@/types";

const NONE = "none";

type FormState = {
  name: string;
  sku: string;
  categoryId: string;
  description: string;
  price: string;
  stock: string;
  lowStockThreshold: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  name: "",
  sku: "",
  categoryId: NONE,
  description: "",
  price: "0",
  stock: "0",
  lowStockThreshold: "5",
};

function isNonNegativeInt(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [skuTaken, setSkuTaken] = useState(false);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  const existing = useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => api<Product>(`/products/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing.data) return;
    setForm({
      name: existing.data.name,
      sku: existing.data.sku,
      categoryId: existing.data.categoryId ?? NONE,
      description: existing.data.description ?? "",
      price: String(existing.data.price),
      stock: String(existing.data.stock),
      lowStockThreshold: String(existing.data.lowStockThreshold),
    });
  }, [existing.data]);

  // Cek SKU terpakai: cocokkan persis (server menyimpan SKU uppercase).
  const plainCatalog = useQuery({
    queryKey: ["products", "sku-check"],
    queryFn: () =>
      api<import("@/types").Paginated<Product>>("/products?pageSize=100"),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!isEdit || !plainCatalog.data || !form.sku.trim()) {
      setSkuTaken(false);
      return;
    }
    const normalized = form.sku.trim().toUpperCase();
    setSkuTaken(
      plainCatalog.data.items.some(
        (p) => p.sku.toUpperCase() === normalized && p.id !== id
      )
    );
  }, [form.sku, plainCatalog.data, isEdit, id]);

  const topError = useMemo(() => {
    if (Object.keys(errors).length > 0) return "Periksa kembali isian yang ditandai.";
    if (skuTaken) return "SKU sudah dipakai produk lain.";
    return null;
  }, [errors, skuTaken]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = "Nama produk wajib diisi.";
    if (!form.sku.trim()) next.sku = "SKU wajib diisi.";
    if (!isNonNegativeInt(form.price)) {
      next.price = "Harga harus angka bulat 0 atau lebih (tanpa titik/koma).";
    }
    if (!isNonNegativeInt(form.stock)) {
      next.stock = "Stok harus angka bulat 0 atau lebih.";
    }
    if (!isNonNegativeInt(form.lowStockThreshold)) {
      next.lowStockThreshold = "Batas stok menipis harus angka bulat 0 atau lebih.";
    }
    return next;
  };

  const payload = () => ({
    name: form.name.trim(),
    sku: form.sku.trim(),
    categoryId: form.categoryId === NONE ? null : form.categoryId,
    description: form.description.trim() ? form.description.trim() : null,
    price: Number(form.price),
    stock: Number(form.stock),
    lowStockThreshold: Number(form.lowStockThreshold),
  });

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? api<Product>(`/products/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload()),
          })
        : api<Product>("/products", {
            method: "POST",
            body: JSON.stringify(payload()),
          }),
    onSuccess: (product) => {
      toast.success(isEdit ? "Produk diperbarui." : "Produk dibuat.");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate("/products", { state: { highlight: product.id } });
    },
    onError: (err) => {
      if (isApiErrorCode(err, "SKU_DUPLICATE")) {
        setSkuTaken(true);
        setErrors((prev) => ({ ...prev, sku: "SKU sudah dipakai produk lain." }));
        return;
      }
      toast.error(errorMessage(err, "Gagal menyimpan produk."));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0 || skuTaken) return;
    save.mutate();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === "sku") setSkuTaken(false);
  };

  if (isEdit && existing.isPending) {
    return (
      <div className="space-y-5">
        <PageHeader title="Ubah produk" />
        <Card>
          <CardContent>
            <InlineLoading rows={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEdit && existing.isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Ubah produk" />
        <ErrorState
          message={errorMessage(existing.error, "Produk tidak ditemukan.")}
          onRetry={() => existing.refetch()}
        />
        <Button asChild variant="outline">
          <Link to="/products">
            <ArrowLeft />
            Kembali ke daftar produk
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? "Ubah produk" : "Produk baru"}
        description={
          isEdit
            ? "Perbarui detail produk dan stok."
            : "Tambahkan produk baru ke katalog."
        }
      >
        <Button asChild variant="outline">
          <Link to="/products">
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {topError && (
              <p
                role="alert"
                className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
              >
                {topError}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama produk</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  placeholder="Contoh: Makanan Kucing 1kg"
                />
                {errors.name && (
                  <p className="text-destructive text-xs">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  aria-invalid={Boolean(errors.sku) || skuTaken}
                  placeholder="Contoh: MKN-001"
                  className="uppercase"
                />
                {errors.sku && (
                  <p className="text-destructive text-xs">{errors.sku}</p>
                )}
                {!errors.sku && skuTaken && (
                  <p className="text-destructive text-xs">
                    SKU ini sudah dipakai produk lain.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => set("categoryId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tanpa kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Tanpa kategori</SelectItem>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  aria-invalid={Boolean(errors.price)}
                />
                {errors.price && (
                  <p className="text-destructive text-xs">{errors.price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  aria-invalid={Boolean(errors.stock)}
                />
                {errors.stock && (
                  <p className="text-destructive text-xs">{errors.stock}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="threshold">Batas stok menipis</Label>
                <Input
                  id="threshold"
                  inputMode="numeric"
                  value={form.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", e.target.value)}
                  aria-invalid={Boolean(errors.lowStockThreshold)}
                />
                {errors.lowStockThreshold && (
                  <p className="text-destructive text-xs">
                    {errors.lowStockThreshold}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Catatan singkat tentang produk ini."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button asChild variant="outline" type="button">
                <Link to="/products">Batal</Link>
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                {isEdit ? "Simpan perubahan" : "Simpan produk"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
