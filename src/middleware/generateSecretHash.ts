import type { Request, Response, NextFunction } from "express";
import { createHmac } from "crypto";

export const generateSecretHash = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;

  console.log(`Generating secret hash for ${email}`)
  
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const hasher = createHmac("sha256", process.env.COGNITO_CLIENT_SECRET!);
  hasher.update(`${email}${process.env.COGNITO_CLIENT_ID!}`);

  console.log(`Secret hash generated for ${email}`)

  req.body.secretHash = hasher.digest("base64");
  
  next();
};
