import type { FastifyInstance } from 'fastify'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { branches, classes, parents, students } from '../db/schema.js'
import { requireRoles } from './auth.js'

type StudentBody = {
  firstName?: string
  lastName?: string
  otherName?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  branchId?: string
  parentId?: string
  classId?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

function clean(value?: string | null) {
  const result = value?.trim()
  return result ? result : null
}

export async function studentRoutes(app: FastifyInstance) {
  /*
   * LIST / SEARCH STUDENTS
   */
  app.get(
    '/students',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request) => {
      const query = request.query as {
        search?: string
        branchId?: string
        status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      }

      const conditions = []

      if (query.branchId) {
        conditions.push(eq(students.branchId, query.branchId))
      }

      if (query.status) {
        conditions.push(eq(students.status, query.status))
      }

      const search = clean(query.search)

      if (search) {
        conditions.push(
          or(
            ilike(students.studentId, `%${search}%`),
            ilike(students.firstName, `%${search}%`),
            ilike(students.lastName, `%${search}%`),
            ilike(students.otherName, `%${search}%`),
            ilike(students.phoneNumber, `%${search}%`),
          ),
        )
      }

      const whereClause = conditions.length
        ? and(...conditions)
        : undefined

      const rows = await db
        .select({
          id: students.id,
          studentId: students.studentId,
          firstName: students.firstName,
          lastName: students.lastName,
          otherName: students.otherName,
          phoneNumber: students.phoneNumber,
          dateOfBirth: students.dateOfBirth,
          gender: students.gender,
          address: students.address,
          branchId: students.branchId,
          branchName: branches.name,
          branchCode: branches.code,
          parentId: students.parentId,
          classId: students.classId,
          className: classes.name,
          classCode: classes.code,
          parentFirstName: parents.firstName,
          parentLastName: parents.lastName,
          parentPhoneNumber: parents.phoneNumber,
          passportPhoto: students.passportPhoto,
          status: students.status,
          createdAt: students.createdAt,
          updatedAt: students.updatedAt,
        })
        .from(students)
        .leftJoin(branches, eq(students.branchId, branches.id))
        .leftJoin(parents, eq(students.parentId, parents.id))
        .leftJoin(classes, eq(students.classId, classes.id))
        .where(whereClause)
        .orderBy(sql`${students.createdAt} DESC`)

      return {
        students: rows,
        total: rows.length,
      }
    },
  )

  /*
   * STUDENT SUMMARY
   */
  app.get(
    '/students/summary',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async () => {
      const result = await db.execute(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
          COUNT(*) FILTER (WHERE status = 'INACTIVE')::int AS inactive,
          COUNT(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended
        FROM students
      `)

        return result.rows[0] ?? {
          total: 0,
          active: 0,
          inactive: 0,
          suspended: 0,
        }
    },
  )

  /*
   * GET ONE STUDENT
   */
  app.get(
    '/students/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const [student] = await db
        .select({
          id: students.id,
          studentId: students.studentId,
          firstName: students.firstName,
          lastName: students.lastName,
          otherName: students.otherName,
          phoneNumber: students.phoneNumber,
          dateOfBirth: students.dateOfBirth,
          gender: students.gender,
          address: students.address,
          branchId: students.branchId,
          branchName: branches.name,
          branchCode: branches.code,
          parentId: students.parentId,
          classId: students.classId,
          className: classes.name,
          classCode: classes.code,
          parentFirstName: parents.firstName,
          parentLastName: parents.lastName,
          parentPhoneNumber: parents.phoneNumber,
          parentEmail: parents.email,
          passportPhoto: students.passportPhoto,
          status: students.status,
          createdAt: students.createdAt,
          updatedAt: students.updatedAt,
        })
        .from(students)
        .leftJoin(branches, eq(students.branchId, branches.id))
        .leftJoin(parents, eq(students.parentId, parents.id))
        .leftJoin(classes, eq(students.classId, classes.id))
        .where(eq(students.id, id))

      if (!student) {
        return reply.code(404).send({
          error: 'Student record not found',
        })
      }

      return student
    },
  )

  /*
   * CREATE STUDENT
   */
  app.post(
    '/students',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const body = request.body as StudentBody

      const firstName = clean(body.firstName)
      const lastName = clean(body.lastName)
      const phoneNumber = clean(body.phoneNumber)

      if (!firstName || !lastName || !phoneNumber) {
        return reply.code(400).send({
          error: 'First name, last name and phone number are required',
        })
      }

      if (body.gender && !['MALE', 'FEMALE', 'OTHER'].includes(body.gender)) {
        return reply.code(400).send({
          error: 'Invalid gender',
        })
      }

      if (body.branchId) {
        const [branch] = await db
          .select({ id: branches.id })
          .from(branches)
          .where(eq(branches.id, body.branchId))

        if (!branch) {
          return reply.code(400).send({
            error: 'Selected branch was not found',
          })
        }
      }

      if (body.parentId) {
        const [parent] = await db
          .select({ id: parents.id })
          .from(parents)
          .where(eq(parents.id, body.parentId))

        if (!parent) {
          return reply.code(400).send({
            error: 'Selected parent was not found',
          })
        }
      }

      if (body.classId) {
        const [schoolClass] = await db
          .select({ id: classes.id })
          .from(classes)
          .where(eq(classes.id, body.classId))

        if (!schoolClass) {
          return reply.code(400).send({
            error: 'Selected class was not found',
          })
        }
      }

      const result = await db.transaction(async (tx) => {
        const sequence = await tx.execute(sql`
          SELECT nextval('pws_student_id_seq') AS value
        `)

        const sequenceRows = sequence as unknown as Array<{
          value: string | number
        }>

        const number = Number(sequenceRows[0]?.value)

        if (!number) {
          throw new Error('Unable to generate student ID')
        }

        const studentId = `PWS-STU-${String(number).padStart(6, '0')}`

        const [created] = await tx
          .insert(students)
          .values({
            studentId,
            firstName,
            lastName,
            otherName: clean(body.otherName),
            phoneNumber,
            dateOfBirth: clean(body.dateOfBirth),
            gender: body.gender || null,
            address: clean(body.address),
            branchId: body.branchId || null,
            parentId: body.parentId || null,
            classId: body.classId || null,
            status: body.status || 'ACTIVE',
          })
          .returning()

        return created
      })

      return reply.code(201).send(result)
    },
  )


  /*
   * PATCH PASSPORT PHOTO
   */
  app.patch(
    '/students/:id/passport',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as {
        passportPhoto?: string | null
      }

      const passportPhoto =
        typeof body.passportPhoto === 'string'
          ? body.passportPhoto.trim()
          : ''

      if (!passportPhoto) {
        return reply.code(400).send({
          error: 'Passport photo is required',
        })
      }

      if (!passportPhoto.startsWith('data:image/')) {
        return reply.code(400).send({
          error: 'Passport photo must be a valid image',
        })
      }

      // Keep passport uploads within a reasonable database payload size.
      if (passportPhoto.length > 2_000_000) {
        return reply.code(400).send({
          error: 'Passport photo is too large. Maximum size is 1.5MB.',
        })
      }

      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, id))

      if (!existing) {
        return reply.code(404).send({
          error: 'Student record not found',
        })
      }

      const [updated] = await db
        .update(students)
        .set({
          passportPhoto,
          updatedAt: new Date(),
        })
        .where(eq(students.id, id))
        .returning()

      if (!updated) {
        return reply.code(404).send({
          error: 'Student record could not be updated',
        })
      }

      return reply.send({
        id: updated.id,
        passportPhoto: updated.passportPhoto,
        updatedAt: updated.updatedAt,
      })
    },
  )

  /*
   * UPDATE STUDENT
   */
  app.patch(
    '/students/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as StudentBody

      const [existing] = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, id))

      if (!existing) {
        return reply.code(404).send({
          error: 'Student record not found',
        })
      }

      if (body.branchId) {
        const [branch] = await db
          .select({ id: branches.id })
          .from(branches)
          .where(eq(branches.id, body.branchId))

        if (!branch) {
          return reply.code(400).send({
            error: 'Selected branch was not found',
          })
        }
      }

      if (body.parentId) {
        const [parent] = await db
          .select({ id: parents.id })
          .from(parents)
          .where(eq(parents.id, body.parentId))

        if (!parent) {
          return reply.code(400).send({
            error: 'Selected parent was not found',
          })
        }
      }

      if (body.classId) {
        const [schoolClass] = await db
          .select({ id: classes.id })
          .from(classes)
          .where(eq(classes.id, body.classId))

        if (!schoolClass) {
          return reply.code(400).send({
            error: 'Selected class was not found',
          })
        }
      }

      const [updated] = await db
        .update(students)
        .set({
          ...(body.firstName !== undefined
            ? { firstName: clean(body.firstName) || '' }
            : {}),
          ...(body.lastName !== undefined
            ? { lastName: clean(body.lastName) || '' }
            : {}),
          ...(body.otherName !== undefined
            ? { otherName: clean(body.otherName) }
            : {}),
          ...(body.phoneNumber !== undefined
            ? { phoneNumber: clean(body.phoneNumber) || '' }
            : {}),
          ...(body.dateOfBirth !== undefined
            ? { dateOfBirth: clean(body.dateOfBirth) }
            : {}),
          ...(body.gender !== undefined
            ? { gender: body.gender || null }
            : {}),
          ...(body.address !== undefined
            ? { address: clean(body.address) }
            : {}),
          ...(body.branchId !== undefined
            ? { branchId: body.branchId || null }
            : {}),
          ...(body.parentId !== undefined
            ? { parentId: body.parentId || null }
            : {}),
          ...(body.classId !== undefined
            ? { classId: body.classId || null }
            : {}),
          ...(body.status !== undefined
            ? { status: body.status }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(students.id, id))
        .returning()

      return updated
    },
  )
}
