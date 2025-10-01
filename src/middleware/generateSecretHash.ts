import type { Request, Response, NextFunction } from "express";
import { createHmac } from "crypto";

export const generateSecretHash = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const hasher = createHmac("sha256", process.env.COGNITO_CLIENT_SECRET!);
  hasher.update(`${email}${process.env.COGNITO_CLIENT_ID!}`);
  req.body.secretHash = hasher.digest("base64");
  
  next();
};
