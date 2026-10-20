import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { Fixtures } from "./helpers";
import { agent, loginCookie, resetFixtures } from "./helpers";
import { prisma } from "../src/utils/prisma";

let fx: Fixtures;
let cookie: string;

beforeEach(async () => {
  fx = await resetFixtures();
  cookie = await loginCookie(fx.owner.email);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("buat pesanan", () => {
  it("pesanan sukses mengurangi stok dan menghitung total di server (number)", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 4 }] });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const order = res.body.data;
    // 4 × 15.000 = 60.000 — dihitung backend, bukan dari klien
    expect(order.subtotal).toBe(60000);
    expect(order.discount).toBe(0);
    expect(order.total).toBe(60000);
    expect(typeof order.subtotal).toBe("number");
    expect(typeof order.total).toBe("number");

    const after = await prisma.product.findUnique({ where: { id: fx.keripik.id } });
    expect(after?.stock).toBe(46); // 50 - 4

    // server mengabaikan harga yang mungkin dikirim klien
    const forged = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 1, unitPrice: 1 }] });
    expect(forged.status).toBe(201);
    expect(forged.body.data.subtotal).toBe(15000);
  });

  it("diskon mengurangi total dan disimpan", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.kue.id, quantity: 2 }], discount: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(70000); // 2 × 35.000
    expect(res.body.data.discount).toBe(5000);
    expect(res.body.data.total).toBe(65000);
  });

  it("mencatat riwayat status awal (old_status null → pending)", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.teh.id, quantity: 2 }] });

    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: res.body.data.id },
    });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ oldStatus: null, newStatus: "pending" });
  });

  it("menyimpan snapshot nama produk & harga satuan di item", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 1 }] });

    const item = await prisma.orderItem.findFirst({ where: { orderId: res.body.data.id } });
    expect(item?.productNameSnapshot).toBe("Keripik Singkong");
    expect(Number(item?.unitPrice)).toBe(15000);

    // ganti nama produk tidak boleh mengubah snapshot pesanan lama
    await prisma.product.update({ where: { id: fx.keripik.id }, data: { name: "Nama Baru" } });
    const reread = await prisma.orderItem.findUnique({ where: { id: item!.id } });
    expect(reread?.productNameSnapshot).toBe("Keripik Singkong");
  });

  it("stok kurang → 409 INSUFFICIENT_STOCK dan stok tidak berubah (rollback)", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.kue.id, quantity: 99 }] });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, error: { code: "INSUFFICIENT_STOCK" } });

    const after = await prisma.product.findUnique({ where: { id: fx.kue.id } });
    expect(after?.stock).toBe(3);
    expect(await prisma.order.count()).toBe(0);
  });

  it("rollback penuh: item pertama valid, item kedua melebihi stok → tidak ada pesanan/stok berubah", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({
        items: [
          { productId: fx.keripik.id, quantity: 5 }, // valid
          { productId: fx.kue.id, quantity: 99 }, // gagal
        ],
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
    expect(await prisma.order.count()).toBe(0);

    const keripik = await prisma.product.findUnique({ where: { id: fx.keripik.id } });
    const kue = await prisma.product.findUnique({ where: { id: fx.kue.id } });
    expect(keripik?.stock).toBe(50);
    expect(kue?.stock).toBe(3);
  });

  it("produk diarsipkan → 400 PRODUCT_ARCHIVED", async () => {
    await prisma.product.update({ where: { id: fx.teh.id }, data: { isActive: false } });

    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.teh.id, quantity: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("PRODUCT_ARCHIVED");
  });

  it("diskon melebihi subtotal → 400 DISCOUNT_EXCEEDS_TOTAL", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.kue.id, quantity: 1 }], discount: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("DISCOUNT_EXCEEDS_TOTAL");
    expect(await prisma.order.count()).toBe(0);
  });

  it("jumlah 0 / keranjang kosong → 400 VALIDATION_ERROR", async () => {
    const zero = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.teh.id, quantity: 0 }] });
    expect(zero.status).toBe(400);
    expect(zero.body.error.code).toBe("VALIDATION_ERROR");

    const empty = await agent().post("/api/v1/orders").set("Cookie", cookie).send({ items: [] });
    expect(empty.status).toBe(400);
  });

  it("tanpa sesi → 401", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .send({ items: [{ productId: fx.teh.id, quantity: 1 }] });
    expect(res.status).toBe(401);
  });
});

describe("status pesanan & pembatalan", () => {
  async function createOrder(productId: string, quantity: number, discount = 0) {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId, quantity }], discount });
    expect(res.status).toBe(201);
    return res.body.data;
  }

  it("transisi pending → processing → completed dicatat di riwayat", async () => {
    const order = await createOrder(fx.keripik.id, 2);

    const p = await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "processing" });
    expect(p.status).toBe(200);
    expect(p.body.data.status).toBe("processing");

    const c = await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "completed" });
    expect(c.status).toBe(200);
    expect(c.body.data.status).toBe("completed");

    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: order.id },
      orderBy: { changedAt: "asc" },
    });
    expect(history.map((h) => h.newStatus)).toEqual(["pending", "processing", "completed"]);
  });

  it("transisi tidak valid → 400 INVALID_TRANSITION (pending → completed)", async () => {
    const order = await createOrder(fx.keripik.id, 1);

    const res = await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "completed" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("status terminal tidak bisa diubah lagi → 400", async () => {
    const order = await createOrder(fx.keripik.id, 1);
    // pending → processing → completed (completed adalah status terminal)
    await agent().patch(`/api/v1/orders/${order.id}/status`).set("Cookie", cookie).send({ status: "processing" });
    const done = await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "completed" });
    expect(done.body.data.status).toBe("completed");

    const res = await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "cancelled" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("cancel mengembalikan stok tepat sekali; cancel kedua ditolak", async () => {
    const order = await createOrder(fx.kue.id, 2); // stok 3 → 1

    expect((await prisma.product.findUnique({ where: { id: fx.kue.id } }))?.stock).toBe(1);

    const cancel = await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "cancelled" });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe("cancelled");

    // 1 + 2 = 3 (kembali ke semula, tidak dobel)
    expect((await prisma.product.findUnique({ where: { id: fx.kue.id } }))?.stock).toBe(3);

    const again = await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "cancelled" });
    expect(again.status).toBe(400);
    expect((await prisma.product.findUnique({ where: { id: fx.kue.id } }))?.stock).toBe(3);
  });

  it("membatalkan pesanan multi-item mengembalikan stok semua item", async () => {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({
        items: [
          { productId: fx.keripik.id, quantity: 3 }, // 50 → 47
          { productId: fx.teh.id, quantity: 10 }, // 120 → 110
        ],
      });
    const order = res.body.data;

    const before = await Promise.all([
      prisma.product.findUnique({ where: { id: fx.keripik.id } }),
      prisma.product.findUnique({ where: { id: fx.teh.id } }),
    ]);
    expect(before[0]?.stock).toBe(47);
    expect(before[1]?.stock).toBe(110);

    await agent()
      .patch(`/api/v1/orders/${order.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "cancelled" });

    const after = await Promise.all([
      prisma.product.findUnique({ where: { id: fx.keripik.id } }),
      prisma.product.findUnique({ where: { id: fx.teh.id } }),
    ]);
    expect(after[0]?.stock).toBe(50);
    expect(after[1]?.stock).toBe(120);
  });

  it("id pesanan tidak valid → 400 INVALID_ID; id tidak ada → 404", async () => {
    const bad = await agent()
      .patch("/api/v1/orders/bukan-uuid/status")
      .set("Cookie", cookie)
      .send({ status: "processing" });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("INVALID_ID");

    const missing = await agent()
      .patch("/api/v1/orders/11111111-1111-4111-8111-111111111111/status")
      .set("Cookie", cookie)
      .send({ status: "processing" });
    expect(missing.status).toBe(404);
  });
});

describe("laporan", () => {
  /** Buat pesanan lalu (opsional) ubah ke completed; kembalikan id-nya. */
  async function seedOrder(opts: {
    productId: string;
    quantity: number;
    complete?: boolean;
    cancel?: boolean;
  }) {
    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: opts.productId, quantity: opts.quantity }] });
    const id = res.body.data.id as string;
    if (opts.complete) {
      await agent().patch(`/api/v1/orders/${id}/status`).set("Cookie", cookie).send({ status: "processing" });
      await agent().patch(`/api/v1/orders/${id}/status`).set("Cookie", cookie).send({ status: "completed" });
    }
    if (opts.cancel) {
      await agent().patch(`/api/v1/orders/${id}/status`).set("Cookie", cookie).send({ status: "cancelled" });
    }
    return id;
  }

  it("total penjualan hanya menghitung pesanan completed", async () => {
    await seedOrder({ productId: fx.keripik.id, quantity: 2, complete: true }); // 30.000
    await seedOrder({ productId: fx.kue.id, quantity: 1, complete: true }); // 35.000
    await seedOrder({ productId: fx.teh.id, quantity: 5 }); // pending, tidak dihitung
    await seedOrder({ productId: fx.teh.id, quantity: 5, cancel: true }); // cancelled, tidak dihitung

    const res = await agent().get("/api/v1/reports/summary").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.totalSalesCompleted).toBe(65000);
  });

  it("dashboard menghitung pesanan hari ini & status", async () => {
    await seedOrder({ productId: fx.keripik.id, quantity: 1, complete: true });
    await seedOrder({ productId: fx.teh.id, quantity: 1 }); // pending

    const res = await agent().get("/api/v1/reports/dashboard").set("Cookie", cookie);
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.ordersToday).toBe(2);
    expect(data.totalSalesCompleted).toBe(15000);
    // produk aktif = 3, low stock = kue (stok 3 ≤ threshold 5)
    expect(data.totalActiveProducts).toBe(3);
    expect(data.lowStockCount).toBe(1);
  });

  it("top products memeringkat berdasarkan qty terjual pada pesanan completed", async () => {
    await seedOrder({ productId: fx.keripik.id, quantity: 3, complete: true });
    await seedOrder({ productId: fx.teh.id, quantity: 20, complete: true });
    await seedOrder({ productId: fx.kue.id, quantity: 3 }); // pending → diabaikan

    const res = await agent().get("/api/v1/reports/top-products").set("Cookie", cookie);
    expect(res.status).toBe(200);

    const rows = res.body.data as Array<{ sku: string; quantitySold: number }>;
    expect(rows.map((r) => r.sku)).toEqual(["MNM-001", "MKN-001"]);
    expect(rows[0].quantitySold).toBe(20);
  });

  it("low-stock mengembalikan produk di bawah/tepat ambang batas", async () => {
    await prisma.product.update({ where: { id: fx.keripik.id }, data: { stock: 0 } });

    const res = await agent().get("/api/v1/reports/low-stock").set("Cookie", cookie);
    expect(res.status).toBe(200);

    const skus = (res.body.data as Array<{ sku: string }>).map((r) => r.sku).sort();
    expect(skus).toEqual(["MKN-001", "MKN-002"]); // keripik 0≤10, kue 3≤5; teh 120>24
  });

  it("filter rentang tanggal membatasi data; rentang kosong → penjualan 0", async () => {
    await seedOrder({ productId: fx.keripik.id, quantity: 2, complete: true });
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const wide = await agent()
      .get(`/api/v1/reports/summary?from=${today}&to=${today}`)
      .set("Cookie", cookie);
    expect(wide.status).toBe(200);
    expect(wide.body.data.totalSalesCompleted).toBe(30000);

    const past = await agent()
      .get("/api/v1/reports/summary?from=2000-01-01&to=2000-01-02")
      .set("Cookie", cookie);
    expect(past.status).toBe(200);
    expect(past.body.data.totalSalesCompleted).toBe(0);
  });

  it("batas tanggal lokal: pesanan dini hari tetap masuk saat difilter tanggal itu", async () => {
    // Pesanan di 00:30 waktu lokal hari ini.
    const early = new Date();
    early.setHours(0, 30, 0, 0);

    const res = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 1 }] });
    const id = res.body.data.id as string;
    await prisma.order.update({ where: { id }, data: { createdAt: early } });
    await agent().patch(`/api/v1/orders/${id}/status`).set("Cookie", cookie).send({ status: "processing" });
    await agent().patch(`/api/v1/orders/${id}/status`).set("Cookie", cookie).send({ status: "completed" });

    const y = early.getFullYear();
    const m = String(early.getMonth() + 1).padStart(2, "0");
    const d = String(early.getDate()).padStart(2, "0");
    const day = `${y}-${m}-${d}`;

    const oneDay = await agent()
      .get(`/api/v1/reports/summary?from=${day}&to=${day}`)
      .set("Cookie", cookie);

    expect(oneDay.status).toBe(200);
    // 1 × 15.000 — pesanan 00:30 lokal harus ikut terhitung di tanggal ini.
    expect(oneDay.body.data.totalSalesCompleted).toBe(15000);
  });

  it("semua endpoint laporan → 401 tanpa sesi", async () => {
    for (const path of ["dashboard", "summary", "top-products", "low-stock"]) {
      const res = await agent().get(`/api/v1/reports/${path}`);
      expect(res.status, path).toBe(401);
    }
  });
});
