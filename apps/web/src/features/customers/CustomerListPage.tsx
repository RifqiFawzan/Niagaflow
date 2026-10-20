import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { CustomerFormDialog } from "@/features/customers/CustomerFormDialog";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, InlineLoading } from "@/components/ui/states";
import type { Customer, Paginated } from "@/types";

const PAGE_SIZE = 20;

export function CustomerListPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const params = new URLSearchParams();
  if (debouncedSearch) params.set("q", debouncedSearch);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  const query = params.toString();

  const customers = useQuery({
    queryKey: ["customers", query],
    queryFn: () => api<Paginated<Customer>>(`/customers?${query}`),
    placeholderData: (prev) => prev,
  });

  const items = customers.data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pelanggan"
        description="Data pelanggan dan riwayat pesanannya."
      >
        {isOwner && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Pelanggan baru
          </Button>
        )}
      </PageHeader>

      <Card className="max-w-md py-4">
        <CardContent className="px-4">
          <div className="space-y-1.5">
            <Label htmlFor="search-pelanggan">Cari pelanggan</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="search-pelanggan"
                className="pl-9"
                placeholder="Nama atau nomor kontak..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {customers.isPending ? (
        <Card>
          <CardContent>
            <InlineLoading rows={5} />
          </CardContent>
        </Card>
      ) : customers.isError ? (
        <ErrorState
          message={errorMessage(customers.error, "Gagal memuat pelanggan.")}
          onRetry={() => customers.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada pelanggan"
          description={
            debouncedSearch
              ? "Tidak ada pelanggan yang cocok dengan pencarian."
              : isOwner
                ? "Tambahkan pelanggan agar bisa dipilih saat membuat pesanan."
                : "Pelanggan yang ditambahkan pemilik akan muncul di sini."
          }
          action={
            isOwner && !debouncedSearch ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus />
                Pelanggan baru
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
                    <TableHead className="pl-4">Nama</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="pr-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="pl-4 font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.phone ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[16rem] truncate">
                        {customer.notes ?? "-"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Ubah ${customer.name}`}
                              onClick={() => {
                                setEditing(customer);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil />
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/customers/${customer.id}`}>
                              {isOwner ? "Detail" : "Riwayat"}
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {customers.data && (
            <Pagination
              page={customers.data.page}
              totalPages={customers.data.totalPages}
              total={customers.data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
      />
    </div>
  );
}
