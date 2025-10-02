import '@dotenvx/dotenvx/config'
import express from 'express'
import type { Request, Response } from 'express';
import cookieParser from "cookie-parser";
import { router as authRouter } from './routes/auth.js'
import { verifyToken } from './middleware/verifyToken.js';

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/auth', authRouter)


app.get("/profile", verifyToken, (req: Request, res: Response) => {
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
