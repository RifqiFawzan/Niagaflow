import type { Prisma } from "@prisma/client";

/**
 * Konvensi uang NiagaFlow: SEMUA field rupiah keluar sebagai number (integer rupiah).
 * Harga dipaksa int oleh Zod, jadi Number() aman tanpa kehilangan presisi.
 * (Ditulis juga di plan/kit.md — jangan kembalikan Decimal mentah ke klien.)
 */
export type MoneyValue = Prisma.Decimal | number | string;

export function money(value: MoneyValue | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

type SerializableOrder = {
  subtotal: MoneyValue | null;
  discount: MoneyValue | null;
  total: MoneyValue | null;
  items?: ReadonlyArray<{
    quantity: number;
    unitPrice?: MoneyValue | null;
    lineTotal?: MoneyValue | null;
  }>;
};

export function serializeOrder<T extends SerializableOrder>(order: T) {
  return {
    ...order,
    subtotal: money(order.subtotal),
    discount: money(order.discount),
    total: money(order.total),
    items: order.items?.map((item) => ({
      ...item,
      ...(item.unitPrice !== undefined ? { unitPrice: money(item.unitPrice) } : {}),
      ...(item.lineTotal !== undefined ? { lineTotal: money(item.lineTotal) } : {}),
    })),
  };
}

export function serializeProduct<T extends { price: MoneyValue | null }>(product: T) {
  return { ...product, price: money(product.price) };
}
