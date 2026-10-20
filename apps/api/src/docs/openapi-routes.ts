import {
  errorResponse,
  jsonResponse,
  okSchema,
  orderInput,
  orderSchema,
  orderItemSchema,
  paginatedProductsSchema,
  productInput,
  productSchema,
  productUpdateInput,
  categoryInput,
  categorySchema,
  customerInput,
  customerSchema,
  loginInput,
  registry,
  securedResponses,
  sessionUserSchema,
  statusHistorySchema,
  statusInput,
  z,
} from "./openapi-schemas";

const BASE = "/api/v1";

/* ------------------------------------------------------------------ *
 * Health
 * ------------------------------------------------------------------ */

registry.registerPath({
  method: "get",
  path: `${BASE}/health`,
  tags: ["Health"],
  summary: "Cek status server",
  responses: {
    200: jsonResponse(
      "Server hidup.",
      okSchema(z.object({ status: z.string().openapi({ example: "ok" }) }))
    ),
  },
});

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

registry.registerPath({
  method: "post",
  path: `${BASE}/auth/login`,
  tags: ["Auth"],
  summary: "Masuk dan dapatkan cookie sesi",
  description:
    "Berhasil: mengirim cookie `session` (HttpOnly, SameSite=None di production " +
    "karena frontend dan backend berdiri di domain berbeda; SameSite=Lax di lokal) " +
    "dan data user. " +
    "Dibatasi 10 percobaan per menit per alamat IP.",
  request: { body: { content: { "application/json": { schema: loginInput } } } },
  responses: {
    200: jsonResponse("Login berhasil.", okSchema(sessionUserSchema)),
    400: errorResponse("Email atau password tidak lolos validasi."),
    401: errorResponse("Email atau password salah."),
    429: errorResponse("Terlalu banyak percobaan login."),
  },
});

registry.registerPath({
  method: "post",
  path: `${BASE}/auth/logout`,
  tags: ["Auth"],
  summary: "Keluar dan hapus cookie sesi",
  responses: { 200: jsonResponse("Logout berhasil.", okSchema(z.null())) },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/auth/me`,
  tags: ["Auth"],
  summary: "Data user yang sedang login",
  responses: {
    200: jsonResponse("Data user.", okSchema(sessionUserSchema)),
    ...securedResponses,
  },
});

/* ------------------------------------------------------------------ *
 * Kategori
 * ------------------------------------------------------------------ */

registry.registerPath({
  method: "get",
  path: `${BASE}/categories`,
  tags: ["Kategori"],
  summary: "Daftar kategori (semua user login)",
  responses: {
    200: jsonResponse("Daftar kategori.", okSchema(z.array(categorySchema))),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "post",
  path: `${BASE}/categories`,
  tags: ["Kategori"],
  summary: "Tambah kategori (owner)",
  request: { body: { content: { "application/json": { schema: categoryInput } } } },
  responses: {
    201: jsonResponse("Kategori dibuat.", okSchema(categorySchema)),
    400: errorResponse("Nama kategori tidak valid."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: `${BASE}/categories/{id}`,
  tags: ["Kategori"],
  summary: "Ubah nama kategori (owner)",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: categoryInput } } },
  },
  responses: {
    200: jsonResponse("Kategori diubah.", okSchema(categorySchema)),
    400: errorResponse("Id atau nama tidak valid."),
    404: errorResponse("Kategori tidak ditemukan."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "delete",
  path: `${BASE}/categories/{id}`,
  tags: ["Kategori"],
  summary: "Hapus kategori (owner, hanya jika belum dipakai produk)",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonResponse("Kategori dihapus.", okSchema(z.null())),
    404: errorResponse("Kategori tidak ditemukan."),
    409: errorResponse("Kategori masih dipakai produk (`CATEGORY_IN_USE`)."),
    ...securedResponses,
  },
});

/* ------------------------------------------------------------------ *
 * Produk
 * ------------------------------------------------------------------ */

registry.registerPath({
  method: "get",
  path: `${BASE}/products`,
  tags: ["Produk"],
  summary: "Daftar produk dengan pencarian, filter, dan halaman",
  request: {
    query: z.object({
      q: z.string().optional().openapi({ description: "Cari di nama atau SKU." }),
      categoryId: z.string().uuid().optional(),
      sort: z.string().optional().openapi({ example: "name" }),
      order: z.enum(["asc", "desc"]).optional(),
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
      includeArchived: z
        .enum(["true", "false"])
        .optional()
        .openapi({ description: "Set `true` untuk ikut menampilkan produk arsip." }),
    }),
  },
  responses: {
    200: jsonResponse("Daftar produk.", okSchema(paginatedProductsSchema)),
    400: errorResponse("Parameter query tidak valid."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/products/{id}`,
  tags: ["Produk"],
  summary: "Detail satu produk",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonResponse("Detail produk.", okSchema(productSchema)),
    400: errorResponse("Id bukan UUID."),
    404: errorResponse("Produk tidak ditemukan."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "post",
  path: `${BASE}/products`,
  tags: ["Produk"],
  summary: "Tambah produk (owner)",
  request: { body: { content: { "application/json": { schema: productInput } } } },
  responses: {
    201: jsonResponse("Produk dibuat.", okSchema(productSchema)),
    400: errorResponse("Data produk tidak valid."),
    409: errorResponse("SKU sudah dipakai (`SKU_DUPLICATE`)."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: `${BASE}/products/{id}`,
  tags: ["Produk"],
  summary: "Ubah produk (owner)",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: productUpdateInput } } },
  },
  responses: {
    200: jsonResponse("Produk diubah.", okSchema(productSchema)),
    400: errorResponse("Data produk tidak valid."),
    404: errorResponse("Produk tidak ditemukan."),
    409: errorResponse("SKU sudah dipakai (`SKU_DUPLICATE`)."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: `${BASE}/products/{id}/archive`,
  tags: ["Produk"],
  summary: "Arsipkan atau aktifkan lagi produk (owner)",
  description: "Produk arsip tidak muncul di daftar aktif dan tidak bisa dipesan lagi.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ isActive: z.boolean() }),
        },
      },
    },
  },
  responses: {
    200: jsonResponse("Status arsip diubah.", okSchema(productSchema)),
    400: errorResponse("Id atau isi tidak valid."),
    404: errorResponse("Produk tidak ditemukan."),
    ...securedResponses,
  },
});

/* ------------------------------------------------------------------ *
 * Pelanggan
 * ------------------------------------------------------------------ */

registry.registerPath({
  method: "get",
  path: `${BASE}/customers`,
  tags: ["Pelanggan"],
  summary: "Daftar pelanggan",
  request: {
    query: z.object({ q: z.string().optional() }),
  },
  responses: {
    200: jsonResponse("Daftar pelanggan.", okSchema(z.array(customerSchema))),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/customers/{id}`,
  tags: ["Pelanggan"],
  summary: "Detail satu pelanggan",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonResponse("Detail pelanggan.", okSchema(customerSchema)),
    400: errorResponse("Id bukan UUID."),
    404: errorResponse("Pelanggan tidak ditemukan."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/customers/{id}/orders`,
  tags: ["Pelanggan"],
  summary: "Riwayat pesanan milik satu pelanggan",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonResponse("Riwayat pesanan.", okSchema(z.array(orderSchema))),
    404: errorResponse("Pelanggan tidak ditemukan."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "post",
  path: `${BASE}/customers`,
  tags: ["Pelanggan"],
  summary: "Tambah pelanggan (owner)",
  request: { body: { content: { "application/json": { schema: customerInput } } } },
  responses: {
    201: jsonResponse("Pelanggan dibuat.", okSchema(customerSchema)),
    400: errorResponse("Data pelanggan tidak valid."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: `${BASE}/customers/{id}`,
  tags: ["Pelanggan"],
  summary: "Ubah pelanggan (owner)",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: customerInput.partial() } } },
  },
  responses: {
    200: jsonResponse("Pelanggan diubah.", okSchema(customerSchema)),
    404: errorResponse("Pelanggan tidak ditemukan."),
    ...securedResponses,
  },
});

/* ------------------------------------------------------------------ *
 * Pesanan
 * ------------------------------------------------------------------ */

registry.registerPath({
  method: "get",
  path: `${BASE}/orders`,
  tags: ["Pesanan"],
  summary: "Daftar pesanan dengan filter status dan halaman",
  request: {
    query: z.object({
      status: z.enum(["pending", "processing", "completed", "cancelled"]).optional(),
      q: z.string().optional().openapi({ description: "Cari di nomor pesanan / nama pelanggan." }),
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  responses: {
    200: jsonResponse(
      "Daftar pesanan.",
      okSchema(
        z.object({
          items: z.array(orderSchema),
          page: z.number().int(),
          pageSize: z.number().int(),
          total: z.number().int(),
          totalPages: z.number().int(),
        })
      )
    ),
    400: errorResponse("Parameter query tidak valid."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/orders/{id}`,
  tags: ["Pesanan"],
  summary: "Detail pesanan beserta item dan riwayat status",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonResponse(
      "Detail pesanan.",
      okSchema(
        orderSchema.extend({
          items: z.array(orderItemSchema),
          statusHistory: z.array(statusHistorySchema),
        })
      )
    ),
    400: errorResponse("Id bukan UUID."),
    404: errorResponse("Pesanan tidak ditemukan."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "post",
  path: `${BASE}/orders`,
  tags: ["Pesanan"],
  summary: "Buat pesanan (owner & staff)",
  description:
    "Total dihitung server dari harga produk saat itu; harga yang dikirim klien diabaikan. " +
    "Stok dikurangi dalam satu transaksi. Bila ada item yang stoknya kurang, seluruh pesanan dibatalkan.",
  request: { body: { content: { "application/json": { schema: orderInput } } } },
  responses: {
    201: jsonResponse("Pesanan dibuat.", okSchema(orderSchema)),
    400: errorResponse("Data pesanan tidak valid, produk arsip, atau diskon melebihi subtotal."),
    409: errorResponse("Stok tidak mencukupi (`INSUFFICIENT_STOCK`)."),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: `${BASE}/orders/{id}/status`,
  tags: ["Pesanan"],
  summary: "Ubah status pesanan (owner & staff)",
  description:
    "Alur status: `pending` -> `processing` -> `completed`. " +
    "Pesanan juga bisa dibatalkan dari `pending` atau `processing`; saat dibatalkan stok dikembalikan. " +
    "Status `completed` dan `cancelled` bersifat akhir dan tidak bisa diubah lagi.",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: statusInput } } },
  },
  responses: {
    200: jsonResponse("Status diubah.", okSchema(orderSchema)),
    400: errorResponse("Perubahan status tidak diizinkan (`INVALID_TRANSITION`)."),
    404: errorResponse("Pesanan tidak ditemukan."),
    ...securedResponses,
  },
});

/* ------------------------------------------------------------------ *
 * Laporan
 * ------------------------------------------------------------------ */

const rangeQuery = z.object({
  from: z.string().optional().openapi({ example: "2026-10-01" }),
  to: z.string().optional().openapi({ example: "2026-10-20" }),
});

registry.registerPath({
  method: "get",
  path: `${BASE}/reports/dashboard`,
  tags: ["Laporan"],
  summary: "Ringkasan untuk halaman dashboard (semua user login)",
  responses: {
    200: jsonResponse(
      "Ringkasan dashboard.",
      okSchema(
        z.object({
          totalActiveProducts: z.number().int(),
          ordersToday: z.number().int(),
          totalSalesCompleted: z.number().int(),
          lowStockCount: z.number().int(),
          recentOrders: z.array(orderSchema),
        })
      )
    ),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/reports/summary`,
  tags: ["Laporan"],
  summary: "Total penjualan (owner)",
  description: "Hanya menghitung pesanan berstatus `completed`. Rentang tanggal memakai waktu lokal server.",
  request: { query: rangeQuery },
  responses: {
    200: jsonResponse(
      "Ringkasan penjualan.",
      okSchema(
        z.object({
          totalSalesCompleted: z.number().int(),
          ordersCompleted: z.number().int().optional(),
          from: z.string().optional(),
          to: z.string().optional(),
        })
      )
    ),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/reports/top-products`,
  tags: ["Laporan"],
  summary: "Produk terlaris (owner)",
  request: { query: rangeQuery },
  responses: {
    200: jsonResponse(
      "Produk terlaris.",
      okSchema(
        z.array(
          z.object({
            sku: z.string(),
            name: z.string(),
            quantitySold: z.number().int(),
          })
        )
      )
    ),
    ...securedResponses,
  },
});

registry.registerPath({
  method: "get",
  path: `${BASE}/reports/low-stock`,
  tags: ["Laporan"],
  summary: "Produk yang stoknya menipis (semua user login)",
  responses: {
    200: jsonResponse(
      "Daftar produk stok menipis.",
      okSchema(
        z.array(
          z.object({
            id: z.string().uuid(),
            sku: z.string(),
            name: z.string(),
            stock: z.number().int(),
            lowStockThreshold: z.number().int(),
          })
        )
      )
    ),
    ...securedResponses,
  },
});
