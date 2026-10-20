import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Password akun demo.
 *
 * Di lokal/dev dipakai "password123" supaya test dan dev server tetap jalan
 * tanpa setup tambahan. Di production password WAJIB diisi lewat env
 * DEMO_PASSWORD, supaya demo publik tidak memakai password lemah.
 */
function resolveDemoPassword(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const fromEnv = process.env.DEMO_PASSWORD;

  if (isProduction) {
    if (!fromEnv || fromEnv.length < 12) {
      throw new Error(
        "DEMO_PASSWORD wajib di-set (minimal 12 karakter) saat seed di production."
      );
    }
    return fromEnv;
  }

  return fromEnv ?? "password123";
}

async function main() {
  const demoPassword = resolveDemoPassword();
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  await prisma.user.upsert({
    where: { email: "owner@niagaflow.test" },
    update: {},
    create: {
      name: "Owner Demo",
      email: "owner@niagaflow.test",
      passwordHash,
      role: Role.owner,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@niagaflow.test" },
    update: {},
    create: {
      name: "Staf Demo",
      email: "staff@niagaflow.test",
      passwordHash,
      role: Role.staff,
    },
  });

  if ((await prisma.category.count()) === 0) {
    const makanan = await prisma.category.create({ data: { name: "Makanan" } });
    const minuman = await prisma.category.create({ data: { name: "Minuman" } });

    await prisma.product.createMany({
      data: [
        {
          categoryId: makanan.id,
          sku: "MKN-001",
          name: "Keripik Singkong",
          description: "Keripik singkong original 200g",
          price: 15000,
          stock: 50,
          lowStockThreshold: 10,
        },
        {
          categoryId: makanan.id,
          sku: "MKN-002",
          name: "Kue Kering Cokelat",
          description: "Toples 250g",
          price: 35000,
          stock: 3,
          lowStockThreshold: 5,
        },
        {
          categoryId: minuman.id,
          sku: "MNM-001",
          name: "Teh Manis Jumbo",
          description: "Gelas 350ml",
          price: 5000,
          stock: 120,
          lowStockThreshold: 24,
        },
      ],
    });
  }

  console.log("Seed selesai.");
  console.log("Akun demo:");
  console.log(`  owner@niagaflow.test (owner)  -- password: ${demoPassword}`);
  console.log(`  staff@niagaflow.test (staff)  -- password: ${demoPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
