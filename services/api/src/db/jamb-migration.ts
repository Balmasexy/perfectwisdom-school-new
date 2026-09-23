import { pool } from './client.js'

export async function ensureJambRegistrationSchema(): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('SELECT pg_advisory_lock(824731906)')

    await client.query('BEGIN')

    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS "pws_jamb_candidate_seq"
      START WITH 1
      INCREMENT BY 1
      MINVALUE 1
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "jamb_registrations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "candidate_id" varchar(30) NOT NULL UNIQUE
          DEFAULT (
            'PWS-JMB-' ||
            LPAD(nextval('pws_jamb_candidate_seq')::text, 6, '0')
          ),
        "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL,
        "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "other_name" varchar(100),
        "phone_number" varchar(30) NOT NULL,
        "email" varchar(255),
        "date_of_birth" date,
        "gender" varchar(20),
        "state_of_origin" varchar(100),
        "lga" varchar(100),
        "nin_last4" varchar(4),
        "exam_year" integer NOT NULL,
        "registration_type" varchar(50) NOT NULL DEFAULT 'UTME',
        "preferred_course" varchar(200),
        "first_choice_institution" varchar(200),
        "second_choice_institution" varchar(200),
        "third_choice_institution" varchar(200),
        "status" varchar(30) NOT NULL DEFAULT 'DRAFT',
        "payment_status" varchar(30) NOT NULL DEFAULT 'UNPAID',
        "amount" numeric(12,2) NOT NULL DEFAULT 0,
        "payment_reference" varchar(120),
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "jamb_registrations_branch_index"
      ON "jamb_registrations" ("branch_id")
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "jamb_registrations_phone_index"
      ON "jamb_registrations" ("phone_number")
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "jamb_registrations_exam_year_index"
      ON "jamb_registrations" ("exam_year")
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "jamb_registrations_status_index"
      ON "jamb_registrations" ("status")
    `)

    await client.query(`
      SELECT setval(
        'pws_jamb_candidate_seq',
        COALESCE(max_value, 1),
        max_value IS NOT NULL
      )
      FROM (
        SELECT MAX(
          SUBSTRING(candidate_id FROM 'PWS-JMB-([0-9]+)')::bigint
        ) AS max_value
        FROM jamb_registrations
        WHERE candidate_id LIKE 'PWS-JMB-%'
      ) AS sequence_state
    `)

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.query('SELECT pg_advisory_unlock(824731906)')
    client.release()
  }
}
