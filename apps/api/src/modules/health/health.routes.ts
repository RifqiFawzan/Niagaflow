import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "niagaflow-api",
      uptime: Math.round(process.uptime()),
    },
  });
});
