import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { requireAuth } from './auth.js'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function validDate(value: unknown) {
  const valueText = text(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(valueText) ? valueText : ''
}

async function reportAccess(request: FastifyRequest, reply: FastifyReply) {
  const user = await requireAuth(request, reply)
  if (!user) return null

  if (!['ADMIN', 'STAFF'].includes(String(user.role || ''))) {
    reply.code(403).send({
      error: 'You do not have permission to access school reports.',
    })
    return null
  }

  return user
}

export async function reportRoutes(app: FastifyInstance) {
  app.get('/reports/attendance', { preHandler: requireAuth }, async (request, reply) => {
    const user = await reportAccess(request, reply)
    if (!user) return

    const query = request.query as {
      from?: string
      to?: string
      classId?: string
      studentId?: string
    }

    const from = validDate(query.from)
    const to = validDate(query.to)
    const classId = text(query.classId)
    const studentId = text(query.studentId)

    const conditions = [
      sql`1 = 1`,
      from ? sql`a.attendance_date >= ${from}` : sql`1 = 1`,
      to ? sql`a.attendance_date <= ${to}` : sql`1 = 1`,
      classId ? sql`a.class_id = ${classId}::uuid` : sql`1 = 1`,
      studentId ? sql`a.student_id = ${studentId}::uuid` : sql`1 = 1`,
    ]

    const result = await db.execute(sql`
      SELECT
        a.id,
        a.attendance_date AS date,
        a.present,
        s.id AS student_id,
        s.student_id AS student_code,
        TRIM(CONCAT(
          s.first_name,
          ' ',
          COALESCE(s.other_name || ' ', ''),
          s.last_name
        )) AS student_name,
        c.id AS class_id,
        c.name AS class_name
      FROM attendance a
      INNER JOIN students s ON s.id = a.student_id
      LEFT JOIN classes c ON c.id = a.class_id
      WHERE ${sql.join(conditions, sql` AND `)}
      ORDER BY a.attendance_date DESC, student_name ASC
    `)

    const records = (result.rows as any[]).map((row) => ({
      id: row.id,
      date: row.date,
      present: Boolean(row.present),
      status: Boolean(row.present) ? 'Present' : 'Absent',
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name,
      classId: row.class_id,
      className: row.class_name || 'Unassigned',
    }))

    const total = records.length
    const present = records.filter((r) => r.present).length
    const absent = total - present

    return {
      summary: {
        total,
        present,
        absent,
        attendanceRate: total
          ? Number(((present / total) * 100).toFixed(2))
          : 0,
      },
      records,
    }
  })

  app.get('/reports/academic', { preHandler: requireAuth }, async (request, reply) => {
    const user = await reportAccess(request, reply)
    if (!user) return

    const query = request.query as {
      session?: string
      term?: string
      classId?: string
      studentId?: string
    }

    const session = text(query.session)
    const term = text(query.term)
    const classId = text(query.classId)
    const studentId = text(query.studentId)

    const conditions = [
      sql`1 = 1`,
      session ? sql`r.session = ${session}` : sql`1 = 1`,
      term ? sql`r.term = ${term}` : sql`1 = 1`,
      classId ? sql`r.class_id = ${classId}::uuid` : sql`1 = 1`,
      studentId ? sql`r.student_id = ${studentId}::uuid` : sql`1 = 1`,
    ]

    const result = await db.execute(sql`
      SELECT
        r.id,
        r.subject,
        r.score,
        r.grade,
        r.term,
        r.session,
        s.id AS student_id,
        s.student_id AS student_code,
        TRIM(CONCAT(
          s.first_name,
          ' ',
          COALESCE(s.other_name || ' ', ''),
          s.last_name
        )) AS student_name,
        c.id AS class_id,
        c.name AS class_name
      FROM results r
      INNER JOIN students s ON s.id = r.student_id
      LEFT JOIN classes c ON c.id = r.class_id
      WHERE ${sql.join(conditions, sql` AND `)}
      ORDER BY student_name ASC, r.subject ASC
    `)

    const records = (result.rows as any[]).map((row) => ({
      id: row.id,
      subject: row.subject,
      score: Number(row.score),
      grade: row.grade || '',
      term: row.term || '',
      session: row.session || '',
      studentId: row.student_id,
      studentCode: row.student_code,
      studentName: row.student_name,
      classId: row.class_id,
      className: row.class_name || 'Unassigned',
    }))

    const scores = records
      .map((r) => r.score)
      .filter((score) => Number.isFinite(score))

    const averageScore = scores.length
      ? Number(
          (
            scores.reduce((sum, score) => sum + score, 0) /
            scores.length
          ).toFixed(2),
        )
      : 0

    const passed = scores.filter((score) => score >= 40).length

    return {
      summary: {
        students: new Set(records.map((r) => r.studentId)).size,
        subjects: new Set(records.map((r) => r.subject)).size,
        results: records.length,
        averageScore,
        passRate: scores.length
          ? Number(((passed / scores.length) * 100).toFixed(2))
          : 0,
      },
      records,
    }
  })

  app.get('/reports/financial', { preHandler: requireAuth }, async (request, reply) => {
    const user = await reportAccess(request, reply)
    if (!user) return

    const query = request.query as {
      from?: string
      to?: string
      status?: string
    }

    const from = validDate(query.from)
    const to = validDate(query.to)
    const requestedStatus = text(query.status).toUpperCase()

    const statuses = [
      'PENDING',
      'COMPLETED',
      'FAILED',
      'REVERSED',
    ]

    const status = statuses.includes(requestedStatus)
      ? requestedStatus
      : ''

    const conditions = [
      sql`1 = 1`,
      from
        ? sql`p.created_at >= ${from}::date`
        : sql`1 = 1`,
      to
        ? sql`p.created_at < (${to}::date + INTERVAL '1 day')`
        : sql`1 = 1`,
      status
        ? sql`p.status = ${status}`
        : sql`1 = 1`,
    ]

    const result = await db.execute(sql`
      SELECT
        p.id,
        p.amount,
        p.method,
        p.status,
        p.reference,
        p.description,
        p.created_at,
        p.updated_at,
        p.user_id
      FROM school_payments p
      WHERE ${sql.join(conditions, sql` AND `)}
      ORDER BY p.created_at DESC
    `)

    const records = (result.rows as any[]).map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      method: row.method,
      status: row.status,
      reference: row.reference,
      description: row.description || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userId: row.user_id,
    }))

    const totalPayments = records.reduce(
      (sum, row) => sum + row.amount,
      0,
    )

    const collected = records
      .filter((row) => row.status === 'COMPLETED')
      .reduce((sum, row) => sum + row.amount, 0)

    const outstanding = records
      .filter((row) => row.status === 'PENDING')
      .reduce((sum, row) => sum + row.amount, 0)

    return {
      summary: {
        transactions: records.length,
        totalPayments: Number(totalPayments.toFixed(2)),
        collected: Number(collected.toFixed(2)),
        outstanding: Number(outstanding.toFixed(2)),
      },
      records,
    }
  })
}
