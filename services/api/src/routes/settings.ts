import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { requireRoles } from './auth.js'

const adminOnly = { preHandler: requireRoles('ADMIN') }

function clean(value: unknown) {
  if (typeof value !== 'string') return null
  const result = value.trim()
  return result || null
}

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/settings/school', adminOnly, async () => {
    const result = await db.execute(sql`
      SELECT
        id,
        school_name AS "schoolName",
        motto,
        registration_number AS "registrationNumber",
        address,
        phone_number AS "phoneNumber",
        email,
        website,
        logo_data AS "logoData",
        updated_at AS "updatedAt"
      FROM school_information
      ORDER BY created_at ASC
      LIMIT 1
    `)

    return result.rows[0] || null
  })

  app.put('/settings/school', adminOnly, async (request, reply) => {
    const body = request.body as Record<string, unknown>
    const schoolName = clean(body.schoolName)

    if (!schoolName) {
      return reply.code(400).send({ error: 'School name is required.' })
    }

    const existing = await db.execute(sql`
      SELECT id
      FROM school_information
      ORDER BY created_at ASC
      LIMIT 1
    `)

    let result

    if (existing.rows[0]) {
      result = await db.execute(sql`
        UPDATE school_information
        SET
          school_name = ${schoolName},
          motto = ${clean(body.motto)},
          registration_number = ${clean(body.registrationNumber)},
          address = ${clean(body.address)},
          phone_number = ${clean(body.phoneNumber)},
          email = ${clean(body.email)},
          website = ${clean(body.website)},
          logo_data = ${clean(body.logoData)},
          updated_at = NOW()
        WHERE id = ${existing.rows[0].id}
        RETURNING
          id,
          school_name AS "schoolName",
          motto,
          registration_number AS "registrationNumber",
          address,
          phone_number AS "phoneNumber",
          email,
          website,
          logo_data AS "logoData",
          updated_at AS "updatedAt"
      `)
    } else {
      result = await db.execute(sql`
        INSERT INTO school_information (
          school_name,
          motto,
          registration_number,
          address,
          phone_number,
          email,
          website,
          logo_data
        )
        VALUES (
          ${schoolName},
          ${clean(body.motto)},
          ${clean(body.registrationNumber)},
          ${clean(body.address)},
          ${clean(body.phoneNumber)},
          ${clean(body.email)},
          ${clean(body.website)},
          ${clean(body.logoData)}
        )
        RETURNING
          id,
          school_name AS "schoolName",
          motto,
          registration_number AS "registrationNumber",
          address,
          phone_number AS "phoneNumber",
          email,
          website,
          logo_data AS "logoData",
          updated_at AS "updatedAt"
      `)
    }

    return result.rows[0]
  })

  app.get('/settings/sessions', adminOnly, async () => {
    const result = await db.execute(sql`
      SELECT
        id,
        name,
        start_date AS "startDate",
        end_date AS "endDate",
        active,
        active_term AS "activeTerm",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM academic_sessions
      ORDER BY start_date DESC NULLS LAST, name DESC
    `)

    return result.rows
  })

  app.post('/settings/sessions', adminOnly, async (request, reply) => {
    const body = request.body as Record<string, unknown>
    const name = clean(body.name)

    if (!name) {
      return reply.code(400).send({
        error: 'Academic session is required.',
      })
    }

    if (body.active) {
      await db.execute(sql`
        UPDATE academic_sessions
        SET active = FALSE, updated_at = NOW()
      `)
    }

    const result = await db.execute(sql`
      INSERT INTO academic_sessions (
        name,
        start_date,
        end_date,
        active,
        active_term
      )
      VALUES (
        ${name},
        ${clean(body.startDate)},
        ${clean(body.endDate)},
        ${Boolean(body.active)},
        ${clean(body.activeTerm) || 'First Term'}
      )
      RETURNING
        id,
        name,
        start_date AS "startDate",
        end_date AS "endDate",
        active,
        active_term AS "activeTerm"
    `)

    return reply.code(201).send(result.rows[0])
  })

  app.patch('/settings/sessions/:id', adminOnly, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>

    const current = await db.execute(sql`
      SELECT id
      FROM academic_sessions
      WHERE id = ${id}
    `)

    if (!current.rows[0]) {
      return reply.code(404).send({
        error: 'Academic session not found.',
      })
    }

    if (body.active) {
      await db.execute(sql`
        UPDATE academic_sessions
        SET active = FALSE, updated_at = NOW()
      `)
    }

    const result = await db.execute(sql`
      UPDATE academic_sessions
      SET
        name = COALESCE(${clean(body.name)}, name),
        start_date = COALESCE(${clean(body.startDate)}, start_date),
        end_date = COALESCE(${clean(body.endDate)}, end_date),
        active = COALESCE(
          ${body.active === undefined ? null : Boolean(body.active)},
          active
        ),
        active_term = COALESCE(${clean(body.activeTerm)}, active_term),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id,
        name,
        start_date AS "startDate",
        end_date AS "endDate",
        active,
        active_term AS "activeTerm"
    `)

    return result.rows[0]
  })

  app.get('/settings/preferences', adminOnly, async () => {
    const result = await db.execute(sql`
      SELECT
        id,
        currency,
        date_format AS "dateFormat",
        timezone,
        pass_mark AS "passMark",
        default_student_status AS "defaultStudentStatus",
        email_notifications AS "emailNotifications",
        sms_notifications AS "smsNotifications",
        push_notifications AS "pushNotifications",
        updated_at AS "updatedAt"
      FROM system_preferences
      LIMIT 1
    `)

    return result.rows[0] || null
  })

  app.put('/settings/preferences', adminOnly, async (request, reply) => {
    const body = request.body as Record<string, unknown>
    const passMark = Number(body.passMark)

    if (!Number.isFinite(passMark) || passMark < 0 || passMark > 100) {
      return reply.code(400).send({
        error: 'Pass mark must be between 0 and 100.',
      })
    }

    const current = await db.execute(sql`
      SELECT id
      FROM system_preferences
      LIMIT 1
    `)

    if (!current.rows[0]) {
      const created = await db.execute(sql`
        INSERT INTO system_preferences (
          currency,
          date_format,
          timezone,
          pass_mark,
          default_student_status,
          email_notifications,
          sms_notifications,
          push_notifications
        )
        VALUES (
          ${clean(body.currency) || 'NGN'},
          ${clean(body.dateFormat) || 'DD/MM/YYYY'},
          ${clean(body.timezone) || 'Africa/Lagos'},
          ${passMark},
          ${clean(body.defaultStudentStatus) || 'ACTIVE'},
          ${body.emailNotifications === undefined ? true : Boolean(body.emailNotifications)},
          ${body.smsNotifications === undefined ? false : Boolean(body.smsNotifications)},
          ${body.pushNotifications === undefined ? true : Boolean(body.pushNotifications)}
        )
        RETURNING
          id,
          currency,
          date_format AS "dateFormat",
          timezone,
          pass_mark AS "passMark",
          default_student_status AS "defaultStudentStatus",
          email_notifications AS "emailNotifications",
          sms_notifications AS "smsNotifications",
          push_notifications AS "pushNotifications",
          updated_at AS "updatedAt"
      `)

      return created.rows[0]
    }

    const result = await db.execute(sql`
      UPDATE system_preferences
      SET
        currency = COALESCE(${clean(body.currency)}, currency),
        date_format = COALESCE(${clean(body.dateFormat)}, date_format),
        timezone = COALESCE(${clean(body.timezone)}, timezone),
        pass_mark = ${passMark},
        default_student_status =
          COALESCE(${clean(body.defaultStudentStatus)}, default_student_status),
        email_notifications =
          COALESCE(
            ${body.emailNotifications === undefined ? null : Boolean(body.emailNotifications)},
            email_notifications
          ),
        sms_notifications =
          COALESCE(
            ${body.smsNotifications === undefined ? null : Boolean(body.smsNotifications)},
            sms_notifications
          ),
        push_notifications =
          COALESCE(
            ${body.pushNotifications === undefined ? null : Boolean(body.pushNotifications)},
            push_notifications
          ),
        updated_at = NOW()
      WHERE id = ${current.rows[0].id}
      RETURNING
        id,
        currency,
        date_format AS "dateFormat",
        timezone,
        pass_mark AS "passMark",
        default_student_status AS "defaultStudentStatus",
        email_notifications AS "emailNotifications",
        sms_notifications AS "smsNotifications",
        push_notifications AS "pushNotifications",
        updated_at AS "updatedAt"
    `)

    return result.rows[0]
  })

  app.patch('/students/:id/passport', { preHandler: requireRoles('ADMIN', 'STAFF') }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as { passportPhoto?: string | null }

    if (
      body.passportPhoto &&
      !body.passportPhoto.startsWith('data:image/')
    ) {
      return reply.code(400).send({
        error: 'Passport must be a valid image.',
      })
    }

    if (body.passportPhoto && body.passportPhoto.length > 1500000) {
      return reply.code(400).send({
        error: 'Passport image is too large. Please use a smaller image.',
      })
    }

    const result = await db.execute(sql`
      UPDATE students
      SET
        passport_photo = ${body.passportPhoto || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id,
        passport_photo AS "passportPhoto"
    `)

    if (!result.rows[0]) {
      return reply.code(404).send({
        error: 'Student record not found.',
      })
    }

    return result.rows[0]
  })
}
