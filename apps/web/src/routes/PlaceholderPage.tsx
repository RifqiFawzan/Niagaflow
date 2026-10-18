import { EmptyState } from "../components/ui/states";

/** Placeholder sampai ISSUE-011/012 mengisi halaman nyata. */
export function PlaceholderPage({ title, issue }: { title: string; issue: string }) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">{title}</h1>
      <EmptyState
        title={`Halaman ${title}`}
        description={`Dikerjakan di ${issue}. Fondasi route & layout sudah siap.`}
      />
    </div>
  );
}
