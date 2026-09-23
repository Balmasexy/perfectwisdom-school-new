import { pool } from './client.js'

export async function ensureAccountIdSchema(): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('SELECT pg_advisory_lock(824731905)')

    await client.query('BEGIN')

    await client.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "account_id" varchar(30)
    `)

    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS "pws_admin_account_id_seq"
      START WITH 1
      INCREMENT BY 1
      MINVALUE 1
    `)

    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS "pws_staff_account_id_seq"
      START WITH 1
      INCREMENT BY 1
      MINVALUE 1
    `)

    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS "pws_parent_account_id_seq"
      START WITH 1
      INCREMENT BY 1
      MINVALUE 1
    `)

    await client.query(`
      WITH missing AS (
        SELECT
          id,
          role,
          ROW_NUMBER() OVER (
            PARTITION BY role
            ORDER BY created_at, id
          ) AS rn
        FROM users
        WHERE account_id IS NULL
          AND role IN ('ADMIN', 'STAFF', 'PARENT')
      ),
      offsets AS (
        SELECT
          COALESCE(MAX(CASE
            WHEN account_id LIKE 'PWS-ADM-%'
            THEN SUBSTRING(account_id FROM 'PWS-ADM-([0-9]+)')::bigint
          END), 0) AS admin_max,

          COALESCE(MAX(CASE
            WHEN account_id LIKE 'PWS-STF-%'
            THEN SUBSTRING(account_id FROM 'PWS-STF-([0-9]+)')::bigint
          END), 0) AS staff_max,

          COALESCE(MAX(CASE
            WHEN account_id LIKE 'PWS-PAR-%'
            THEN SUBSTRING(account_id FROM 'PWS-PAR-([0-9]+)')::bigint
          END), 0) AS parent_max
        FROM users
      )
      UPDATE users u
      SET account_id =
        CASE missing.role
          WHEN 'ADMIN' THEN
            'PWS-ADM-' || LPAD((offsets.admin_max + missing.rn)::text, 6, '0')
          WHEN 'STAFF' THEN
            'PWS-STF-' || LPAD((offsets.staff_max + missing.rn)::text, 6, '0')
          WHEN 'PARENT' THEN
            'PWS-PAR-' || LPAD((offsets.parent_max + missing.rn)::text, 6, '0')
        END
      FROM missing
      CROSS JOIN offsets
      WHERE u.id = missing.id
        AND u.account_id IS NULL
    `)

    await client.query(`
      SELECT setval(
        'pws_admin_account_id_seq',
        COALESCE(max_value, 1),
        max_value IS NOT NULL
      )
      FROM (
        SELECT MAX(
          SUBSTRING(account_id FROM 'PWS-ADM-([0-9]+)')::bigint
        ) AS max_value
        FROM users
        WHERE account_id LIKE 'PWS-ADM-%'
      ) AS sequence_state
    `)

    await client.query(`
      SELECT setval(
        'pws_staff_account_id_seq',
        COALESCE(max_value, 1),
        max_value IS NOT NULL
      )
      FROM (
        SELECT MAX(
          SUBSTRING(account_id FROM 'PWS-STF-([0-9]+)')::bigint
        ) AS max_value
        FROM users
        WHERE account_id LIKE 'PWS-STF-%'
      ) AS sequence_state
    `)

    await client.query(`
      SELECT setval(
        'pws_parent_account_id_seq',
        COALESCE(max_value, 1),
        max_value IS NOT NULL
      )
      FROM (
        SELECT MAX(
          SUBSTRING(account_id FROM 'PWS-PAR-([0-9]+)')::bigint
        ) AS max_value
        FROM users
        WHERE account_id LIKE 'PWS-PAR-%'
      ) AS sequence_state
    `)

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_account_id_unique"
      ON "users" ("account_id")
    `)

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.query('SELECT pg_advisory_unlock(824731905)')
    client.release()
  }
}
