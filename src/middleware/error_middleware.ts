import { NextFunction, Request, Response } from "express";

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Express recognises an error handler by its 4 parameters
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};