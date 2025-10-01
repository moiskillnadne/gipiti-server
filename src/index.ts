import '@dotenvx/dotenvx/config'
import express from 'express'
import type { Request, Response } from 'express';
import cookieParser from "cookie-parser";
import { prisma } from './prisma-client.ts'
import { router as authRouter } from './routes/auth.ts'
import { verifyToken } from './middleware/verifyToken.ts';

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/auth', authRouter)

app.get('/', async (req, res) => {
  const users = await prisma.user.findMany()

  res.send(users)
})


app.get("/profile", verifyToken, (req: Request, res: Response) => {

  res.json({ 
    message: "Protected route", 
    user: req.user 
  });
});



app.get("/health-check", (req, res) => {
  res.status(200).send(`OK. Environment: ${process.env.NODE_ENV ?? "NOT_DEFINED"}`)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
