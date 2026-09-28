import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import { requireAuth } from './auth.js';

const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL ||
  'https://perfectwisdom-school-api.onrender.com';

const SCHOOL_WEB_URL =
  process.env.SCHOOL_WEB_URL ||
  'https://perfectwisdomschool.onrender.com';

const PAYSTACK_CALLBACK_URL =
  process.env.PAYSTACK_CALLBACK_URL ||
  `${API_PUBLIC_URL}/payments/paystack/callback`;

const PAYSTACK_URL = 'https://api.paystack.co';

async function ensurePaymentsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS school_payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      reference text NOT NULL UNIQUE,
      amount numeric NOT NULL,
      currency text NOT NULL DEFAULT 'NGN',
      method text NOT NULL DEFAULT 'PAYSTACK',
      status text NOT NULL DEFAULT 'PENDING',
      description text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    ALTER TABLE school_payments
    DROP CONSTRAINT IF EXISTS school_payments_method_check
  `);

  await db.execute(sql`
    ALTER TABLE school_payments
    ADD CONSTRAINT school_payments_method_check
    CHECK (method IN ('PAYSTACK', 'OPAY_ONLINE', 'BANK_TRANSFER'))
  `);
}

async function paystackRequest(
  path: string,
  options: RequestInit = {}
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || !data?.status) {
    throw new Error(
      data?.message || `Paystack request failed (${response.status})`
    );
  }

  return data;
}

export async function paymentRoutes(app: FastifyInstance) {
  await ensurePaymentsTable();

  app.get('/payments/config', async () => {
    return {
      currency: 'NGN',
      provider: 'Paystack',
    };
  });

  app.post('/payments/paystack/initialize', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user as {
      id?: string;
      email?: string;
    };

    if (!user?.id) {
      return reply.code(401).send({ message: 'Authentication required' });
    }

    const body = request.body as {
      amount?: number;
      description?: string;
    };

    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return reply.code(400).send({
        message: 'A valid payment amount is required',
      });
    }

    const email = user.email;

    if (!email) {
      return reply.code(400).send({
        message: 'A valid account email is required before payment',
      });
    }

    const amountInKobo = Math.round(amount * 100);
    const reference = `PWSC-${Date.now()}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)}`;

    const description =
      body?.description?.trim() || 'School payment';

    await db.execute(sql`
      INSERT INTO school_payments
        (user_id, reference, amount, currency, method, status, description)
      VALUES
        (${user.id},
         ${reference},
         ${amount},
         'NGN',
         'PAYSTACK',
         'PENDING',
         ${description})
    `);

    try {
      const result = await paystackRequest('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email,
          amount: String(amountInKobo),
          currency: 'NGN',
          reference,
          channels: ['bank_transfer'],
          callback_url: PAYSTACK_CALLBACK_URL,
          metadata: {
            school: 'Perfect Wisdom School',
            user_id: user.id,
            payment_reference: reference,
            description,
          },
        }),
      });

      return reply.send({
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      });
    } catch (error) {
      await db.execute(sql`
        UPDATE school_payments
        SET status = 'FAILED', updated_at = now()
        WHERE reference = ${reference}
      `);

      return reply.code(502).send({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to initialize Paystack payment',
      });
    }
  });

  app.get('/payments/paystack/callback', async (request, reply) => {
    const query = request.query as {
      reference?: string;
    };

    const reference = query.reference;

    if (!reference) {
      return reply.redirect(
        `${SCHOOL_WEB_URL}/?payment=failed`
      );
    }

    try {
      const paymentResult = await db.execute(sql`
        SELECT id, amount, status
        FROM school_payments
        WHERE reference = ${reference}
        LIMIT 1
      `);

      const payment = paymentResult.rows?.[0] as
        | {
            id: string;
            amount: string | number;
            status: string;
          }
        | undefined;

      if (!payment) {
        return reply.redirect(
          `${SCHOOL_WEB_URL}/?payment=failed&reference=${encodeURIComponent(
            reference
          )}`
        );
      }

      const result = await paystackRequest(
        `/transaction/verify/${encodeURIComponent(reference)}`
      );

      const transaction = result.data;

      const expectedAmount = Math.round(
        Number(payment.amount) * 100
      );

      const verified =
        transaction?.status === 'success' &&
        transaction?.reference === reference &&
        Number(transaction?.amount) === expectedAmount &&
        transaction?.currency === 'NGN';

      await db.execute(sql`
        UPDATE school_payments
        SET
          status = ${verified ? 'COMPLETED' : 'FAILED'},
          updated_at = now()
        WHERE id = ${payment.id}
      `);

      return reply.redirect(
        `${SCHOOL_WEB_URL}/?payment=${
          verified ? 'success' : 'failed'
        }&reference=${encodeURIComponent(reference)}`
      );
    } catch (error) {
      console.error('Paystack callback verification failed:', error);

      return reply.redirect(
        `${SCHOOL_WEB_URL}/?payment=failed&reference=${encodeURIComponent(
          reference
        )}`
      );
    }
  });

  app.get('/payments/my', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user as {
      id?: string;
    };

    if (!user?.id) {
      return reply.code(401).send({
        message: 'Authentication required',
      });
    }

    const result = await db.execute(sql`
      SELECT
        id,
        reference,
        amount,
        currency,
        status,
        description,
        created_at AS "createdAt"
      FROM school_payments
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `);

    return reply.send(result.rows);
  });
}
