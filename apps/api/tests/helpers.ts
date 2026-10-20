import "./env";
import request from "supertest";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import type { Express } from "express";

import app from "../src/app";
import { prisma } from "../src/utils/prisma";
import { resetRateLimit } from "../src/utils/rateLimit";

export const testApp: Express = app;
export const agent = () => request(testApp);

export const PASSWORD = "password123";

export type Fixtures = Awaited<ReturnType<typeof resetFixtures>>;

/** Reset seluruh data test lalu buat fixture dasar: 1 owner, 1 staff, 2 kategori, 3 produk, 1 pelanggan. */
export async function resetFixtures() {
  // Rate limiter in-memory ikut direset agar login berulang antar-test tidak kena 429.
  resetRateLimit();

  // Urutan hapus menghormati foreign key.
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const owner = await prisma.user.create({
    data: { name: "Owner Test", email: "owner@test.local", passwordHash, role: Role.owner },
  });
  const staff = await prisma.user.create({
    data: { name: "Staff Test", email: "staff@test.local", passwordHash, role: Role.staff },
  });

  const makanan = await prisma.category.create({ data: { name: "Makanan" } });
  const minuman = await prisma.category.create({ data: { name: "Minuman" } });

  const keripik = await prisma.product.create({
    data: {
      categoryId: makanan.id,
      sku: "MKN-001",
      name: "Keripik Singkong",
      price: 15000,
      stock: 50,
      lowStockThreshold: 10,
    },
  });
  const kue = await prisma.product.create({
    data: {
      categoryId: makanan.id,
      sku: "MKN-002",
      name: "Kue Kering Cokelat",
      price: 35000,
      stock: 3,
      lowStockThreshold: 5,
    },
  });
  const teh = await prisma.product.create({
    data: {
      categoryId: minuman.id,
      sku: "MNM-001",
      name: "Teh Manis Jumbo",
      price: 5000,
      stock: 120,
      lowStockThreshold: 24,
    },
  });

  const budi = await prisma.customer.create({
    data: { name: "Budi Santoso", phone: "0812-9999-1111" },
  });

  return { owner, staff, makanan, minuman, keripik, kue, teh, budi };
}

/** Login lewat endpoint asli, kembalikan cookie sesi siap pakai untuk request berikutnya. */
export async function loginCookie(email: string, password = PASSWORD): Promise<string> {
  const res = await agent().post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login ${email} gagal: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const raw = res.headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const session = cookies.find((c) => c.startsWith("session="));
  if (!session) throw new Error(`Cookie sesi tidak ditemukan: ${JSON.stringify(raw)}`);
  return session.split(";")[0];
}
