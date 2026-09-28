import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import { requireAuth, requireRoles } from './auth.js';

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
      amount numeric(18,2) NOT NULL,
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
    CHECK (
      method IN (
        'PAYSTACK',
        'DEBIT_CARD',
        'OPAY_ONLINE',
        'BANK_TRANSFER'
      )
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS school_account (
      id smallint PRIMARY KEY DEFAULT 1,
      account_name text NOT NULL DEFAULT 'Perfect Wisdom School Account',
      balance numeric(18,2) NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'NGN',
      updated_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT school_account_singleton CHECK (id = 1)
    )
  `);

  await db.execute(sql`
    INSERT INTO school_account
      (id, account_name, balance, currency)
    VALUES
      (1, 'Perfect Wisdom School Account', 0, 'NGN')
    ON CONFLICT (id) DO NOTHING
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS school_account_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_reference text NOT NULL UNIQUE,
      amount numeric(18,2) NOT NULL,
      direction text NOT NULL DEFAULT 'CREDIT',
      balance_after numeric(18,2) NOT NULL,
      description text,
      created_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT school_account_transaction_direction_check
        CHECK (direction IN ('CREDIT', 'DEBIT'))
    )
  `);
}

async function paystackRequest(
  path: string,
  options: RequestInit = {},
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
      data?.message ||
        `Paystack request failed (${response.status})`,
    );
  }

  return data;
}

/*
 * Verify the Paystack transaction and credit the school ledger.
 *
 * The transaction reference is unique and the ledger has a unique
 * payment_reference, so the same payment cannot credit the balance twice.
 */
async function verifyAndCreditPayment(reference: string) {
  const paymentResult = await db.execute(sql`
    SELECT id, amount, status, description
    FROM school_payments
    WHERE reference = ${reference}
    LIMIT 1
  `);

  const payment = paymentResult.rows?.[0] as
    | {
        id: string;
        amount: string | number;
        status: string;
        description: string | null;
      }
    | undefined;

  if (!payment) {
    throw new Error('Payment reference was not found');
  }

  if (payment.status === 'COMPLETED') {
    const balanceResult = await db.execute(sql`
      SELECT balance, currency
      FROM school_account
      WHERE id = 1
      LIMIT 1
    `);

    const row = balanceResult.rows?.[0] as
      | { balance: string | number; currency: string }
      | undefined;

    return {
      verified: true,
      alreadyCompleted: true,
      balance: Number(row?.balance || 0),
      currency: row?.currency || 'NGN',
    };
  }

  const result = await paystackRequest(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );

  const transaction = result.data;

  const expectedAmount = Math.round(
    Number(payment.amount) * 100,
  );

  const verified =
    transaction?.status === 'success' &&
    transaction?.reference === reference &&
    Number(transaction?.amount) === expectedAmount &&
    transaction?.currency === 'NGN';

  if (!verified) {
    await db.execute(sql`
      UPDATE school_payments
      SET status = 'FAILED', updated_at = now()
      WHERE id = ${payment.id}
        AND status <> 'COMPLETED'
    `);

    return {
      verified: false,
      alreadyCompleted: false,
      balance: null,
      currency: 'NGN',
    };
  }

  const creditedAmount = Number(payment.amount);

  const credited = await db.transaction(async (tx) => {
    const existing = await tx.execute(sql`
      SELECT id
      FROM school_account_transactions
      WHERE payment_reference = ${reference}
      LIMIT 1
    `);

    if ((existing.rows?.length || 0) > 0) {
      const current = await tx.execute(sql`
        SELECT balance, currency
        FROM school_account
        WHERE id = 1
        LIMIT 1
      `);

      const row = current.rows?.[0] as
        | { balance: string | number; currency: string }
        | undefined;

      return {
        balance: Number(row?.balance || 0),
        currency: row?.currency || 'NGN',
      };
    }

    const account = await tx.execute(sql`
      UPDATE school_account
      SET
        balance = balance + ${creditedAmount},
        updated_at = now()
      WHERE id = 1
      RETURNING balance, currency
    `);

    const row = account.rows?.[0] as
      | { balance: string | number; currency: string }
      | undefined;

    if (!row) {
      throw new Error('School account could not be updated');
    }

    await tx.execute(sql`
      INSERT INTO school_account_transactions
        (
          payment_reference,
          amount,
          direction,
          balance_after,
          description
        )
      VALUES
        (
          ${reference},
          ${creditedAmount},
          'CREDIT',
          ${Number(row.balance)},
          ${payment.description || 'Debit/ATM card school payment'}
        )
    `);

    await tx.execute(sql`
      UPDATE school_payments
      SET
        status = 'COMPLETED',
        updated_at = now()
      WHERE id = ${payment.id}
    `);

    return {
      balance: Number(row.balance),
      currency: row.currency,
    };
  });

  return {
    verified: true,
    alreadyCompleted: false,
    balance: credited.balance,
    currency: credited.currency,
  };
}

export async function paymentRoutes(app: FastifyInstance) {
  await ensurePaymentsTable();

  app.get('/payments/config', async () => ({
    currency: 'NGN',
    provider: 'Paystack',
    debitCard: true,
    schoolBalanceLedger: true,
  }));

  /*
   * DEBIT / ATM CARD PAYMENT
   */
  app.post(
    '/payments/paystack/initialize',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user as {
        id?: string;
        email?: string;
      };

      if (!user?.id) {
        return reply.code(401).send({
          message: 'Authentication required',
        });
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

      if (!user.email) {
        return reply.code(400).send({
          message: 'A valid account email is required before payment',
        });
      }

      const amountInKobo = Math.round(amount * 100);

      const reference =
        `PWSC-${Date.now()}-` +
        randomUUID().replace(/-/g, '').slice(0, 8);

      const description =
        body?.description?.trim() ||
        'Debit/ATM card school payment';

      await db.execute(sql`
        INSERT INTO school_payments
          (
            user_id,
            reference,
            amount,
            currency,
            method,
            status,
            description
          )
        VALUES
          (
            ${user.id},
            ${reference},
            ${amount},
            'NGN',
            'DEBIT_CARD',
            'PENDING',
            ${description}
          )
      `);

      try {
        const result = await paystackRequest(
          '/transaction/initialize',
          {
            method: 'POST',
            body: JSON.stringify({
              email: user.email,
              amount: String(amountInKobo),
              currency: 'NGN',
              reference,
              channels: ['card'],
              callback_url: PAYSTACK_CALLBACK_URL,
              metadata: {
                school: 'Perfect Wisdom School',
                user_id: user.id,
                payment_reference: reference,
                payment_method: 'DEBIT_CARD',
                description,
              },
            }),
          },
        );

        return reply.send({
          authorization_url:
            result.data.authorization_url,
          access_code: result.data.access_code,
          reference: result.data.reference,
        });
      } catch (error) {
        await db.execute(sql`
          UPDATE school_payments
          SET
            status = 'FAILED',
            updated_at = now()
          WHERE reference = ${reference}
        `);

        return reply.code(502).send({
          message:
            error instanceof Error
              ? error.message
              : 'Unable to initialize debit card payment',
        });
      }
    },
  );

  /*
   * PAYSTACK CALLBACK
   */
  app.get(
    '/payments/paystack/callback',
    async (request, reply) => {
      const query = request.query as {
        reference?: string;
      };

      const reference = query.reference;

      if (!reference) {
        return reply.redirect(
          `${SCHOOL_WEB_URL}/?payment=failed`,
        );
      }

      try {
        const result =
          await verifyAndCreditPayment(reference);

        return reply.redirect(
          `${SCHOOL_WEB_URL}/?payment=${
            result.verified ? 'success' : 'failed'
          }&reference=${encodeURIComponent(reference)}`,
        );
      } catch (error) {
        console.error(
          'Paystack callback verification failed:',
          error,
        );

        return reply.redirect(
          `${SCHOOL_WEB_URL}/?payment=failed&reference=${
            encodeURIComponent(reference)
          }`,
        );
      }
    },
  );

  /*
   * MANUAL/AUTOMATIC VERIFICATION ENDPOINT
   */
  app.get(
    '/payments/paystack/verify',
    { preHandler: requireAuth },
    async (request, reply) => {
      const query = request.query as {
        reference?: string;
      };

      if (!query.reference) {
        return reply.code(400).send({
          message: 'Payment reference is required',
        });
      }

      try {
        const result =
          await verifyAndCreditPayment(query.reference);

        return reply.send({
          success: result.verified,
          alreadyCompleted: result.alreadyCompleted,
          balance: result.balance,
          currency: result.currency,
          reference: query.reference,
        });
      } catch (error) {
        return reply.code(502).send({
          message:
            error instanceof Error
              ? error.message
              : 'Unable to verify payment',
        });
      }
    },
  );

  /*
   * SCHOOL ACCOUNT BALANCE
   */
  app.get(
    '/payments/school-balance',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (_request, reply) => {
      const result = await db.execute(sql`
        SELECT
          account_name AS "accountName",
          balance,
          currency,
          updated_at AS "updatedAt"
        FROM school_account
        WHERE id = 1
        LIMIT 1
      `);

      const row = result.rows?.[0] as
        | {
            accountName: string;
            balance: string | number;
            currency: string;
            updatedAt: string;
          }
        | undefined;

      return reply.send({
        accountName:
          row?.accountName ||
          'Perfect Wisdom School Account',
        balance: Number(row?.balance || 0),
        currency: row?.currency || 'NGN',
        updatedAt: row?.updatedAt || null,
      });
    },
  );

  /*
   * SCHOOL ACCOUNT LEDGER
   */
  app.get(
    '/payments/school-transactions',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (_request, reply) => {
      const result = await db.execute(sql`
        SELECT
          payment_reference AS reference,
          amount,
          direction,
          balance_after AS "balanceAfter",
          description,
          created_at AS "createdAt"
        FROM school_account_transactions
        ORDER BY created_at DESC
        LIMIT 100
      `);

      return reply.send(result.rows);
    },
  );

  /*
   * USER PAYMENT HISTORY
   */
  app.get(
    '/payments/my',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = request.user as { id?: string };

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
          method,
          status,
          description,
          created_at AS "createdAt"
        FROM school_payments
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `);

      return reply.send(result.rows);
    },
  );
}
