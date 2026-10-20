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
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        {children}
      </CardContent>
    </Card>
  );
}

export function LoadingState({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="space-y-3 rounded-xl border p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-6" />
        ))}
      </div>
    </div>
  );
}

/** Blok loading ringkas untuk area kecil (mis. riwayat pesanan). */
export function InlineLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Memuat...</span>
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
      <div className="bg-muted text-muted-foreground rounded-full p-3">
        <Inbox className="size-5" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
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
    <Shell className="border-destructive/30">
      <div className="bg-destructive/10 text-destructive rounded-full p-3">
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-destructive text-sm font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Coba lagi
        </Button>
      )}
    </Shell>
  );
}
