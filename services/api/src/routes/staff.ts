import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { staff } from '../db/schema.js'
import { requireRoles } from './auth.js'

export async function staffRoutes(app: FastifyInstance) {
  app.delete('/staff/:id', { preHandler: requireRoles('ADMIN') }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const deleted = await db
      .delete(staff)
      .where(eq(staff.id, id))
      .returning()

    if (!deleted.length) {
      return reply.code(404).send({ error: 'Staff record not found' })
    }

    return { success: true, deleted: deleted[0] }
  })

  app.get('/staff', { preHandler: requireRoles('ADMIN') }, async () => {
    return db.select().from(staff)
  })

  app.post('/staff', { preHandler: requireRoles('ADMIN') }, async (request, reply) => {
    const body = request.body as {
      firstName?: string
      lastName?: string
      otherName?: string
      phoneNumber?: string
      email?: string
      dateOfBirth?: string
      gender?: 'MALE' | 'FEMALE' | 'OTHER'
      address?: string
      department?: string
      position?: string
      employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
      dateEmployed?: string
      branchId?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
      bankName?: string
      bankAccountNumber?: string
    }

    if (!body.firstName || !body.lastName || !body.phoneNumber) {
      return reply.code(400).send({
        error: 'First name, last name and phone number are required',
      })
    }

    const staffId = `PWS-STF-${Date.now().toString().slice(-8)}`

    const [created] = await db
      .insert(staff)
      .values({
        staffId,
        firstName: body.firstName,
        lastName: body.lastName,
        otherName: body.otherName || null,
        phoneNumber: body.phoneNumber,
        email: body.email || null,
        dateOfBirth: body.dateOfBirth || null,
        gender: body.gender || null,
        address: body.address || null,
        department: body.department || null,
        position: body.position || null,
        employmentType: body.employmentType || null,
        dateEmployed: body.dateEmployed || null,
        branchId: body.branchId || null,
        emergencyContactName: body.emergencyContactName || null,
        emergencyContactPhone: body.emergencyContactPhone || null,
        bankName: body.bankName || null,
        bankAccountNumber: body.bankAccountNumber || null,
      })
      .returning()

    return reply.code(201).send(created)
  })

  app.get('/staff/:id', { preHandler: requireRoles('ADMIN') }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const [record] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, id))

    if (!record) {
      return reply.code(404).send({
        error: 'Staff record not found',
      })
    }

    return record
  })
}
