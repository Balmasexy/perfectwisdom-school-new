import type { FastifyInstance } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/summary', async () => {
    const result = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM students) AS students,
        (SELECT COUNT(*) FROM staff) AS staff,
        (SELECT COUNT(*) FROM branches) AS branches,
        (SELECT COUNT(*) FROM classes) AS classes,
        (SELECT COUNT(*) FROM assignments) AS assignments,
        (SELECT COUNT(*) FROM messages) AS messages,
        (SELECT COUNT(*) FROM results) AS results,
        (SELECT COUNT(*) FROM bank_accounts) AS bank_accounts,
        (SELECT COUNT(*) FROM bank_transactions) AS transactions
    `)

    const row = result.rows[0] as Record<string, string | number>

    return {
      students: Number(row.students),
      staff: Number(row.staff),
      branches: Number(row.branches),
      classes: Number(row.classes),
      assignments: Number(row.assignments),
      messages: Number(row.messages),
      results: Number(row.results),
      bankAccounts: Number(row.bank_accounts),
      transactions: Number(row.transactions),
    }
  })
}
