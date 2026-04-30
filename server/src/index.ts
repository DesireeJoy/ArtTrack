import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { execSync } from 'child_process'
import path from 'path'
import customersRouter from './routes/customers'
import projectsRouter from './routes/projects'
import tasksRouter from './routes/tasks'
import shipmentsRouter from './routes/shipments'
import ordersRouter from './routes/orders'
import gmailRouter from './routes/gmail'
import facebookRouter from './routes/facebook'

dotenv.config()

// Auto-create/migrate the database on startup so users never need to run db:push manually
try {
  execSync('npx prisma db push --skip-generate', {
    cwd: path.join(__dirname, '../..'),
    stdio: 'ignore',
  })
} catch {
  // Non-fatal — server will still start, Prisma will error on first DB call if truly broken
}

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/customers', customersRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/shipments', shipmentsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/gmail', gmailRouter)
app.use('/api/facebook', facebookRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ArtTrack server running on http://localhost:${PORT}`)
  console.log(`Also reachable on local network at port ${PORT}`)
})
