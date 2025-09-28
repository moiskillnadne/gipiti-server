import '@dotenvx/dotenvx/config'
import express from 'express'

const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.get("/health-check", (req, res) => {
  res.status(200).send("OK")
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
