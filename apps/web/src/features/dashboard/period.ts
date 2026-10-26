export const RANGES = [
  { days: 7, label: "7 hari" },
  { days: 30, label: "30 hari" },
] as const;

export type RangeDays = (typeof RANGES)[number]["days"];

/** Date -> "YYYY-MM-DD" (UTC slice dipakai hanya untuk kirim parameter from/to). */
export function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** "2026-10-18" -> "18 Okt" (sumbu-x ringkas). */
export function shortLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/** Rentang from/to (ISO) untuk `days` hari terakhir, dihitung sekali di induk. */
export function buildRange(days: RangeDays) {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  return { from: toIso(from), to: toIso(to) };
}
