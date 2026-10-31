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

  it("staf boleh MEMBACA pelanggan (menu Pelanggan tampil untuk staf)", async () => {
    const cookie = await loginCookie(fx.staff.email);

    const list = await agent().get("/api/v1/customers").set("Cookie", cookie);
    expect(list.status).toBe(200);

    const detail = await agent().get(`/api/v1/customers/${fx.budi.id}`).set("Cookie", cookie);
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({ name: "Budi Santoso" });
  });

  it("staf TIDAK boleh menambah atau mengubah pelanggan → 403", async () => {
    const cookie = await loginCookie(fx.staff.email);

    const create = await agent()
      .post("/api/v1/customers")
      .set("Cookie", cookie)
      .send({ name: "Pelanggan Baru" });
    expect(create.status).toBe(403);

    const update = await agent()
      .patch(`/api/v1/customers/${fx.budi.id}`)
      .set("Cookie", cookie)
      .send({ name: "Diubah Staf" });
    expect(update.status).toBe(403);

    // Pastikan tidak ada data yang berubah.
    const after = await prisma.customer.findUnique({ where: { id: fx.budi.id } });
    expect(after?.name).toBe("Budi Santoso");
  });
});

describe("peran baru (4 jenis, staf lama dipertahankan)", () => {
  it("pengelola stok boleh mengelola produk & mencatat mutasi stok", async () => {
    const cookie = await loginCookie(fx.stockManager.email);

    const product = await agent()
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ categoryId: fx.makanan.id, sku: "SM-001", name: "Produk SM", price: 9000, stock: 4, lowStockThreshold: 1 });
    expect(product.status).toBe(201);

    const movement = await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({ productId: fx.keripik.id, type: "MASUK", quantity: 2, reason: "Restok pemasok" });
    expect(movement.status).toBe(201);

    const category = await agent()
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ name: "Kategori SM" });
    expect(category.status).toBe(201);
  });

  it("kasir TIDAK boleh kelola produk/kategori/mutasi stok → 403", async () => {
    const cookie = await loginCookie(fx.kasir.email);

    const product = await agent()
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ categoryId: fx.makanan.id, sku: "KSR-001", name: "Produk Kasir", price: 1000, stock: 1, lowStockThreshold: 1 });
    expect(product.status).toBe(403);

    const category = await agent()
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ name: "Kategori Kasir" });
    expect(category.status).toBe(403);

    const movement = await agent()
      .post("/api/v1/stock-movements")
      .set("Cookie", cookie)
      .send({ productId: fx.keripik.id, type: "KELUAR", quantity: 1, reason: "Hilang" });
    expect(movement.status).toBe(403);
  });

  it("kasir boleh membuat pesanan & melihat riwayat stok (wajar untuk transaksi)", async () => {
    const cookie = await loginCookie(fx.kasir.email);

    const order = await agent()
      .post("/api/v1/orders")
      .set("Cookie", cookie)
      .send({ items: [{ productId: fx.keripik.id, quantity: 1 }] });
    expect(order.status).toBe(201);

    const riwayat = await agent().get("/api/v1/stock-movements").set("Cookie", cookie);
    expect(riwayat.status).toBe(200);
  });

  it("hanya owner yang boleh membuka laporan (admin/pengelola stok/kasir → 403)", async () => {
    for (const user of [fx.admin, fx.stockManager, fx.kasir]) {
      const res = await agent().get("/api/v1/reports/summary").set("Cookie", await loginCookie(user.email));
      expect(res.status, `laporan untuk ${user.role}`).toBe(403);
    }
  });
});

describe("kelola pengguna (owner & admin)", () => {
  it("staf/kasir tidak boleh mengakses /users → 403", async () => {
    for (const user of [fx.staff, fx.kasir, fx.stockManager]) {
      const res = await agent().get("/api/v1/users").set("Cookie", await loginCookie(user.email));
      expect(res.status, `/users untuk ${user.role}`).toBe(403);
    }
  });

  it("owner membuat pengguna baru, email duplikat → 409", async () => {
    const cookie = await loginCookie(fx.owner.email);

    const created = await agent()
      .post("/api/v1/users")
      .set("Cookie", cookie)
      .send({ name: "Kasir Baru", email: "kasir-baru@test.local", password: "rahasia123", role: "kasir" });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ email: "kasir-baru@test.local", role: "kasir" });
    expect(created.body.data).not.toHaveProperty("passwordHash");

    const dup = await agent()
      .post("/api/v1/users")
      .set("Cookie", cookie)
      .send({ name: "Duplikat", email: "Kasir-Baru@test.local", password: "rahasia123", role: "staff" });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("EMAIL_DUPLICATE");
  });

  it("pengguna hasil buatan owner bisa login dengan role yang benar", async () => {
    const ownerCookie = await loginCookie(fx.owner.email);
    await agent()
      .post("/api/v1/users")
      .set("Cookie", ownerCookie)
      .send({ name: "Admin Baru", email: "admin-baru@test.local", password: "rahasia123", role: "admin" });

    const login = await agent()
      .post("/api/v1/auth/login")
      .send({ email: "admin-baru@test.local", password: "rahasia123" });
    expect(login.status).toBe(200);
    expect(login.body.data).toMatchObject({ role: "admin" });
  });

  it("admin boleh buat akun non-owner, tapi buat peran owner → 403", async () => {
    const cookie = await loginCookie(fx.admin.email);

    const ok = await agent()
      .post("/api/v1/users")
      .set("Cookie", cookie)
      .send({ name: "Kasir Admin", email: "kasir-admin@test.local", password: "rahasia123", role: "kasir" });
    expect(ok.status).toBe(201);

    const escalate = await agent()
      .post("/api/v1/users")
      .set("Cookie", cookie)
      .send({ name: "Owner palsu", email: "owner-palsu@test.local", password: "rahasia123", role: "owner" });
    expect(escalate.status).toBe(403);
  });

  it("admin boleh melihat daftar, tapi tidak boleh mengubah akun pemilik", async () => {
    const cookie = await loginCookie(fx.admin.email);

    const list = await agent().get("/api/v1/users").set("Cookie", cookie);
    expect(list.status).toBe(200); // daftar tetap boleh (untuk kolaborasi tampilan)

    const demote = await agent()
      .patch(`/api/v1/users/${fx.owner.id}`)
      .set("Cookie", cookie)
      .send({ role: "staff" });
    expect(demote.status).toBe(403);

    const after = await prisma.user.findUnique({ where: { id: fx.owner.id } });
    expect(after?.role).toBe("owner");
  });

  it("owner boleh ubah peran, tapi peran sendiri ditolak (SELF_ROLE_CHANGE)", async () => {
    const cookie = await loginCookie(fx.owner.email);

    const change = await agent()
      .patch(`/api/v1/users/${fx.staff.id}`)
      .set("Cookie", cookie)
      .send({ role: "kasir" });
    expect(change.status).toBe(200);
    expect(change.body.data.role).toBe("kasir");

    const self = await agent()
      .patch(`/api/v1/users/${fx.owner.id}`)
      .set("Cookie", cookie)
      .send({ role: "staff" });
    expect(self.status).toBe(400);
    expect(self.body.error.code).toBe("SELF_ROLE_CHANGE");
  });

  it("ubah password pengguna → login dengan password baru berhasil", async () => {
    const cookie = await loginCookie(fx.owner.email);

    const change = await agent()
      .patch(`/api/v1/users/${fx.staff.id}`)
      .set("Cookie", cookie)
      .send({ password: "barusaja99" });
    expect(change.status).toBe(200);

    const wrong = await agent()
      .post("/api/v1/auth/login")
      .send({ email: fx.staff.email, password: "password123" });
    expect(wrong.status).toBe(401);

    const right = await agent()
      .post("/api/v1/auth/login")
      .send({ email: fx.staff.email, password: "barusaja99" });
    expect(right.status).toBe(200);
  });

  it("id pengguna tidak ditemukan → 404; id bukan uuid → 400", async () => {
    const cookie = await loginCookie(fx.owner.email);

    const missing = await agent()
      .patch("/api/v1/users/11111111-1111-1111-1111-111111111111")
      .set("Cookie", cookie)
      .send({ role: "kasir" });
    expect(missing.status).toBe(404);

    const invalid = await agent()
      .patch("/api/v1/users/bukan-uuid")
      .set("Cookie", cookie)
      .send({ role: "kasir" });
    expect(invalid.status).toBe(400);
  });
});

describe("rate limit login", () => {
  it("percobaan login berulang dibatasi → 429 RATE_LIMITED", async () => {
    // Batasnya 10 percobaan/menit per IP, dihitung sejak percobaan pertama.
    // Jadi percobaan ke-11 harus ditolak. Tidak ada login sukses lebih dulu
    // di test ini, supaya jatahnya tidak terpakai.
    for (let i = 1; i <= 10; i++) {
      const res = await agent()
        .post("/api/v1/auth/login")
        .send({ email: fx.owner.email, password: "password-salah" });
      expect(res.status, `percobaan ke-${i} masih boleh dicoba`).toBe(401);
    }

    const blocked = await agent()
      .post("/api/v1/auth/login")
      .send({ email: fx.owner.email, password: "password-salah" });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, error: { code: "RATE_LIMITED" } });

    // Login dengan password benar pun ikut diblokir selama jendela masih penuh.
    const correct = await agent()
      .post("/api/v1/auth/login")
      .send({ email: fx.owner.email, password: "password123" });
    expect(correct.status).toBe(429);
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
