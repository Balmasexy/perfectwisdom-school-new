import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import { dashboardRoutes } from './routes/dashboard.js'
import { staffRoutes } from './routes/staff.js'
import { branchRoutes } from './routes/branches.js'
import { authRoutes } from './routes/auth.js'
import { paymentRoutes } from './routes/payments.js'
import { jambRoutes } from './routes/jamb.js'
import { examRegistrationRoutes } from './routes/exam-registrations.js'
import { studentRoutes } from './routes/students.js'
import { classRoutes } from './routes/classes.js'
import { ensureAccountIdSchema } from './db/account-id-migration.js'
import { ensureJambRegistrationSchema } from './db/jamb-migration.js'
import { ensureExamRegistrationSchema } from './db/exam-registration-migration.js'
import { ensureStudentSchema } from './db/student-migration.js'
import { ensureStudentClassSchema } from './db/student-class-migration.js'

dotenv.config()

await ensureAccountIdSchema()
await ensureJambRegistrationSchema()
await ensureExamRegistrationSchema()
await ensureStudentSchema()
await ensureStudentClassSchema()


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
await app.register(jambRoutes)
await app.register(examRegistrationRoutes)
await app.register(studentRoutes)
await app.register(classRoutes)

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
