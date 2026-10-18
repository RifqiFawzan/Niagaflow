import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

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
  console.log("Akun demo (password: password123):");
  console.log("  owner@niagaflow.test (owner)");
  console.log("  staff@niagaflow.test (staff)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
