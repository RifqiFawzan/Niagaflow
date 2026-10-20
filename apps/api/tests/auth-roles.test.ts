import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { Fixtures } from "./helpers";
import { agent, loginCookie, resetFixtures } from "./helpers";
import { prisma } from "../src/utils/prisma";

let fx: Fixtures;

beforeEach(async () => {
  fx = await resetFixtures();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("auth", () => {
  it("login sukses mengembalikan user + cookie sesi HttpOnly", async () => {
    const res = await agent()
      .post("/api/v1/auth/login")
      .send({ email: fx.owner.email, password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ email: fx.owner.email, role: "owner" });
    expect(res.body.data).not.toHaveProperty("passwordHash");

    const raw = res.headers["set-cookie"];
    const cookies = Array.isArray(raw) ? raw : [raw];
    const session = cookies.find((c) => c?.startsWith("session="));
    expect(session, "cookie sesi harus dikirim").toBeTruthy();
    expect(session).toMatch(/HttpOnly/i);
  });

  it("login dengan password salah → 401 INVALID_CREDENTIALS", async () => {
    const res = await agent()
      .post("/api/v1/auth/login")
      .send({ email: fx.owner.email, password: "salah-banget" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: "INVALID_CREDENTIALS" },
    });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("login dengan email tidak dikenal → 401 (pesan tidak membocorkan keberadaan akun)", async () => {
    const res = await agent()
      .post("/api/v1/auth/login")
      .send({ email: "tidak-ada@test.local", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("/me tanpa sesi → 401 UNAUTHORIZED", async () => {
    const res = await agent().get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("/me dengan sesi mengembalikan user yang login", async () => {
    const cookie = await loginCookie(fx.staff.email);
    const res = await agent().get("/api/v1/auth/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: fx.staff.email, role: "staff" });
  });

  it("logout menghapus cookie sesi", async () => {
    const cookie = await loginCookie(fx.owner.email);
    const res = await agent().post("/api/v1/auth/logout").set("Cookie", cookie);

    expect(res.status).toBe(200);
    const raw = res.headers["set-cookie"];
    const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const cleared = cookies.find((c) => c.startsWith("session="));
    expect(cleared, "logout harus mengirim ulang cookie kosong").toBeTruthy();
    expect(cleared).toMatch(/session=;|Expires=Thu, 01 Jan 1970/i);
  });
});

describe("izin role", () => {
  it("staf tidak boleh mengelola produk (POST) → 403 FORBIDDEN", async () => {
    const cookie = await loginCookie(fx.staff.email);
    const res = await agent()
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ categoryId: fx.makanan.id, sku: "NEW-001", name: "Produk Baru", price: 10000, stock: 5, lowStockThreshold: 2 });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ success: false, error: { code: "FORBIDDEN" } });
  });

  it("staf tidak boleh menghapus kategori → 403", async () => {
    const cookie = await loginCookie(fx.staff.email);
    const res = await agent().delete(`/api/v1/categories/${fx.minuman.id}`).set("Cookie", cookie);
    expect(res.status).toBe(403);
  });

  it("staf tidak boleh mengakses laporan owner-only → 403", async () => {
    const cookie = await loginCookie(fx.staff.email);
    const summary = await agent().get("/api/v1/reports/summary").set("Cookie", cookie);
    const top = await agent().get("/api/v1/reports/top-products").set("Cookie", cookie);

    expect(summary.status).toBe(403);
    expect(top.status).toBe(403);
  });

  it("staf boleh melihat produk & membuat pesanan", async () => {
    const cookie = await loginCookie(fx.staff.email);
    const list = await agent().get("/api/v1/products").set("Cookie", cookie);
    expect(list.status).toBe(200);

    const order = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 1 }] });
    expect(order.status).toBe(201);
  });

  it("owner boleh mengelola produk", async () => {
    const cookie = await loginCookie(fx.owner.email);
    const res = await agent()
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        categoryId: fx.makanan.id,
        sku: "NEW-OWNER-001",
        name: "Produk Owner",
        price: 12000,
        stock: 7,
        lowStockThreshold: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ sku: "NEW-OWNER-001", price: 12000 });
  });
});

describe("SKU unik", () => {
  it("SKU duplikat → 409 SKU_DUPLICATE", async () => {
    const cookie = await loginCookie(fx.owner.email);
    const res = await agent()
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        categoryId: fx.minuman.id,
        sku: "MKN-001", // sama dengan fixture, huruf besar
        name: "Duplikat",
        price: 1000,
        stock: 1,
        lowStockThreshold: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, error: { code: "SKU_DUPLICATE" } });
    expect(await prisma.product.count({ where: { sku: "MKN-001" } })).toBe(1);
  });
});
