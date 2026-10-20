import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, InlineLoading } from "@/components/ui/states";
import type { Customer, Order } from "@/types";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const customer = useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => api<Customer>(`/customers/${id}`),
    enabled: Boolean(id),
  });

  const orders = useQuery({
    queryKey: ["customers", "orders", id],
    queryFn: () => api<Order[]>(`/customers/${id}/orders`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!customer.data) return;
    setName(customer.data.name);
    setPhone(customer.data.phone ?? "");
    setNotes(customer.data.notes ?? "");
  }, [customer.data]);

  const save = useMutation({
    mutationFn: () =>
      api<Customer>(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() ? phone.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        }),
      }),
    onSuccess: () => {
      toast.success("Data pelanggan diperbarui.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => {
      const message = errorMessage(err, "Gagal menyimpan pelanggan.");
      setError(message);
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama pelanggan wajib diisi.");
      return;
    }
    setError(null);
    save.mutate();
  };

  if (customer.isPending) {
    return (
      <div className="space-y-5">
        <PageHeader title="Detail pelanggan" />
        <Card>
          <CardContent>
            <InlineLoading rows={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (customer.isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Detail pelanggan" />
        <ErrorState
          message={errorMessage(customer.error, "Pelanggan tidak ditemukan.")}
          onRetry={() => customer.refetch()}
        />
        <Button asChild variant="outline">
          <Link to="/customers">
            <ArrowLeft />
            Kembali ke daftar pelanggan
          </Link>
        </Button>
      </div>
    );
  }

  const history: Order[] = orders.data ?? [];
  const totalBelanja = history
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={customer.data.name}
        description={`Terdaftar ${formatDate(customer.data.createdAt)}`}
      >
        <Button asChild variant="outline">
          <Link to="/customers">
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              {isOwner
                ? "Perbarui data kontak dan catatan."
                : "Data pelanggan (hanya pemilik yang bisa mengubah)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <Label htmlFor="cust-name">Nama</Label>
                <Input
                  id="cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Kontak</Label>
                <Input
                  id="cust-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xx..."
                  disabled={!isOwner}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-notes">Catatan</Label>
                <Textarea
                  id="cust-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferensi, alamat, dll."
                  disabled={!isOwner}
                />
              </div>

              {isOwner && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save />
                    )}
                    Simpan
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat pesanan</CardTitle>
            <CardDescription>
              {history.length} pesanan · total belanja {formatRupiah(totalBelanja)}{" "}
              (tanpa pesanan dibatalkan)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {orders.isPending ? (
              <div className="px-6">
                <InlineLoading rows={4} />
              </div>
            ) : orders.isError ? (
              <div className="px-6">
                <ErrorState
                  message={errorMessage(orders.error, "Gagal memuat riwayat.")}
                  onRetry={() => orders.refetch()}
                />
              </div>
            ) : history.length === 0 ? (
              <div className="px-6">
                <EmptyState
                  title="Belum ada pesanan"
                  description="Pesanan pelanggan ini akan tampil di sini."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">No. pesanan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-6 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="pl-6 font-mono text-xs">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(order.total)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
