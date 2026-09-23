import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { requireRoles } from './auth.js'

type JambBody = {
  firstName?: string
  lastName?: string
  otherName?: string
  phoneNumber?: string
  email?: string
  dateOfBirth?: string
  gender?: string
  stateOfOrigin?: string
  lga?: string
  ninLast4?: string
  examYear?: number | string
  registrationType?: string
  preferredCourse?: string
  firstChoiceInstitution?: string
  secondChoiceInstitution?: string
  thirdChoiceInstitution?: string
  amount?: number | string
  paymentReference?: string
  notes?: string
  branchId?: string
}

const clean = (value?: string) => {
  const result = value?.trim()
  return result || null
}

export async function jambRoutes(app: FastifyInstance) {
  app.get(
    '/jamb/registrations',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request) => {
      const query = request.query as {
        branchId?: string
        examYear?: string
        status?: string
      }

      const conditions = []

      if (query.branchId) {
        conditions.push(sql`jr.branch_id = ${query.branchId}::uuid`)
      }

      if (query.examYear) {
        conditions.push(sql`jr.exam_year = ${Number(query.examYear)}`)
      }

      if (query.status) {
        conditions.push(sql`jr.status = ${query.status}`)
      }

      const whereClause =
        conditions.length > 0
          ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
          : sql``

      const result = await db.execute(sql`
        SELECT
          jr.*,
          b.branch_id AS branch_code,
          b.name AS branch_name
        FROM jamb_registrations jr
        LEFT JOIN branches b ON b.id = jr.branch_id
        ${whereClause}
        ORDER BY jr.created_at DESC
      `)

      return (result as unknown as { rows: unknown[] }).rows
    },
  )

  app.get(
    '/jamb/registrations/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const result = await db.execute(sql`
        SELECT
          jr.*,
          b.branch_id AS branch_code,
          b.name AS branch_name
        FROM jamb_registrations jr
        LEFT JOIN branches b ON b.id = jr.branch_id
        WHERE jr.id = ${id}::uuid
        LIMIT 1
      `)

      const rows = (result as unknown as { rows: unknown[] }).rows

      if (!rows.length) {
        return reply.code(404).send({
          error: 'JAMB registration not found',
        })
      }

      return rows[0]
    },
  )

  app.post(
    '/jamb/registrations',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const body = request.body as JambBody

      if (!body.firstName?.trim() || !body.lastName?.trim()) {
        return reply.code(400).send({
          error: 'First name and last name are required',
        })
      }

      if (!body.phoneNumber?.trim()) {
        return reply.code(400).send({
          error: 'Phone number is required',
        })
      }

      const examYear = Number(body.examYear)

      if (!Number.isInteger(examYear) || examYear < 2000 || examYear > 2100) {
        return reply.code(400).send({
          error: 'A valid examination year is required',
        })
      }

      const ninLast4 = clean(body.ninLast4)

      if (ninLast4 && !/^\d{4}$/.test(ninLast4)) {
        return reply.code(400).send({
          error: 'NIN reference must contain exactly 4 digits',
        })
      }

      const registrationType =
        body.registrationType === 'DIRECT_ENTRY' ? 'DIRECT_ENTRY' : 'UTME'

      const amount = Number(body.amount || 0)

      if (!Number.isFinite(amount) || amount < 0) {
        return reply.code(400).send({
          error: 'Invalid amount',
        })
      }

      const authUser = request.user as { sub: string }

      if (body.branchId) {
        const branchCheck = await db.execute(sql`
          SELECT id
          FROM branches
          WHERE id = ${body.branchId}::uuid
          LIMIT 1
        `)

        const branchRows = (
          branchCheck as unknown as { rows: unknown[] }
        ).rows

        if (!branchRows.length) {
          return reply.code(400).send({
            error: 'Selected branch was not found',
          })
        }
      }

      const result = await db.execute(sql`
        INSERT INTO jamb_registrations (
          branch_id,
          created_by,
          first_name,
          last_name,
          other_name,
          phone_number,
          email,
          date_of_birth,
          gender,
          state_of_origin,
          lga,
          nin_last4,
          exam_year,
          registration_type,
          preferred_course,
          first_choice_institution,
          second_choice_institution,
          third_choice_institution,
          amount,
          payment_reference,
          notes
        )
        VALUES (
          ${body.branchId ? sql`${body.branchId}::uuid` : sql`NULL`},
          ${authUser.sub}::uuid,
          ${body.firstName.trim()},
          ${body.lastName.trim()},
          ${clean(body.otherName)},
          ${body.phoneNumber.trim()},
          ${clean(body.email)},
          ${clean(body.dateOfBirth)}
            ${clean(body.dateOfBirth) ? sql`::date` : sql``},
          ${clean(body.gender)},
          ${clean(body.stateOfOrigin)},
          ${clean(body.lga)},
          ${ninLast4},
          ${examYear},
          ${registrationType},
          ${clean(body.preferredCourse)},
          ${clean(body.firstChoiceInstitution)},
          ${clean(body.secondChoiceInstitution)},
          ${clean(body.thirdChoiceInstitution)},
          ${amount},
          ${clean(body.paymentReference)},
          ${clean(body.notes)}
        )
        RETURNING *
      `)

      const rows = (result as unknown as { rows: unknown[] }).rows

      return reply.code(201).send({
        registration: rows[0],
      })
    },
  )

  app.patch(
    '/jamb/registrations/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const body = request.body as {
        status?: string
        paymentStatus?: string
        amount?: number | string
        paymentReference?: string
        notes?: string
      }

      const allowedStatuses = [
        'DRAFT',
        'IN_PROGRESS',
        'SUBMITTED',
        'COMPLETED',
        'CANCELLED',
      ]

      const allowedPaymentStatuses = [
        'UNPAID',
        'PARTIAL',
        'PAID',
        'REFUNDED',
      ]

      if (body.status && !allowedStatuses.includes(body.status)) {
        return reply.code(400).send({
          error: 'Invalid registration status',
        })
      }

      if (
        body.paymentStatus &&
        !allowedPaymentStatuses.includes(body.paymentStatus)
      ) {
        return reply.code(400).send({
          error: 'Invalid payment status',
        })
      }

      const amount =
        body.amount === undefined ? undefined : Number(body.amount)

      if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
        return reply.code(400).send({
          error: 'Invalid amount',
        })
      }

      const result = await db.execute(sql`
        UPDATE jamb_registrations
        SET
          status = COALESCE(${body.status || null}, status),
          payment_status = COALESCE(${body.paymentStatus || null}, payment_status),
          amount = COALESCE(${amount ?? null}, amount),
          payment_reference = COALESCE(${clean(body.paymentReference)}, payment_reference),
          notes = COALESCE(${clean(body.notes)}, notes),
          updated_at = now()
        WHERE id = ${id}::uuid
        RETURNING *
      `)

      const rows = (result as unknown as { rows: unknown[] }).rows

      if (!rows.length) {
        return reply.code(404).send({
          error: 'JAMB registration not found',
        })
      }

      return rows[0]
    },
  )
}
