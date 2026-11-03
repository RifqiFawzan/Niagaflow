import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/* ------------------------------------------------------------------ *
 * Skema bersama
 * ------------------------------------------------------------------ */

export const errorSchema = registry.register(
  "Error",
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: "VALIDATION_ERROR" }),
      message: z.string().openapi({ example: "Nama produk wajib diisi." }),
    }),
  })
);

/** Bungkus `{ success: true, data: T }` untuk dipakai berulang. */
function okSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ success: z.literal(true), data });
}

export const sessionUserSchema = registry.register(
  "SessionUser",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["owner", "staff"]),
  })
);

export const categorySchema = registry.register(
  "Category",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    productCount: z.number().int().optional(),
    createdAt: z.string().datetime().optional(),
  })
);

export const productSchema = registry.register(
  "Product",
  z.object({
    id: z.string().uuid(),
    sku: z.string().openapi({ example: "MKN-001" }),
    name: z.string().openapi({ example: "Keripik Singkong" }),
    description: z.string().nullable(),
    price: z.number().int().openapi({
      description: "Harga dalam rupiah penuh (integer), bukan Decimal.",
      example: 15000,
    }),
    stock: z.number().int(),
    lowStockThreshold: z.number().int(),
    isActive: z.boolean(),
    categoryId: z.string().uuid().nullable(),
    category: z
      .object({ id: z.string().uuid(), name: z.string() })
      .nullable()
      .optional(),
  })
);

export const orderItemSchema = registry.register(
  "OrderItem",
  z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    productNameSnapshot: z.string().openapi({
      description: "Nama produk saat pesanan dibuat; tidak ikut berubah bila produk diganti nama.",
    }),
    unitPrice: z.number().int(),
    quantity: z.number().int(),
    lineTotal: z.number().int(),
  })
);

export const orderSchema = registry.register(
  "Order",
  z.object({
    id: z.string().uuid(),
    orderNumber: z.string().openapi({ example: "ORD-20261020-8EX54X" }),
    status: z.enum(["pending", "processing", "completed", "cancelled"]),
    paymentMethod: z
      .enum(["TUNAI", "QRIS", "TRANSFER"])
      .nullable()
      .openapi({ description: "Kosong untuk pesanan lama yang dibuat sebelum kolom ini ada." }),
    amountPaid: z
      .number().int()
      .nullable()
      .openapi({ description: "Uang diterima (Rp); kembalian = amountPaid − total. Hanya relevan untuk tunai." }),
    subtotal: z.number().int(),
    discount: z.number().int(),
    total: z.number().int(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime().optional(),
    items: z.array(orderItemSchema).optional(),
  })
);

export const statusHistorySchema = registry.register(
  "OrderStatusHistory",
  z.object({
    id: z.string().uuid(),
    oldStatus: z.string().nullable(),
    newStatus: z.string(),
    changedAt: z.string().datetime(),
  })
);

export const paginatedProductsSchema = registry.register(
  "PaginatedProducts",
  z.object({
    items: z.array(productSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
);

export const stockMovementSchema = registry.register(
  "StockMovement",
  z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    delta: z
      .number().int()
      .openapi({ description: "Bertanda: positif = stok bertambah, negatif = stok berkurang." }),
    type: z.enum(["MASUK", "KELUAR", "PENJUALAN", "PEMBATALAN"]),
    reason: z
      .string().nullable()
      .openapi({ description: "Alasan manual; null untuk gerakan otomatis dari pesanan." }),
    orderId: z.string().uuid().nullable(),
    createdAt: z.string().datetime().optional(),
    product: z.object({ id: z.string().uuid(), name: z.string(), sku: z.string() }).optional(),
    user: z.object({ id: z.string().uuid(), name: z.string() }).optional(),
    order: z
      .object({ id: z.string().uuid(), orderNumber: z.string() })
      .nullable()
      .optional(),
  })
);

export const userSchema = registry.register(
  "User",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["owner", "admin", "kasir", "stock_manager", "staff"]),
    createdAt: z.string().datetime().optional(),
  })
);

/* ------------------------------------------------------------------ *
 * Input (request body / query)
 * ------------------------------------------------------------------ */

export const loginInput = registry.register(
  "LoginInput",
  z.object({
    email: z.string().email().openapi({ example: "owner@niagaflow.test" }),
    password: z.string().min(1).openapi({ example: "password123" }),
  })
);

export const categoryInput = registry.register(
  "CategoryInput",
  z.object({ name: z.string().min(1).max(100) })
);

export const productInput = registry.register(
  "ProductInput",
  z.object({
    name: z.string().min(1).max(200),
    sku: z.string().min(1).max(50),
    categoryId: z.string().uuid().nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    price: z.number().int().min(0),
    stock: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0),
  })
);

export const productUpdateInput = registry.register(
  "ProductUpdateInput",
  productInput.partial()
);

export const orderInput = registry.register(
  "OrderInput",
  z.object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1),
        })
      )
      .min(1),
    discount: z.number().int().min(0).default(0),
    paymentMethod: z
      .enum(["TUNAI", "QRIS", "TRANSFER"])
      .nullable()
      .optional()
      .openapi({ description: "Opsional demi kompatibilitas; UI selalu mengirim nilai." }),
    amountPaid: z
      .number().int().min(0)
      .nullable()
      .optional()
      .openapi({ description: "Wajib menutup total bila diisi; server menolak dengan `PAYMENT_INSUFFICIENT`." }),
    notes: z.string().max(2000).nullable().optional(),
  })
);

export const statusInput = registry.register(
  "OrderStatusInput",
  z.object({
    status: z.enum(["pending", "processing", "completed", "cancelled"]),
  })
);

export const stockMovementInput = registry.register(
  "StockMovementInput",
  z.object({
    productId: z.string().uuid(),
    type: z.enum(["MASUK", "KELUAR"]),
    quantity: z.number().int().min(1),
    reason: z.string().min(1).max(500),
  })
);

export const userInput = registry.register(
  "UserInput",
  z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(200),
    role: z.enum(["owner", "admin", "kasir", "stock_manager", "staff"]),
  })
);

export const userUpdateInput = registry.register(
  "UserUpdateInput",
  z.object({
    name: z.string().min(2).max(100).optional(),
    password: z.string().min(8).max(200).optional(),
    role: z.enum(["owner", "admin", "kasir", "stock_manager", "staff"]).optional(),
  })
);

/* ------------------------------------------------------------------ *
 * Helper respons
 * ------------------------------------------------------------------ */

export function jsonResponse(description: string, schema: z.ZodTypeAny) {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

export const errorResponse = (description: string) =>
  jsonResponse(description, errorSchema);

export const securedResponses = {
  401: errorResponse("Belum login atau sesi tidak valid."),
  403: errorResponse("Role tidak diizinkan."),
};

export { okSchema, z };
