import type { FastifyInstance } from 'fastify'
import { eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { parents } from '../db/schema.js'
import { requireRoles } from './auth.js'

export async function parentRoutes(app: FastifyInstance) {
  app.get(
    '/parents',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request) => {
      const query = request.query as { search?: string }
      const search = query.search?.trim()

      const rows = await db
        .select({
          id: parents.id,
          firstName: parents.firstName,
          lastName: parents.lastName,
          otherName: parents.otherName,
          phoneNumber: parents.phoneNumber,
          email: parents.email,
          address: parents.address,
        })
        .from(parents)
        .where(
          search
            ? or(
                ilike(parents.firstName, `%${search}%`),
                ilike(parents.lastName, `%${search}%`),
                ilike(parents.otherName, `%${search}%`),
                ilike(parents.phoneNumber, `%${search}%`),
                ilike(parents.email, `%${search}%`),
              )
            : undefined,
        )
        .orderBy(sql`${parents.firstName} ASC, ${parents.lastName} ASC`)
        .limit(search ? 50 : 100)

      return rows
    },
  )

  app.get(
    '/parents/:id',
    { preHandler: requireRoles('ADMIN', 'STAFF') },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const [parent] = await db
        .select({
          id: parents.id,
          firstName: parents.firstName,
          lastName: parents.lastName,
          otherName: parents.otherName,
          phoneNumber: parents.phoneNumber,
          email: parents.email,
          address: parents.address,
        })
        .from(parents)
        .where(eq(parents.id, id))

      if (!parent) {
        return reply.code(404).send({ error: 'Parent record not found' })
      }

      return parent
    },
  )
}
