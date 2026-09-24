import type { FastifyInstance } from 'fastify'
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { branches, classes, staff, students } from '../db/schema.js'
import { requireRoles } from './auth.js'

type ClassBody = {
  name?: string
  code?: string
  branchId?: string
  teacherId?: string
}

export async function classRoutes(app: FastifyInstance) {
  app.get('/classes', {
    preHandler: requireRoles('ADMIN', 'STAFF'),
  }, async (request) => {
    const query = request.query as {
      search?: string
      branchId?: string
    }

    const search = query.search?.trim()
    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(classes.name, `%${search}%`),
          ilike(classes.code, `%${search}%`),
        ),
      )
    }

    if (query.branchId) {
      conditions.push(eq(classes.branchId, query.branchId))
    }

    return db
      .select({
        id: classes.id,
        name: classes.name,
        code: classes.code,
        branchId: classes.branchId,
        branchName: branches.name,
        branchCode: branches.code,
        teacherId: classes.teacherId,
        teacherFirstName: staff.firstName,
        teacherLastName: staff.lastName,
        studentCount: sql<number>`(
          SELECT COUNT(*)
          FROM students
          WHERE students.class_id = ${classes.id}
        )`,
        createdAt: classes.createdAt,
        updatedAt: classes.updatedAt,
      })
      .from(classes)
      .leftJoin(branches, eq(classes.branchId, branches.id))
      .leftJoin(staff, eq(classes.teacherId, staff.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(classes.name))
  })

  app.get('/classes/:id', {
    preHandler: requireRoles('ADMIN', 'STAFF'),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [schoolClass] = await db
      .select({
        id: classes.id,
        name: classes.name,
        code: classes.code,
        branchId: classes.branchId,
        branchName: branches.name,
        branchCode: branches.code,
        teacherId: classes.teacherId,
        teacherFirstName: staff.firstName,
        teacherLastName: staff.lastName,
      })
      .from(classes)
      .leftJoin(branches, eq(classes.branchId, branches.id))
      .leftJoin(staff, eq(classes.teacherId, staff.id))
      .where(eq(classes.id, id))

    if (!schoolClass) {
      return reply.code(404).send({ message: 'Class not found' })
    }

    const enrolledStudents = await db
      .select({
        id: students.id,
        studentId: students.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        otherName: students.otherName,
        status: students.status,
      })
      .from(students)
      .where(eq(students.classId, id))
      .orderBy(asc(students.lastName), asc(students.firstName))

    return {
      ...schoolClass,
      students: enrolledStudents,
      studentCount: enrolledStudents.length,
    }
  })

  app.post('/classes', {
    preHandler: requireRoles('ADMIN'),
  }, async (request, reply) => {
    const body = request.body as ClassBody

    const name = body.name?.trim()
    const code = body.code?.trim()

    if (!name || !code) {
      return reply.code(400).send({
        message: 'Class name and class code are required',
      })
    }

    if (body.branchId) {
      const [branch] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(eq(branches.id, body.branchId))

      if (!branch) {
        return reply.code(400).send({ message: 'Branch not found' })
      }
    }

    if (body.teacherId) {
      const [teacher] = await db
        .select({ id: staff.id })
        .from(staff)
        .where(eq(staff.id, body.teacherId))

      if (!teacher) {
        return reply.code(400).send({ message: 'Teacher not found' })
      }
    }

    const [existing] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.code, code))

    if (existing) {
      return reply.code(409).send({
        message: 'A class with this code already exists',
      })
    }

    const [created] = await db
      .insert(classes)
      .values({
        name,
        code,
        branchId: body.branchId || null,
        teacherId: body.teacherId || null,
      })
      .returning()

    return reply.code(201).send(created)
  })

  app.patch('/classes/:id', {
    preHandler: requireRoles('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as ClassBody

    const [existing] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.id, id))

    if (!existing) {
      return reply.code(404).send({ message: 'Class not found' })
    }

    if (body.branchId) {
      const [branch] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(eq(branches.id, body.branchId))

      if (!branch) {
        return reply.code(400).send({ message: 'Branch not found' })
      }
    }

    if (body.teacherId) {
      const [teacher] = await db
        .select({ id: staff.id })
        .from(staff)
        .where(eq(staff.id, body.teacherId))

      if (!teacher) {
        return reply.code(400).send({ message: 'Teacher not found' })
      }
    }

    const cleanCode = body.code?.trim()

    if (cleanCode) {
      const [duplicate] = await db
        .select({ id: classes.id })
        .from(classes)
        .where(
          and(
            eq(classes.code, cleanCode),
            sql`${classes.id} <> ${id}`,
          ),
        )

      if (duplicate) {
        return reply.code(409).send({
          message: 'A class with this code already exists',
        })
      }
    }

    const [updated] = await db
      .update(classes)
      .set({
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.code !== undefined ? { code: cleanCode || '' } : {}),
        ...(body.branchId !== undefined
          ? { branchId: body.branchId || null }
          : {}),
        ...(body.teacherId !== undefined
          ? { teacherId: body.teacherId || null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id))
      .returning()

    return updated
  })
}
