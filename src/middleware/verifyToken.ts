import type { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { prisma } from "../prisma-client.js";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = await verifier.verify(token);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    })

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: payload.sub,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    }
    next();
  } catch (error: any) {
    res.status(401).json({ message: "Invalid or expired token", details: { name: error.name, message: error.message } });
  }
};
