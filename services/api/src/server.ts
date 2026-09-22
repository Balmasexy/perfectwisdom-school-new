import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import { dashboardRoutes } from './routes/dashboard.js'
import { staffRoutes } from './routes/staff.js'
import { branchRoutes } from './routes/branches.js'
import { authRoutes } from './routes/auth.js'
import { paymentRoutes } from './routes/payments.js'

dotenv.config()

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: true,
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'change-this-secret-before-production',
})

await app.register(dashboardRoutes)
await app.register(staffRoutes)
await app.register(branchRoutes)
await app.register(authRoutes)
await app.register(paymentRoutes)

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'perfect-wisdom-school-api',
    timestamp: new Date().toISOString(),
  }
})

const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '0.0.0.0'

try {
  await app.listen({ port, host })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
