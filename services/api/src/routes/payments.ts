import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { requireAuth } from './auth.js'

const OPAY_URL = 'https://opay.com'
const OPAY_BANK = 'OPay'
const OPAY_ACCOUNT_NAME = 'Opay'
const OPAY_ACCOUNT_NUMBER = '8084861312'

async function ensurePaymentsTable() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS school_payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      amount numeric(18,2) NOT NULL CHECK (amount > 0),
      method varchar(30) NOT NULL CHECK (
        method IN ('OPAY_ONLINE', 'BANK_TRANSFER')
      ),
      status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')
      ),
      reference varchar(120) NOT NULL UNIQUE,
      description text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `))

  await db.execute(sql.raw(`
    CREATE INDEX IF NOT EXISTS school_payments_user_id_index
    ON school_payments(user_id)
  `))

  await db.execute(sql.raw(`
    CREATE INDEX IF NOT EXISTS school_payments_created_at_index
    ON school_payments(created_at)
  `))
}

function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `PWS-${stamp}-${random}`
}

export async function paymentRoutes(app: FastifyInstance) {
  await ensurePaymentsTable()

  app.get('/payments/config', async () => ({
    onlineUrl: OPAY_URL,
    bank: OPAY_BANK,
    accountName: OPAY_ACCOUNT_NAME,
    accountNumber: OPAY_ACCOUNT_NUMBER,
    currency: 'NGN',
  }))

  app.post(
    '/payments/transfer',
    { preHandler: requireAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = await requireAuth(request, reply)
      if (!authUser) return

      const body = request.body as {
        amount?: number | string
        description?: string
      }

      const amount = Number(body.amount)

      if (!Number.isFinite(amount) || amount <= 0) {
        return reply.code(400).send({
          error: 'Enter a valid payment amount greater than 0',
        })
      }

      const reference = generateReference()

      const result = await db.execute(sql`
        INSERT INTO school_payments
          (user_id, amount, method, status, reference, description)
        VALUES
          (
            ${authUser.sub},
            ${amount.toFixed(2)},
            'BANK_TRANSFER',
            'PENDING',
            ${reference},
            ${body.description?.trim() || 'School payment by bank transfer'}
          )
        RETURNING
          id,
          amount,
          method,
          status,
          reference,
          description,
          created_at
      `)

      return reply.code(201).send({
        payment: result.rows[0],
        destination: {
          bank: OPAY_BANK,
          accountName: OPAY_ACCOUNT_NAME,
          accountNumber: OPAY_ACCOUNT_NUMBER,
          currency: 'NGN',
        },
      })
    },
  )

  app.get(
    '/payments/my',
    { preHandler: requireAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = await requireAuth(request, reply)
      if (!authUser) return

      const result = await db.execute(sql`
        SELECT
          id,
          amount,
          method,
          status,
          reference,
          description,
          created_at
        FROM school_payments
        WHERE user_id = ${authUser.sub}
        ORDER BY created_at DESC
        LIMIT 50
      `)

      return result.rows
    },
  )
}
