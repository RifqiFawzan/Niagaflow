import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";

const app = express();

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);

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
    console.error(err);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server." },
    });
  }
);

export default app;
