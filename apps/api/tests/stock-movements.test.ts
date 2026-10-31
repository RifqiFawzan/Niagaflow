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

type Movement = {
  type: string;
  delta: number;
  reason: string | null;
  product?: { name: string };
  order?: { orderNumber: string } | null;
};

async function listMovements(query = ""): Promise<Movement[]> {
  const res = await agent().get(`/api/v1/stock-movements${query}`).set("Cookie", cookie);
  expect(res.status).toBe(200);
  return res.body.data.items as Movement[];
}

describe("stok masuk/keluar manual", () => {
  it("stok masuk menambah stok dan mencatat riwayat", async () => {
    const res = await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({
        productId: fx.keripik.id,
        type: "MASUK",
        quantity: 5,
        reason: "Restok dari supplier",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.delta).toBe(5);
    expect(res.body.data.type).toBe("MASUK");
    expect(res.body.data.reason).toBe("Restok dari supplier");
    expect(res.body.data.product.name).toBe("Keripik Singkong");
    expect(res.body.data.user.name).toBe("Owner Test");

    const product = await prisma.product.findUnique({ where: { id: fx.keripik.id } });
    expect(product?.stock).toBe(55);
  });

  it("stok keluar mengurangi stok dengan alasan", async () => {
    const res = await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({ productId: fx.keripik.id, type: "KELUAR", quantity: 4, reason: "Rusak" });

    expect(res.status).toBe(201);
    expect(res.body.data.delta).toBe(-4);

    const product = await prisma.product.findUnique({ where: { id: fx.keripik.id } });
    expect(product?.stock).toBe(46);
  });

  it("menolak keluar melebihi stok (INSUFFICIENT_STOCK)", async () => {
    const res = await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({ productId: fx.keripik.id, type: "KELUAR", quantity: 999, reason: "Salah" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");

    const product = await prisma.product.findUnique({ where: { id: fx.keripik.id } });
    expect(product?.stock).toBe(50); // tidak berubah
    expect(await prisma.stockMovement.count()).toBe(0); // tidak ada baris setengah jadi
  });

  it("menolak alasan kosong (VALIDATION_ERROR)", async () => {
    const res = await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({ productId: fx.keripik.id, type: "MASUK", quantity: 1, reason: "  " });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("staf tidak boleh mencatat pergerakan (403)", async () => {
    const staffCookie = await loginCookie(fx.staff.email);
    const res = await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", staffCookie)
      .send({ productId: fx.keripik.id, type: "MASUK", quantity: 1, reason: "Halo" });

    expect(res.status).toBe(403);
    expect(await prisma.stockMovement.count()).toBe(0);
  });
});

describe("daftar riwayat", () => {
  it("terbaru di atas, punya field paginasi, dan bisa difilter produk", async () => {
    await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({ productId: fx.keripik.id, type: "MASUK", quantity: 5, reason: "Restok" });
    await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({ productId: fx.teh.id, type: "KELUAR", quantity: 10, reason: "Pindah gudang" });

    const all = await agent().get("/api/v1/stock-movements").set("Cookie", cookie);
    expect(all.status).toBe(200);
    expect(all.body.data.total).toBe(2);
    expect(all.body.data.page).toBe(1);
    expect(all.body.data.items[0].type).toBe("KELUAR"); // terakhir dibuat
    expect(all.body.data.items[0].product.name).toBe("Teh Manis Jumbo");

    const filtered = await listMovements(`?productId=${fx.keripik.id}`);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe("MASUK");
  });
});

describe("gerakan otomatis dari transaksi", () => {
  it("buat pesanan mencatat PENJUALAN dan mengurangi stok", async () => {
    const orderRes = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 4 }] });
    expect(orderRes.status).toBe(201);

    const product = await prisma.product.findUnique({ where: { id: fx.keripik.id } });
    expect(product?.stock).toBe(46);

    const movement = (await listMovements()).find((m) => m.type === "PENJUALAN");
    expect(movement).toBeTruthy();
    expect(movement!.delta).toBe(-4);
    expect(movement!.order?.orderNumber).toBe(orderRes.body.data.orderNumber);
  });

  it("batalkan pesanan mencatat PEMBATALAN dan stok kembali", async () => {
    const orderRes = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 4 }] });
    const cancel = await agent()
      .patch(`/api/v1/orders/${orderRes.body.data.id}/status`)
      .set("Cookie", cookie)
      .send({ status: "cancelled" });
    expect(cancel.status).toBe(200);

    const product = await prisma.product.findUnique({ where: { id: fx.keripik.id } });
    expect(product?.stock).toBe(50);

    const movement = (await listMovements()).find((m) => m.type === "PEMBATALAN");
    expect(movement).toBeTruthy();
    expect(movement!.delta).toBe(4);
  });

  it("ubah stok lewat update produk mencatat riwayat", async () => {
    const res = await agent()
      .patch(`/api/v1/products/${fx.keripik.id}`)
      .set("Cookie", cookie)
      .send({ stock: 60 });
    expect(res.status).toBe(200);

    const movement = (await listMovements())[0];
    expect(movement.type).toBe("MASUK");
    expect(movement.delta).toBe(10);
    expect(movement.reason).toBe("Penyesuaian lewat ubah produk");
    expect(movement.product?.name).toBe("Keripik Singkong");
  });

  it("produk baru mencatat stok awal", async () => {
    const res = await agent()
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        name: "Produk Baru",
        sku: "BRG-001",
        price: 1000,
        stock: 12,
        lowStockThreshold: 2,
      });
    expect(res.status).toBe(201);

    const movement = (await listMovements())[0];
    expect(movement.reason).toBe("Stok awal produk baru");
    expect(movement.delta).toBe(12);
  });
});
