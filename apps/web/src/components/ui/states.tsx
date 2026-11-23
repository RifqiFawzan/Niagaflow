import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Latar berdenyut untuk tabel/form yang sedang dimuat. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

function Shell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("py-0", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        {children}
      </CardContent>
    </Card>
  );
}

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.02em]">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-[5px]" />
        <Skeleton className="h-20 rounded-[5px]" />
        <Skeleton className="h-20 rounded-[5px]" />
      </div>
      <div className="border-border bg-card space-y-3 rounded-[5px] border p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-6" />
        ))}
      </div>
    </div>
  );
}

/** Blok loading ringkas untuk area kecil (mis. riwayat pesanan). */
export function InlineLoading({
  rows = 4,
  label = "Memuat...",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-6" />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Belum ada data",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Shell className="border-dashed">
      <div className="bg-muted text-muted-foreground border-border rounded-[5px] border p-2.5">
        <Inbox aria-hidden="true" className="size-5" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-1 max-w-md text-sm">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </Shell>
  );
}

export function ErrorState({
  message = "Terjadi kesalahan.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Shell className="border-destructive-text/40">
      <div className="bg-destructive/15 text-destructive-text border-destructive-text/30 rounded-[5px] border p-2.5">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </div>
      <p className="text-destructive-text text-sm font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Coba lagi
        </Button>
      )}
    </Shell>
  );
}
