import { Router } from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ConfirmSignUpCommand, GlobalSignOutCommand, InitiateAuthCommand, ResendConfirmationCodeCommand, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { generateSecretHash } from '../middleware/generateSecretHash.js';
import cognito from '../config/cognito.js';
import cognitoClient from '../config/cognito.js';
import { prisma } from '../prisma-client.js';

const router = Router();

const resendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 3, // максимум 3 запроса
  message: { message: "Too many resend attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/signup",
  generateSecretHash,
  async (req: Request, res: Response) => {
    const { password, email, secretHash } = req.body;

    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        }
      ],
    });

    try {
      const data = await cognito.send(command);

      if (data.UserSub) {
        await prisma.user.create({
          data: {
            id: data.UserSub,
            email: email,
            isConfimed: false,
          }
        })
      }

      res.status(201).json({ 
        message: "User created successfully", 
        userSub: data.UserSub 
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(400).json({ name: error.name, message: error.message });
      } else {
        res.status(400).json({ name: "UnknownError", message: "Unknown error" });
      }
    }
  }
);

router.post(
  "/resend-confirmation-code",
  resendCodeLimiter,
  generateSecretHash,
  async (req: Request, res: Response) => {
    const { email, secretHash } = req.body;

    const command = new ResendConfirmationCodeCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      SecretHash: secretHash,
    });

    try {
      const data = await cognitoClient.send(command);
      
      res.status(200).json({ 
        message: "Confirmation code resent successfully",
        codeDeliveryDetails: {
          destination: data.CodeDeliveryDetails?.Destination,
          deliveryMedium: data.CodeDeliveryDetails?.DeliveryMedium,
          attributeName: data.CodeDeliveryDetails?.AttributeName
        }
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: "Error resending confirmation code", 
        error: error.message 
      });
    }
  }
);

router.post(
  "/confirm-signup",
  generateSecretHash,
  async (req: Request, res: Response) => {
    const { email, confirmationCode, secretHash } = req.body;

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: confirmationCode,
      SecretHash: secretHash,
    });

    try {
      await cognitoClient.send(command);

      await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          isConfimed: true,
        }
      })

      res.status(200).json({ message: "User confirmed successfully" });
    } catch (error: any) {
      res.status(400).json({ 
        message: "Error confirming user", 
        error: error.message 
      });
    }
  }
);

router.post(
  "/login",
  generateSecretHash,
  async (req: Request, res: Response) => {
    const { email, password, secretHash } = req.body;

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

    try {
      const data = await cognitoClient.send(command);
      
      const accessToken = data.AuthenticationResult?.AccessToken;
      const idToken = data.AuthenticationResult?.IdToken;
      const refreshToken = data.AuthenticationResult?.RefreshToken;

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "LOCAL",
        sameSite: "strict",
        maxAge: 3600 * 1000, // 1 час
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "LOCAL",
        sameSite: "strict",
        maxAge: 30 * 24 * 3600 * 1000, // 30 дней
      });

      res.status(200).json({ 
        message: "Login successful",
        idToken
      });
    } catch (error: any) {
      res.status(401).json({ 
        message: "Authentication failed", 
        error: error.message 
      });
    }
  }
);

router.post(
  "/refresh",
  generateSecretHash,
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { secretHash } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const command = new InitiateAuthCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash,
      },
    });

    try {
      const data = await cognitoClient.send(command);
      
      const newAccessToken = data.AuthenticationResult?.AccessToken;
      const newIdToken = data.AuthenticationResult?.IdToken;

      // Обновляем access token в cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "LOCAL",
        sameSite: "strict",
        maxAge: 3600 * 1000,
      });

      res.status(200).json({ 
        message: "Token refreshed successfully",
        idToken: newIdToken
      });
    } catch (error: any) {
      res.status(401).json({ 
        message: "Token refresh failed", 
        error: error.message 
      });
    }
  }
);

router.post(
  "/logout",
  async (req: Request, res: Response) => {
    const accessToken = req.cookies.accessToken || req.body.accessToken;

    if (!accessToken) {
      return res.status(400).json({ message: "Access token required" });
    }

    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    try {
      await cognitoClient.send(command);
      
      // Удаляем cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      
      res.status(200).json({ message: "Logout successful" });
    } catch (error: any) {
      res.status(400).json({ 
        message: "Error logging out", 
        error: error.message 
      });
    }
  }
);

export { router }