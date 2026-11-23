import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STYLES: Record<OrderStatus, string> = {
  pending: "border-[#f8d082]/40 bg-[#f8d082]/10 text-[#f8d082]",
  processing: "border-[#a8caff]/40 bg-[#a8caff]/10 text-[#a8caff]",
  completed: "border-primary/45 bg-primary/12 text-primary",
  cancelled: "border-border bg-muted text-muted-foreground",
};

const LABELS: Record<OrderStatus, string> = {
  pending: "Menunggu",
  processing: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const ICONS: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export const ORDER_STATUS_LABELS = LABELS;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const Icon = ICONS[status];
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 font-mono text-xs", STYLES[status])}
    >
      <Icon aria-hidden="true" className="size-3" />
      {LABELS[status]}
    </Badge>
  );
}
