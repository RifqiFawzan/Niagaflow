import type { Request, Response, NextFunction, RequestHandler } from "express";

/** Bungkus handler async supaya error masuk ke error handler Express (Express 4). */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
