import '@dotenvx/dotenvx/config'
import express from 'express'
import { prisma } from './prisma-client.js'

const app = express()
const port = process.env.PORT || 3000

app.get('/', async (req, res) => {
  const users = await prisma.user.findMany()

  res.send(users)
})

app.get("/health-check", (req, res) => {
  res.status(200).send(`OK. Environment: ${process.env.NODE_ENV ?? "NOT_DEFINED"}`)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
