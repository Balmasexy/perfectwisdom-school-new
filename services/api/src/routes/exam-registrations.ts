import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { requireRoles } from './auth.js'

type ExamType = 'WAEC' | 'NECO'

type ExamBody = {
  studentId?: string
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
  examinationCentre?: string
  subjects?: string
  amount?: number | string
  paymentReference?: string
  notes?: string
  branchId?: string
}

const clean = (value?: string) => {
  const result = value?.trim()
  return result || null
}

function normalizeExamType(value?: string): ExamType | null {
  const normalized = value?.trim().toUpperCase()

  if (normalized === 'WAEC') return 'WAEC'
  if (normalized === 'NECO') return 'NECO'

  return null
}

function sequenceFor(examType: ExamType) {
  return examType === 'WAEC'
    ? 'pws_waec_candidate_seq'
    : 'pws_neco_candidate_seq'
}

export async function examRegistrationRoutes(app: FastifyInstance) {
  app.get(
    '/exam-registrations',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const query = request.query as {
        examType?: string
        branchId?: string
        examYear?: string
        status?: string
        studentId?: string
      }

      const examType = normalizeExamType(query.examType)

      if (!examType) {
        return reply.code(400).send({
          error: 'examType must be WAEC or NECO',
        })
      }

      const conditions = [
        sql`er.exam_type = ${examType}`,
      ]

      if (query.branchId) {
        conditions.push(
          sql`er.branch_id = ${query.branchId}::uuid`,
        )
      }

      if (query.examYear) {
        const year = Number(query.examYear)

        if (!Number.isInteger(year)) {
          return reply.code(400).send({
            error: 'Invalid examination year',
          })
        }

        conditions.push(sql`er.exam_year = ${year}`)
      }

      if (query.status) {
        conditions.push(sql`er.status = ${query.status}`)
      }

      if (query.studentId) {
        conditions.push(sql`er.student_id = ${query.studentId}::uuid`)
      }

      const whereClause = sql`
        WHERE ${sql.join(conditions, sql` AND `)}
      `

      const result = await db.execute(sql`
        SELECT
          er.*,
          b.code AS branch_code,
          b.name AS branch_name
        FROM exam_registrations er
        LEFT JOIN branches b
          ON b.id = er.branch_id
        ${whereClause}
        ORDER BY er.created_at DESC
      `)

      return (result as unknown as { rows: unknown[] }).rows
    },
  )

  app.get(
    '/exam-registrations/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as {
        id: string
      }

      const result = await db.execute(sql`
        SELECT
          er.*,
          b.code AS branch_code,
          b.name AS branch_name
        FROM exam_registrations er
        LEFT JOIN branches b
          ON b.id = er.branch_id
        WHERE er.id = ${id}::uuid
        LIMIT 1
      `)

      const rows =
        (result as unknown as { rows: unknown[] }).rows

      if (!rows.length) {
        return reply.code(404).send({
          error: 'Examination registration not found',
        })
      }

      return rows[0]
    },
  )

  app.post(
    '/exam-registrations',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const body = request.body as ExamBody

      const examType = normalizeExamType(
        (body as ExamBody & { examType?: string }).examType,
      )

      if (!examType) {
        return reply.code(400).send({
          error: 'examType must be WAEC or NECO',
        })
      }

      if (
        !body.firstName?.trim() ||
        !body.lastName?.trim()
      ) {
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

      if (
        !Number.isInteger(examYear) ||
        examYear < 2000 ||
        examYear > 2100
      ) {
        return reply.code(400).send({
          error: 'A valid examination year is required',
        })
      }

      const ninLast4 = clean(body.ninLast4)

      if (
        ninLast4 &&
        !/^\d{4}$/.test(ninLast4)
      ) {
        return reply.code(400).send({
          error: 'NIN reference must contain exactly 4 digits',
        })
      }

      const amount = Number(body.amount || 0)

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        return reply.code(400).send({
          error: 'Invalid amount',
        })
      }

      const authUser =
        request.user as { sub: string }

      if (body.branchId) {
        const branchCheck = await db.execute(sql`
          SELECT id
          FROM branches
          WHERE id = ${body.branchId}::uuid
          LIMIT 1
        `)

        const branchRows =
          (
            branchCheck as unknown as {
              rows: unknown[]
            }
          ).rows

        if (!branchRows.length) {
          return reply.code(400).send({
            error: 'Selected branch was not found',
          })
        }
      }

      if (body.studentId) {
        const studentCheck = await db.execute(sql`
          SELECT
            id,
            student_id,
            first_name,
            last_name,
            other_name,
            phone_number,
            date_of_birth,
            gender,
            branch_id,
            parent_id,
            class_id
          FROM students
          WHERE id = ${body.studentId}::uuid
          LIMIT 1
        `)

        const studentRows =
          (
            studentCheck as unknown as {
              rows: unknown[]
            }
          ).rows

        if (!studentRows.length) {
          return reply.code(400).send({
            error: 'Selected student was not found',
          })
        }

        const duplicateCheck = await db.execute(sql`
          SELECT candidate_id
          FROM exam_registrations
          WHERE student_id = ${body.studentId}::uuid
            AND exam_type = ${examType}
            AND exam_year = ${examYear}
            AND status <> 'CANCELLED'
          LIMIT 1
        `)

        const duplicateRows =
          (
            duplicateCheck as unknown as {
              rows: Array<{ candidate_id: string }>
            }
          ).rows

        const duplicate = duplicateRows[0]

        if (duplicate) {
          return reply.code(409).send({
            error:
              `${examType} registration already exists for this student ` +
              `for ${examYear} (${duplicate.candidate_id}).`,
          })
        }
      }

      const sequence = sequenceFor(examType)

      const candidatePrefix =
        examType === 'WAEC'
          ? 'PWS-WAC-'
          : 'PWS-NEC-'

      const candidateIdResult = await db.execute(sql`
        SELECT
          ${candidatePrefix} ||
          lpad(
            nextval(${sequence})::text,
            6,
            '0'
          ) AS candidate_id
      `)

      const candidateRows =
        (
          candidateIdResult as unknown as {
            rows: Array<{
              candidate_id: string
            }>
          }
        ).rows

      const candidateId =
        candidateRows[0]?.candidate_id

      if (!candidateId) {
        return reply.code(500).send({
          error: 'Unable to generate examination candidate ID',
        })
      }

      const registrationType =
        clean(body.registrationType) ||
        'SCHOOL_CANDIDATE'

      const result = await db.execute(sql`
        INSERT INTO exam_registrations (
          candidate_id,
          exam_type,
          branch_id,
          created_by,
          student_id,
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
          examination_centre,
          subjects,
          amount,
          payment_reference,
          notes
        )
        VALUES (
          ${candidateId},
          ${examType},
          ${body.branchId ? sql`${body.branchId}::uuid` : sql`NULL`},
          ${authUser.sub}::uuid,
          ${body.studentId ? sql`${body.studentId}::uuid` : sql`NULL`},
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
          ${clean(body.examinationCentre)},
          ${clean(body.subjects)},
          ${amount},
          ${clean(body.paymentReference)},
          ${clean(body.notes)}
        )
        RETURNING *
      `)

      const rows =
        (result as unknown as { rows: unknown[] }).rows

      const registration = rows[0]

      return reply.code(201).send({
        registration,
      })
    },
  )

  app.patch(
    '/exam-registrations/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as {
        id: string
      }

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

      if (
        body.status &&
        !allowedStatuses.includes(body.status)
      ) {
        return reply.code(400).send({
          error: 'Invalid registration status',
        })
      }

      if (
        body.paymentStatus &&
        !allowedPaymentStatuses.includes(
          body.paymentStatus,
        )
      ) {
        return reply.code(400).send({
          error: 'Invalid payment status',
        })
      }

      const amount =
        body.amount === undefined
          ? undefined
          : Number(body.amount)

      if (
        amount !== undefined &&
        (!Number.isFinite(amount) ||
          amount < 0)
      ) {
        return reply.code(400).send({
          error: 'Invalid amount',
        })
      }

      const result = await db.execute(sql`
        UPDATE exam_registrations
        SET
          status =
            COALESCE(
              ${body.status || null},
              status
            ),

          payment_status =
            COALESCE(
              ${body.paymentStatus || null},
              payment_status
            ),

          amount =
            COALESCE(
              ${amount ?? null},
              amount
            ),

          payment_reference =
            COALESCE(
              ${clean(body.paymentReference)},
              payment_reference
            ),

          notes =
            COALESCE(
              ${clean(body.notes)},
              notes
            ),

          updated_at = now()

        WHERE id = ${id}::uuid

        RETURNING *
      `)

      const rows =
        (result as unknown as { rows: unknown[] }).rows

      if (!rows.length) {
        return reply.code(404).send({
          error: 'Examination registration not found',
        })
      }

      return rows[0]
    },
  )
}
