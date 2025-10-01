import '@dotenvx/dotenvx/config'
import express from 'express'
import type { Request, Response } from 'express';
import cookieParser from "cookie-parser";
import { router as authRouter } from './routes/auth.js'
import { verifyToken } from './middleware/verifyToken.js';
import { createLoggerForEndpoint } from './core/logger.js';

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/auth', authRouter)


app.get("/profile", verifyToken, (req: Request, res: Response) => {
  const logger = createLoggerForEndpoint('profile')

  logger.info('Profile route called')

  res.json({ 
    message: "Protected route", 
    user: req.user 
  });
});



app.get("/health-check", (req, res) => {
  const logger = createLoggerForEndpoint('health-check')

  logger.info('Health check endpoint called')

  res.status(200).send(`OK. Environment: ${process.env.NODE_ENV ?? "NOT_DEFINED"}`)
})

app.listen(port, () => {
  const logger = createLoggerForEndpoint('server-startup')

  logger.info(`Server is running on port ${port}`)
})
