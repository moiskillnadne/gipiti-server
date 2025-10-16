import '@dotenvx/dotenvx/config'
import express from 'express'
import type { Request, Response } from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors'
import { router as authRouter } from './routes/auth.js'
import { verifyToken } from './middleware/verifyToken.js';

const app = express()
const port = process.env.PORT || 3000

const allowedOrigins = ['http://localhost:5173', 'https://dev-app.gipiti.riabkov.com', 'https://d1dsubut8s3lhy.cloudfront.net']

app.use(cors({
  origin: (origin, cb) => cb(null, allowedOrigins.includes(origin!) || !origin),
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/auth', authRouter)


app.get("/api/profile", verifyToken, (req: Request, res: Response) => {
  res.json({ 
    message: "Protected route", 
    user: req.user 
  });
});



app.get("/health-check", (req, res) => {

  console.log(`Health check: ${process.env.NODE_ENV ?? "NOT_DEFINED"}`)

  res.status(200).send(`OK. Environment: ${process.env.NODE_ENV ?? "NOT_DEFINED"}`)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
