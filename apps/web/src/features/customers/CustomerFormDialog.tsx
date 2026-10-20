import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/types";

/** Dialog tambah/edit pelanggan (owner). */
export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Jika diisi → mode edit, jika kosong → mode tambah. */
  customer?: Customer | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(customer);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(customer?.name ?? "");
    setPhone(customer?.phone ?? "");
    setNotes(customer?.notes ?? "");
    setError(null);
  }, [open, customer]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      };
      return customer
        ? api<Customer>(`/customers/${customer.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : api<Customer>("/customers", {
            method: "POST",
            body: JSON.stringify(payload),
          });
    },
    onSuccess: (saved) => {
      toast.success(
        isEdit
          ? `Pelanggan ${saved.name} diperbarui.`
          : `Pelanggan ${saved.name} ditambahkan.`
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer) {
        queryClient.invalidateQueries({ queryKey: ["customer", customer.id] });
      }
      onOpenChange(false);
    },
    onError: (err) => {
      setError(errorMessage(err, "Gagal menyimpan pelanggan."));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama pelanggan wajib diisi.");
      return;
    }
    setError(null);
    save.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !save.isPending && onOpenChange(false)}
    >
      <DialogContent showCloseButton={!save.isPending}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ubah pelanggan" : "Pelanggan baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data pelanggan ini."
              : "Tambahkan pelanggan agar bisa dipilih saat membuat pesanan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
            >
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pelanggan-nama">Nama</Label>
            <Input
              id="pelanggan-nama"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Mis. Budi Santoso"
              aria-invalid={!name.trim()}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pelanggan-kontak">Kontak (opsional)</Label>
            <Input
              id="pelanggan-kontak"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mis. 0812-3456-7890"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pelanggan-catatan">Catatan (opsional)</Label>
            <Textarea
              id="pelanggan-catatan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alamat, preferensi, dll."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Simpan perubahan" : "Tambah pelanggan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
