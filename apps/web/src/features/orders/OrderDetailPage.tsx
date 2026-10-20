import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { api, errorMessage, isApiErrorCode } from "@/lib/api";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, ORDER_STATUS_LABELS } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState, InlineLoading } from "@/components/ui/states";
import type { Order, OrderStatus } from "@/types";

const NEXT_ACTIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [pendingCancel, setPendingCancel] = useState(false);

  const order = useQuery({
    queryKey: ["order", id],
    queryFn: () => api<Order>(`/orders/${id}`),
    enabled: Boolean(id),
  });

  const setStatus = useMutation({
    mutationFn: (status: OrderStatus) =>
      api<Order>(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (updated, status) => {
      toast.success(`Status pesanan diubah ke ${ORDER_STATUS_LABELS[status]}.`);
      // Payload PATCH tidak memuat statusHistory — merge field status, lalu
      // muat ulang detail lengkap agar riwayat status tetap sinkron.
      queryClient.setQueryData<Order>(["order", id], (prev) =>
        prev ? { ...prev, ...updated } : updated
      );
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => {
      const message = isApiErrorCode(err, "ORDER_CONFLICT")
        ? "Status pesanan baru saja berubah. Halaman dimuat ulang."
        : errorMessage(err, "Gagal mengubah status pesanan.");
      toast.error(message);
      if (isApiErrorCode(err, "ORDER_CONFLICT")) {
        order.refetch();
      }
    },
  });

  if (order.isPending) {
    return (
      <div className="space-y-5">
        <PageHeader title="Detail pesanan" />
        <InlineLoading rows={8} />
      </div>
    );
  }

  if (order.isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Detail pesanan" />
        <ErrorState
          message={errorMessage(order.error, "Pesanan tidak ditemukan.")}
          onRetry={() => order.refetch()}
        />
      </div>
    );
  }

  const data = order.data;
  const actions = NEXT_ACTIONS[data.status];

  const applyStatus = (status: OrderStatus) => {
    if (status === "cancelled") {
      setPendingCancel(true);
      return;
    }
    setStatus.mutate(status);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Pesanan ${data.orderNumber}`}
        description={`Dibuat ${formatDateTime(data.createdAt)}${
          data.creator ? ` oleh ${data.creator.name}` : ""
        }`}
      >
        <Button asChild variant="outline">
          <Link to="/orders">
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card className="py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Item pesanan</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Produk</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="pr-6 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6 font-medium">
                        {item.productNameSnapshot}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="pr-6 text-right tabular-nums">
                        {formatRupiah(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <dl className="space-y-1.5 border-t px-6 py-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatRupiah(data.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Diskon</dt>
                  <dd className="tabular-nums">
                    −{formatRupiah(data.discount)}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatRupiah(data.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Riwayat status</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-4">
              {(data.statusHistory ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Belum ada riwayat status.
                </p>
              ) : (
                <ol className="space-y-3">
                  {(data.statusHistory ?? []).map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3">
                      <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                      <div className="text-sm">
                        <p className="font-medium">
                          {entry.oldStatus
                            ? `${ORDER_STATUS_LABELS[entry.oldStatus as OrderStatus]} → ${ORDER_STATUS_LABELS[entry.newStatus as OrderStatus]}`
                            : `Pesanan dibuat (${ORDER_STATUS_LABELS[entry.newStatus as OrderStatus]})`}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(entry.changedAt)}
                          {entry.changer ? ` · ${entry.changer.name}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBadge status={data.status} />

              {actions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {data.status === "completed"
                    ? "Pesanan sudah selesai dan tidak bisa diubah lagi."
                    : "Pesanan dibatalkan. Buat pesanan baru jika perlu."}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {actions
                    .filter((s) => s !== "cancelled")
                    .map((s) => (
                      <Button
                        key={s}
                        className="w-full"
                        disabled={setStatus.isPending}
                        onClick={() => applyStatus(s)}
                      >
                        {setStatus.isPending && (
                          <Loader2 className="animate-spin" />
                        )}
                        Tandai {ORDER_STATUS_LABELS[s]}
                      </Button>
                    ))}
                  {actions.includes("cancelled") && (
                    <Button
                      variant="outline"
                      className="text-destructive w-full"
                      disabled={setStatus.isPending}
                      onClick={() => applyStatus("cancelled")}
                    >
                      Batalkan pesanan
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {data.customer ? (
                <>
                  <p className="font-medium">{data.customer.name}</p>
                  {data.customer.phone && (
                    <p className="text-muted-foreground">{data.customer.phone}</p>
                  )}
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                  >
                    <Link to={`/customers/${data.customer.id}`}>
                      Lihat profil pelanggan
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Tanpa pelanggan.</p>
              )}
            </CardContent>
          </Card>

          {data.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingCancel}
        title="Batalkan pesanan?"
        message="Stok produk pada pesanan ini akan dikembalikan. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, batalkan"
        busy={setStatus.isPending}
        onConfirm={() => {
          setPendingCancel(false);
          setStatus.mutate("cancelled");
        }}
        onCancel={() => setPendingCancel(false)}
      />
    </div>
  );
}
