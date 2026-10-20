import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Pencil, Plus, X } from "lucide-react";

import { api, errorMessage, isApiErrorCode } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, InlineLoading } from "@/components/ui/states";
import type { Category } from "@/types";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [target, setTarget] = useState<Category | null>(null);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const create = useMutation({
    mutationFn: (name: string) =>
      api<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success("Kategori ditambahkan.");
      setNewName("");
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menambah kategori.")),
  });

  const update = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api<Category>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success("Kategori diperbarui.");
      setEditingId(null);
      setEditingName("");
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal memperbarui kategori.")),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api<null>(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Kategori dihapus.");
      setTarget(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(
        isApiErrorCode(err, "CATEGORY_IN_USE")
          ? "Kategori masih dipakai produk dan tidak bisa dihapus."
          : errorMessage(err, "Gagal menghapus kategori.")
      );
      setTarget(null);
    },
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    create.mutate(name);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const submitEdit = () => {
    const name = editingName.trim();
    if (!editingId || !name) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    update.mutate({ id: editingId, name });
  };

  const items = categories.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kategori"
        description="Kelompokkan produk agar laporan lebih rapi."
      />

      <Card className="max-w-xl py-4">
        <CardContent className="px-4">
          <form onSubmit={handleCreate} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="new-category"
                className="text-sm leading-none font-medium"
              >
                Kategori baru
              </label>
              <Input
                id="new-category"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Minuman"
              />
            </div>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
              Tambah
            </Button>
          </form>
        </CardContent>
      </Card>

      {categories.isPending ? (
        <Card>
          <CardContent>
            <InlineLoading rows={5} />
          </CardContent>
        </Card>
      ) : categories.isError ? (
        <ErrorState
          message={errorMessage(categories.error, "Gagal memuat kategori.")}
          onRetry={() => categories.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada kategori"
          description="Tambahkan kategori pertama lewat formulir di atas."
        />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nama</TableHead>
                  <TableHead className="text-right">Jumlah produk</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((category) => {
                  const isEditing = editingId === category.id;
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="pl-4">
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            aria-label="Nama kategori"
                          />
                        ) : (
                          <span className="font-medium">{category.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {category.productCount ?? 0}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Simpan"
                              onClick={submitEdit}
                              disabled={update.isPending}
                            >
                              {update.isPending ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Check />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Batal"
                              onClick={() => setEditingId(null)}
                            >
                              <X />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Ubah kategori"
                              onClick={() => startEdit(category)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTarget(category)}
                            >
                              Hapus
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={target !== null}
        title="Hapus kategori?"
        message={`"${target?.name ?? ""}" akan dihapus permanen. Kategori yang masih dipakai produk tidak bisa dihapus.`}
        confirmLabel="Ya, hapus"
        busy={remove.isPending}
        onConfirm={() => target && remove.mutate(target.id)}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
