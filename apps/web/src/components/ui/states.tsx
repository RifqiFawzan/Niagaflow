import type { ReactNode } from "react";

export function LoadingState({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      <p className="text-sm">{label}</p>
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
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      <p className="font-medium text-slate-600">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-rose-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-rose-300 px-4 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}
