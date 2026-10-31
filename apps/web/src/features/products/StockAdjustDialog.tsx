import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Product, StockMovement } from "@/types";

/**
 * Dialog catat stok masuk/keluar manual (hanya owner).
 * POST /stock-movements lalu muat ulang daftar produk + riwayat.
 */
export function StockAdjustDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType("MASUK");
      setQuantity("");
      setReason("");
      setError(null);
    }
  }, [open]);

  const save = useMutation({
    mutationFn: () =>
      api<StockMovement>("/stock-movements", {
        method: "POST",
        body: JSON.stringify({
          productId: product?.id,
          type,
          quantity: Number(quantity),
          reason: reason.trim(),
        }),
      }),
    onSuccess: () => {
      toast.success(
        type === "MASUK" ? "Stok masuk tercatat." : "Stok keluar tercatat.",
      );
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
    onError: (err) =>
      setError(errorMessage(err, "Gagal mencatat pergerakan stok.")),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d+$/.test(quantity.trim()) || Number(quantity) < 1) {
      setError("Jumlah minimal 1.");
      return;
    }
    if (!reason.trim()) {
      setError("Alasan wajib diisi.");
      return;
    }
    if (type === "KELUAR" && product && Number(quantity) > product.stock) {
      setError(`Stok tersisa ${product.stock}, tidak cukup.`);
      return;
    }
    setError(null);
    save.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atur stok</DialogTitle>
          <DialogDescription>
            {product
              ? `${product.name} — stok saat ini ${product.stock}.`
              : "Catat pergerakan stok produk."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="adjust-type">Jenis</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as "MASUK" | "KELUAR")
              }
            >
              <SelectTrigger id="adjust-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASUK">Masuk</SelectItem>
                <SelectItem value="KELUAR">Keluar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-qty">Jumlah</Label>
            <Input
              id="adjust-qty"
              type="number"
              min={1}
              placeholder="Contoh: 10"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-reason">Alasan</Label>
            <Textarea
              id="adjust-reason"
              placeholder="Contoh: Restok dari pemasok"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
