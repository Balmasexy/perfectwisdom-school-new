import { sql } from 'drizzle-orm'
import { db } from './client.js'

type AccountRole = 'ADMIN' | 'STAFF' | 'PARENT'

const sequenceByRole: Record<AccountRole, string> = {
  ADMIN: 'pws_admin_account_id_seq',
  STAFF: 'pws_staff_account_id_seq',
  PARENT: 'pws_parent_account_id_seq',
}

const prefixByRole: Record<AccountRole, string> = {
  ADMIN: 'PWS-ADM',
  STAFF: 'PWS-STF',
  PARENT: 'PWS-PAR',
}

export async function generateAccountId(role: AccountRole): Promise<string> {
  const sequence = sequenceByRole[role]

  const result = await db.execute(
    sql.raw(`SELECT nextval('${sequence}') AS value`),
  )

  const rows = (result as unknown as { rows: Array<{ value: string | number }> }).rows
  const value = Number(rows[0]?.value)

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Unable to generate ${role} account ID`)
  }

  return `${prefixByRole[role]}-${String(value).padStart(6, '0')}`
}
