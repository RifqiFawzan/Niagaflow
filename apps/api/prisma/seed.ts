import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Stok awal untuk item menu baru. Restoran tidak menghitung stok per porsi
 * seperti toko, tapi pesanan tetap divalidasi terhadap stok, jadi item aktif
 * diberi stok awal yang longgar. Stok yang sudah ada tidak diubah saat seed
 * dijalankan ulang.
 */
const DEFAULT_STOCK = 100;
const LOW_STOCK_THRESHOLD = 10;

type MenuItem = {
  sku: string;
  name: string;
  price: number;
  description?: string;
  isActive?: boolean;
};

type MenuSection = {
  name: string;
  products: MenuItem[];
};

/**
 * Menu Yessy Kitchen (sumber: menu_yessy.md).
 * Harga dalam rupiah penuh: "100K" = 100.000.
 * Sistem belum punya varian, jadi ukuran ikan dan pilihan saus dijadikan
 * produk terpisah / ditulis di deskripsi.
 */
const MENU: MenuSection[] = [
  {
    name: "Food",
    products: [
      { sku: "FD-001", name: "Ikan Bumbu Kuning", price: 100000 },
      { sku: "FD-002", name: "Cumi Goreng Tepung", price: 45000 },
      { sku: "FD-003", name: "Udang Goreng Tepung", price: 45000 },
      { sku: "FD-004", name: "Ayam Lalapan", price: 45000 },
      { sku: "FD-005", name: "Capcay Seafood", price: 35000 },
      { sku: "FD-006", name: "Capcay Ayam", price: 35000 },
      { sku: "FD-007", name: "Pelecing", price: 20000 },
      { sku: "FD-008", name: "Terong Bakar / Goreng", price: 20000 },
      { sku: "FD-009", name: "Tumis Kangkung", price: 25000 },
      { sku: "FD-010", name: "Sayur Kelor (Complete)", price: 25000 },
      { sku: "FD-011", name: "Tahu Goreng", price: 20000 },
      { sku: "FD-012", name: "Tempe Goreng", price: 20000 },
      { sku: "FD-013", name: "Tempe Goreng Tepung", price: 25000 },
      { sku: "FD-014", name: "Telur Dadar", price: 20000 },
      { sku: "FD-015", name: "Nasi Putih", price: 10000 },
    ],
  },
  {
    name: "Nasi Goreng & Mie",
    products: [
      { sku: "NG-001", name: "Nasi Goreng Telur", price: 35000 },
      { sku: "NG-002", name: "Nasi Goreng Terasi", price: 35000 },
      { sku: "NG-003", name: "Nasi Goreng Special", price: 35000 },
      { sku: "NG-004", name: "Nasi Goreng Seafood", price: 35000 },
      { sku: "NG-005", name: "Mie Goreng Special", price: 35000 },
      { sku: "NG-006", name: "Mie Goreng Seafood", price: 35000 },
    ],
  },
  {
    name: "Drinks",
    products: [
      {
        sku: "DR-001",
        name: "Iced Young Coconut with Palm Sugar",
        price: 25000,
      },
      { sku: "DR-002", name: "Young Coconut Served in Shell", price: 35000 },
      { sku: "DR-003", name: "Iced Young Coconut", price: 20000 },
      { sku: "DR-004", name: "Orange Juice", price: 25000 },
      { sku: "DR-005", name: "Pineapple Juice", price: 25000 },
      { sku: "DR-006", name: "Watermelon Juice", price: 25000 },
      { sku: "DR-007", name: "Banana Juice", price: 25000 },
      { sku: "DR-008", name: "Melon Juice", price: 25000 },
      {
        sku: "DR-009",
        name: "Avocado Juice (Seasonal)",
        price: 25000,
        description: "Tergantung musim.",
      },
      {
        sku: "DR-010",
        name: "Mango Juice (Seasonal)",
        price: 25000,
        description: "Tergantung musim.",
      },
      { sku: "DR-011", name: "Mixed Fruit Juice", price: 35000 },
      { sku: "DR-012", name: "Soda Gembira", price: 35000 },
      {
        sku: "DR-013",
        name: "Medium Mineral Water",
        price: 10000,
        description: "Botol sedang.",
      },
      {
        sku: "DR-014",
        name: "Large Mineral Water",
        price: 20000,
        description: "Botol besar.",
      },
      { sku: "DR-015", name: "Lombok Coffee", price: 10000 },
      { sku: "DR-016", name: "Hot Ginger with Palm Sugar", price: 25000 },
      { sku: "DR-017", name: "Hot Malay Tea", price: 35000 },
    ],
  },
  {
    name: "Soft Drinks",
    products: [
      { sku: "SD-001", name: "Coca Cola", price: 25000 },
      { sku: "SD-002", name: "Zero Cola", price: 25000 },
      { sku: "SD-003", name: "Sprite", price: 25000 },
      { sku: "SD-004", name: "Fanta", price: 25000 },
    ],
  },
  {
    name: "Snacks",
    products: [
      { sku: "SN-001", name: "French Fries", price: 50000 },
      { sku: "SN-002", name: "Fried Banana", price: 35000 },
      { sku: "SN-003", name: "Garlic Bread", price: 35000 },
      { sku: "SN-004", name: "Plain Pancake", price: 35000 },
      { sku: "SN-005", name: "Pineapple Pancake", price: 35000 },
      { sku: "SN-006", name: "Banana Pancake", price: 35000 },
      { sku: "SN-007", name: "Spring Rolls", price: 35000 },
      { sku: "SN-008", name: "Sweet Papaya Salad", price: 35000 },
      { sku: "SN-009", name: "Tofu and Vegetables", price: 100000 },
      { sku: "SN-010", name: "Boiled Water Spinach", price: 50000 },
      { sku: "SN-011", name: "Fried Rice with Vegetables", price: 50000 },
      { sku: "SN-012", name: "Fried Noodles with Vegetables", price: 50000 },
    ],
  },
  {
    name: "Seafood Specialities",
    products: [
      { sku: "SF-001", name: "Crispy Fried Shrimp", price: 125000 },
      { sku: "SF-002", name: "Crispy Fried Squid", price: 125000 },
      {
        sku: "SF-003",
        name: "Ikan Utuh Saus Pilihan (Small)",
        price: 150000,
        description:
          "Pilihan saus: garlic, sweet sour, ginger, spicy, atau Yessy. Disajikan dengan nasi.",
      },
      {
        sku: "SF-004",
        name: "Ikan Utuh Saus Pilihan (Medium)",
        price: 300000,
        description:
          "Pilihan saus: garlic, sweet sour, ginger, spicy, atau Yessy. Disajikan dengan nasi.",
      },
      {
        sku: "SF-005",
        name: "Ikan Utuh Saus Pilihan (Large)",
        price: 350000,
        description:
          "Pilihan saus: garlic, sweet sour, ginger, spicy, atau Yessy. Disajikan dengan nasi.",
      },
      {
        sku: "SF-006",
        name: "Ikan Utuh Saus Pilihan (Large Snapper)",
        price: 350000,
        description:
          "Pilihan saus: garlic, sweet sour, ginger, spicy, atau Yessy. Disajikan dengan nasi.",
      },
      {
        sku: "SF-007",
        name: "Ikan Utuh Saus Pilihan (Extra Large)",
        price: 400000,
        description:
          "Pilihan saus: garlic, sweet sour, ginger, spicy, atau Yessy. Disajikan dengan nasi.",
      },
      {
        sku: "SF-008",
        name: "Ikan Utuh Saus Pilihan (Double Extra Large)",
        price: 450000,
        description:
          "Pilihan saus: garlic, sweet sour, ginger, spicy, atau Yessy. Disajikan dengan nasi.",
      },
      {
        sku: "SF-009",
        name: "Grilled Squid",
        price: 350000,
        description:
          "Pilihan saus: garlic, sweet sour, ginger, spicy, atau Yessy.",
      },
      { sku: "SF-010", name: "Fresh King Prawn", price: 350000 },
      { sku: "SF-011", name: "Fresh Teger Prawn", price: 250000 },
      { sku: "SF-012", name: "Fresh Jumbo Prawn", price: 380000 },
      { sku: "SF-013", name: "Grilled Scallop", price: 200000 },
      {
        sku: "SF-014",
        name: "Mixed Seafood",
        price: 550000,
        description: "Isi: cumi, udang, scallop.",
      },
      {
        sku: "SF-015",
        name: "Crab with Yessy Sauce or Spicy Sauce",
        price: 360000,
      },
      {
        sku: "SF-016",
        name: "Lobster",
        price: 0,
        description:
          "Tersedia sesuai permintaan, pesan minimal H-1. Harga menyusul.",
        isActive: false,
      },
    ],
  },
];

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

async function ensureCategory(name: string) {
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.category.create({ data: { name } });
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

  // Kategori demo lama diganti nama supaya tidak muncul dua kategori kosong.
  for (const [from, to] of [
    ["Makanan", "Food"],
    ["Minuman", "Drinks"],
  ]) {
    const legacy = await prisma.category.findFirst({ where: { name: from } });
    if (!legacy) continue;
    const target = await prisma.category.findFirst({ where: { name: to } });
    if (!target) {
      await prisma.category.update({
        where: { id: legacy.id },
        data: { name: to },
      });
    }
  }

  let productCount = 0;
  for (const section of MENU) {
    const category = await ensureCategory(section.name);

    for (const item of section.products) {
      const isActive = item.isActive ?? true;
      await prisma.product.upsert({
        where: { sku: item.sku },
        update: {
          categoryId: category.id,
          name: item.name,
          description: item.description ?? null,
          price: item.price,
          isActive,
        },
        create: {
          categoryId: category.id,
          sku: item.sku,
          name: item.name,
          description: item.description ?? null,
          price: item.price,
          stock: isActive ? DEFAULT_STOCK : 0,
          lowStockThreshold: LOW_STOCK_THRESHOLD,
          isActive,
        },
      });
      productCount += 1;
    }
  }

  // Produk demo lama disembunyikan, bukan dihapus, supaya riwayat pesanan
  // (order_items) yang memakainya tetap utuh.
  await prisma.product.updateMany({
    where: { sku: { in: ["MKN-001", "MKN-002", "MNM-001"] } },
    data: { isActive: false },
  });

  console.log(`Seed selesai. ${productCount} item menu Yessy Kitchen siap.`);
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
