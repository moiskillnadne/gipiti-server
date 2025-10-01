import type { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { prisma } from "../prisma-client.js";
import { createLoggerForEndpoint } from "../core/logger.js";

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
  const logger = createLoggerForEndpoint('verifyTokenMiddleware')

  const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

  logger.info(`Token received: ${token.substring(0, 10)}...`)

  if (!token) {
    logger.error('No token provided')
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = await verifier.verify(token);

    logger.info(`Payload received: ${JSON.stringify(payload)}`)

    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    })

    logger.info(`User email found: ${user?.email}`)

    if (!user) {
      logger.error('User not found')
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
