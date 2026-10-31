import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ROLE_LABELS, type Role, type User } from "@/types";

/**
 * Kelola pengguna & peran (pedoman §15, menu "Pengguna & Peran").
 * Hanya owner & admin (route + backend). Admin tidak melihat peran pemilik
 * dan tidak bisa mengubah akun pemilik — kebijakan ada di server, ini kebaikan UI.
 */
export function UserListPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);

  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api<User[]>("/users"),
  });

  const items = users.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengguna"
        description="Akun orang di toko Anda dan peran masing-masing."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus />
          Pengguna baru
        </Button>
      </PageHeader>

      {users.isPending ? (
        <LoadingState label="Memuat pengguna..." />
      ) : users.isError ? (
        <ErrorState
          message={errorMessage(users.error, "Gagal memuat pengguna.")}
          onRetry={() => users.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada pengguna"
          description="Tambahkan akun untuk orang yang memakai aplikasi ini."
        />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="pr-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => {
                  // Baris sendiri & akun pemilik (untuk admin) tidak bisa diubah perannya.
                  const canChangeRole =
                    u.id !== user?.id && (isOwner || u.role !== "owner");
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="pl-4 font-medium">
                        {u.name}
                        {u.id === user?.id && (
                          <span className="text-muted-foreground text-xs">
                            {" "}
                            (Anda)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {canChangeRole ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRoleTarget(u)}
                          >
                            Ubah peran
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
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

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} actorIsOwner={isOwner} />
      <ChangeRoleDialog
        target={roleTarget}
        onOpenChange={(next) => !next && setRoleTarget(null)}
        actorIsOwner={isOwner}
      />
    </div>
  );
}

const ROLE_OPTIONS: Role[] = ["owner", "admin", "kasir", "stock_manager", "staff"];

function CreateUserDialog({
  open,
  onOpenChange,
  actorIsOwner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actorIsOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("kasir");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("kasir");
      setError(null);
    }
  }, [open]);

  const save = useMutation({
    mutationFn: () =>
      api<User>("/users", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      }),
    onSuccess: () => {
      toast.success("Pengguna dibuat.");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setError(errorMessage(err, "Gagal membuat pengguna.")),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Nama minimal 2 karakter.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Email tidak valid.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    setError(null);
    save.mutate();
  }

  const roles = actorIsOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r !== "owner");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pengguna baru</DialogTitle>
          <DialogDescription>
            Akun untuk masuk ke aplikasi. Peran menentukan menu & izinnya.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="user-name">Nama</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div className="space-y-2">
            <Label>Peran</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

function ChangeRoleDialog({
  target,
  onOpenChange,
  actorIsOwner,
}: {
  target: User | null;
  onOpenChange: (open: boolean) => void;
  actorIsOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role>("staff");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setRole(target.role);
      setError(null);
    }
  }, [target]);

  const save = useMutation({
    mutationFn: () =>
      api<User>(`/users/${target!.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      toast.success("Peran diubah.");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setError(errorMessage(err, "Gagal mengubah peran.")),
  });

  const roles = actorIsOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r !== "owner");

  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah peran</DialogTitle>
          <DialogDescription>
            {target ? `${target.name} — ${target.email}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Peran baru</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
