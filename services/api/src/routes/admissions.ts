import type { FastifyInstance } from 'fastify'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { requireRoles } from './auth.js'

type AdmissionBody = {
  firstName?: string
  lastName?: string
  otherName?: string
  phoneNumber?: string
  email?: string
  dateOfBirth?: string
  gender?: string
  stateOfOrigin?: string
  lga?: string
  address?: string

  parentFirstName?: string
  parentLastName?: string
  parentPhoneNumber?: string
  parentEmail?: string
  parentRelationship?: string

  previousSchool?: string
  desiredClassId?: string
  branchId?: string

  applicationDate?: string
  status?: string

  applicationFee?: string | number
  paymentStatus?: string
  paymentReference?: string
  notes?: string
}

function clean(value?: string | null) {
  const result = value?.trim()
  return result ? result : null
}

const statuses = [
  'NEW',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'WAITLISTED',
  'ENROLLED',
] as const

const paymentStatuses = [
  'UNPAID',
  'PARTIAL',
  'PAID',
  'REFUNDED',
] as const

export async function admissionsRoutes(app: FastifyInstance) {
  app.get(
    '/admissions',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request) => {
      const query = request.query as {
        search?: string
        status?: string
        branchId?: string
      }

      const search = clean(query.search)
      const conditions = []

      if (search) {
        conditions.push(
          or(
            ilike(sql`admissions.application_id`, `%${search}%`),
            ilike(sql`admissions.first_name`, `%${search}%`),
            ilike(sql`admissions.last_name`, `%${search}%`),
            ilike(sql`admissions.phone_number`, `%${search}%`),
          ),
        )
      }

      if (query.status) {
        conditions.push(eq(sql`admissions.status`, query.status))
      }

      if (query.branchId) {
        conditions.push(eq(sql`admissions.branch_id`, query.branchId))
      }

      return db.execute(sql`
        SELECT
          a.id,
          a.application_id,
          a.first_name,
          a.last_name,
          a.other_name,
          a.phone_number,
          a.email,
          a.date_of_birth,
          a.gender,
          a.state_of_origin,
          a.lga,
          a.address,
          a.parent_first_name,
          a.parent_last_name,
          a.parent_phone_number,
          a.parent_email,
          a.parent_relationship,
          a.previous_school,
          a.desired_class_id,
          c.name AS desired_class_name,
          c.code AS desired_class_code,
          a.branch_id,
          b.name AS branch_name,
          b.code AS branch_code,
          a.application_date,
          a.status,
          a.application_fee,
          a.payment_status,
          a.payment_reference,
          a.notes,
          a.converted_student_id,
          s.student_id AS converted_student_number,
          a.created_at,
          a.updated_at
        FROM admissions a
        LEFT JOIN classes c ON c.id = a.desired_class_id
        LEFT JOIN branches b ON b.id = a.branch_id
        LEFT JOIN students s ON s.id = a.converted_student_id
        ${conditions.length
          ? sql`WHERE ${and(...conditions)}`
          : sql``}
        ORDER BY a.created_at DESC
      `)
    },
  )

  app.get(
    '/admissions/summary',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async () => {
      const result = await db.execute(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'NEW')::int AS new,
          COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW')::int AS under_review,
          COUNT(*) FILTER (WHERE status = 'ACCEPTED')::int AS accepted,
          COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
          COUNT(*) FILTER (WHERE status = 'WAITLISTED')::int AS waitlisted,
          COUNT(*) FILTER (WHERE status = 'ENROLLED')::int AS enrolled,
          COUNT(*) FILTER (WHERE payment_status = 'PAID')::int AS paid
        FROM admissions
      `)

      return result.rows[0] ?? {
        total: 0,
        new: 0,
        under_review: 0,
        accepted: 0,
        rejected: 0,
        waitlisted: 0,
        enrolled: 0,
        paid: 0,
      }
    },
  )

  app.get(
    '/admissions/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const result = await db.execute(sql`
        SELECT
          a.*,
          c.name AS desired_class_name,
          c.code AS desired_class_code,
          b.name AS branch_name,
          b.code AS branch_code,
          s.student_id AS converted_student_number
        FROM admissions a
        LEFT JOIN classes c ON c.id = a.desired_class_id
        LEFT JOIN branches b ON b.id = a.branch_id
        LEFT JOIN students s ON s.id = a.converted_student_id
        WHERE a.id = ${id}
        LIMIT 1
      `)

      const admission = result.rows[0]

      if (!admission) {
        return reply.code(404).send({ message: 'Admission application not found' })
      }

      return admission
    },
  )

  app.post(
    '/admissions',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const body = request.body as AdmissionBody

      const firstName = clean(body.firstName)
      const lastName = clean(body.lastName)
      const phoneNumber = clean(body.phoneNumber)

      if (!firstName || !lastName || !phoneNumber) {
        return reply.code(400).send({
          message: 'First name, last name and phone number are required',
        })
      }

      if (body.status && !statuses.includes(body.status as typeof statuses[number])) {
        return reply.code(400).send({ message: 'Invalid admission status' })
      }

      if (
        body.paymentStatus &&
        !paymentStatuses.includes(body.paymentStatus as typeof paymentStatuses[number])
      ) {
        return reply.code(400).send({ message: 'Invalid payment status' })
      }

      if (body.desiredClassId) {
        const classCheck = await db.execute(sql`
          SELECT id FROM classes WHERE id = ${body.desiredClassId} LIMIT 1
        `)

        if (!classCheck.rows[0]) {
          return reply.code(400).send({ message: 'Selected class was not found' })
        }
      }

      if (body.branchId) {
        const branchCheck = await db.execute(sql`
          SELECT id FROM branches WHERE id = ${body.branchId} LIMIT 1
        `)

        if (!branchCheck.rows[0]) {
          return reply.code(400).send({ message: 'Selected branch was not found' })
        }
      }

      const applicationIdResult = await db.execute(sql`
        SELECT 'PWS-ADM-' ||
          LPAD(nextval('pws_admission_id_seq')::text, 6, '0') AS application_id
      `)

      const applicationId = applicationIdResult.rows[0]?.application_id

      const result = await db.execute(sql`
        INSERT INTO admissions (
          application_id,
          first_name,
          last_name,
          other_name,
          phone_number,
          email,
          date_of_birth,
          gender,
          state_of_origin,
          lga,
          address,
          parent_first_name,
          parent_last_name,
          parent_phone_number,
          parent_email,
          parent_relationship,
          previous_school,
          desired_class_id,
          branch_id,
          application_date,
          status,
          application_fee,
          payment_status,
          payment_reference,
          notes
        )
        VALUES (
          ${applicationId},
          ${firstName},
          ${lastName},
          ${clean(body.otherName)},
          ${phoneNumber},
          ${clean(body.email)},
          ${clean(body.dateOfBirth)},
          ${clean(body.gender)},
          ${clean(body.stateOfOrigin)},
          ${clean(body.lga)},
          ${clean(body.address)},
          ${clean(body.parentFirstName)},
          ${clean(body.parentLastName)},
          ${clean(body.parentPhoneNumber)},
          ${clean(body.parentEmail)},
          ${clean(body.parentRelationship)},
          ${clean(body.previousSchool)},
          ${clean(body.desiredClassId)},
          ${clean(body.branchId)},
          ${clean(body.applicationDate) || sql`CURRENT_DATE`},
          ${body.status || 'NEW'},
          ${body.applicationFee || 0},
          ${body.paymentStatus || 'UNPAID'},
          ${clean(body.paymentReference)},
          ${clean(body.notes)}
        )
        RETURNING *
      `)

      return reply.code(201).send(result.rows[0])
    },
  )

  app.patch(
    '/admissions/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as AdmissionBody

      if (body.status && !statuses.includes(body.status as typeof statuses[number])) {
        return reply.code(400).send({ message: 'Invalid admission status' })
      }

      if (
        body.paymentStatus &&
        !paymentStatuses.includes(body.paymentStatus as typeof paymentStatuses[number])
      ) {
        return reply.code(400).send({ message: 'Invalid payment status' })
      }

      const result = await db.execute(sql`
        UPDATE admissions
        SET
          status = COALESCE(${body.status || null}, status),
          payment_status = COALESCE(${body.paymentStatus || null}, payment_status),
          payment_reference = COALESCE(${clean(body.paymentReference)}, payment_reference),
          application_fee = COALESCE(${body.applicationFee ?? null}, application_fee),
          notes = COALESCE(${clean(body.notes)}, notes),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `)

      if (!result.rows[0]) {
        return reply.code(404).send({ message: 'Admission application not found' })
      }

      return result.rows[0]
    },
  )

  app.post(
    '/admissions/:id/enroll',
    { preHandler: requireRoles('ADMIN') },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as {
        branchId?: string
        classId?: string
      }

      const admissionResult = await db.execute(sql`
        SELECT *
        FROM admissions
        WHERE id = ${id}
        LIMIT 1
      `)

      const admission = admissionResult.rows[0] as any

      if (!admission) {
        return reply.code(404).send({ message: 'Admission application not found' })
      }

      if (admission.converted_student_id) {
        return reply.code(409).send({
          message: 'This applicant has already been enrolled',
          studentId: admission.converted_student_id,
          studentNumber: admission.converted_student_number,
        })
      }

      if (admission.status !== 'ACCEPTED') {
        return reply.code(400).send({
          message: 'Only an accepted applicant can be enrolled',
        })
      }

      const branchId = body.branchId || admission.branch_id
      const classId = body.classId || admission.desired_class_id

      if (classId) {
        const classCheck = await db.execute(sql`
          SELECT id FROM classes WHERE id = ${classId} LIMIT 1
        `)

        if (!classCheck.rows[0]) {
          return reply.code(400).send({ message: 'Selected class was not found' })
        }
      }

      const studentNumberResult = await db.execute(sql`
        SELECT 'PWS-STU-' ||
          LPAD(nextval('pws_student_id_seq')::text, 6, '0') AS student_id
      `)

      const studentNumber = studentNumberResult.rows[0]?.student_id

      let parentId: string | null = null

      if (admission.parent_phone_number) {
        const existingParent = await db.execute(sql`
          SELECT id
          FROM parents
          WHERE phone_number = ${admission.parent_phone_number}
          LIMIT 1
        `)

        if (existingParent.rows[0]) {
          parentId = existingParent.rows[0].id as string
        } else if (admission.parent_first_name && admission.parent_last_name) {
          const parentResult = await db.execute(sql`
            INSERT INTO parents (
              first_name,
              last_name,
              phone_number,
              email
            )
            VALUES (
              ${admission.parent_first_name},
              ${admission.parent_last_name},
              ${admission.parent_phone_number},
              ${admission.parent_email}
            )
            RETURNING id
          `)

          parentId = parentResult.rows[0]?.id as string | null
        }
      }

      const studentResult = await db.execute(sql`
        INSERT INTO students (
          student_id,
          first_name,
          last_name,
          other_name,
          phone_number,
          date_of_birth,
          gender,
          address,
          branch_id,
          parent_id,
          class_id,
          status
        )
        VALUES (
          ${studentNumber},
          ${admission.first_name},
          ${admission.last_name},
          ${admission.other_name},
          ${admission.phone_number},
          ${admission.date_of_birth},
          ${admission.gender},
          ${admission.address},
          ${branchId},
          ${parentId},
          ${classId},
          'ACTIVE'
        )
        RETURNING id, student_id
      `)

      const student = studentResult.rows[0]

      if (!student) {
        return reply.code(500).send({
          message: 'Student enrollment failed: student record was not created',
        })
      }

      await db.execute(sql`
        UPDATE admissions
        SET
          converted_student_id = ${student.id},
          status = 'ENROLLED',
          updated_at = NOW()
        WHERE id = ${id}
      `)

      return reply.code(201).send({
        message: 'Applicant enrolled successfully',
        studentId: student.id,
        studentNumber: student.student_id,
      })
    },
  )
}
