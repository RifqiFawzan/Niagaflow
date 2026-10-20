import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { registry as schemaRegistry } from "./openapi-schemas";
import "./openapi-routes"; // mendaftarkan seluruh path ke registry yang sama

/**
 * Merakit dokumen OpenAPI dari skema Zod. Karena bersumber dari skema yang sama
 * dengan validasi runtime, dokumentasi ikut berubah saat validasi berubah.
 */
export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(schemaRegistry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "NiagaFlow API",
      version: "1.0.0",
      description:
        "API untuk pencatatan pesanan, stok, dan penjualan UMKM.\n\n" +
        "Autentikasi memakai cookie sesi (`session`, HttpOnly). " +
        "Masuk lewat `POST /api/v1/auth/login`, lalu seluruh permintaan lain memakai cookie itu.\n\n" +
        "Semua nilai rupiah dikirim sebagai bilangan bulat (integer rupiah), bukan string.",
    },
    servers: [{ url: "/", description: "Server ini" }],
    tags: [
      { name: "Health", description: "Cek status server" },
      { name: "Auth", description: "Masuk, keluar, dan data user" },
      { name: "Kategori", description: "Kelola kategori produk" },
      { name: "Produk", description: "Kelola produk dan stok" },
      { name: "Pelanggan", description: "Kelola pelanggan" },
      { name: "Pesanan", description: "Buat dan ubah status pesanan" },
      { name: "Laporan", description: "Dashboard dan laporan penjualan" },
    ],
  });
}

export { OpenAPIRegistry };
