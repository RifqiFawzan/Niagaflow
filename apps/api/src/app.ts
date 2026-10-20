import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { productsRouter } from "./modules/products/products.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { buildOpenApiDocument } from "./docs/openapi";
import { ApiError } from "./utils/ApiError";

const app = express();

// Di balik proxy hosting (mis. Render/Railway), IP asli pengunjung ada di header
// X-Forwarded-For. Tanpa ini, rate limit login akan menghitung IP proxy yang sama
// untuk semua orang -- satu penyerang bisa memblokir seluruh pengguna.
// Angka 1 = percaya satu lapis proxy di depan (bukan trust semua, itu berbahaya).
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/customers", customersRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/reports", reportsRouter);

// Dokumentasi API. Terbuka di dev; di production ikut menyala (hanya dokumentasi,
// tidak membuka data). Swagger UI di /docs, dokumen mentah di /openapi.json.
const openApiDocument = buildOpenApiDocument();
app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "NiagaFlow API",
    swaggerOptions: { persistAuthorization: true, withCredentials: true },
  })
);

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan." },
  });
});

// Error handler
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
    console.error(err);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server." },
    });
  }
);

export default app;
