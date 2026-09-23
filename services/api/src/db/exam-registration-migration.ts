import { sql } from 'drizzle-orm'
import { db } from './client.js'

const ADVISORY_LOCK = 824731907

export async function ensureExamRegistrationSchema() {
  await db.execute(sql`
    SELECT pg_advisory_lock(${ADVISORY_LOCK})
  `)

  try {
    await db.execute(sql`
      CREATE SEQUENCE IF NOT EXISTS pws_waec_candidate_seq
    `)

    await db.execute(sql`
      CREATE SEQUENCE IF NOT EXISTS pws_neco_candidate_seq
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS exam_registrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        candidate_id varchar(30) NOT NULL UNIQUE,

        exam_type varchar(20) NOT NULL,

        branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,

        student_id uuid REFERENCES students(id) ON DELETE SET NULL,

        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        other_name varchar(100),

        phone_number varchar(30) NOT NULL,
        email varchar(255),

        date_of_birth date,
        gender varchar(20),
        state_of_origin varchar(100),
        lga varchar(100),

        nin_last4 varchar(4),

        exam_year integer NOT NULL,

        registration_type varchar(50) NOT NULL DEFAULT 'SCHOOL_CANDIDATE',

        examination_centre varchar(200),

        subjects text,

        amount numeric(12,2) NOT NULL DEFAULT 0,

        payment_reference varchar(120),

        status varchar(30) NOT NULL DEFAULT 'DRAFT',

        payment_status varchar(30) NOT NULL DEFAULT 'UNPAID',

        notes text,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS exam_registrations_exam_type_index
      ON exam_registrations(exam_type)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS exam_registrations_branch_index
      ON exam_registrations(branch_id)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS exam_registrations_phone_index
      ON exam_registrations(phone_number)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS exam_registrations_exam_year_index
      ON exam_registrations(exam_year)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS exam_registrations_status_index
      ON exam_registrations(status)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS exam_registrations_student_index
      ON exam_registrations(student_id)
    `)

    await db.execute(sql`
      SELECT setval(
        'pws_waec_candidate_seq',
        GREATEST(
          COALESCE(
            (
              SELECT MAX(
                CASE
                  WHEN candidate_id ~ '^PWS-WAC-[0-9]{6}$'
                  THEN substring(candidate_id from 9)::bigint
                  ELSE 0
                END
              )
              FROM exam_registrations
            ),
            0
          ),
          1
        ),
        true
      )
    `)

    await db.execute(sql`
      SELECT setval(
        'pws_neco_candidate_seq',
        GREATEST(
          COALESCE(
            (
              SELECT MAX(
                CASE
                  WHEN candidate_id ~ '^PWS-NEC-[0-9]{6}$'
                  THEN substring(candidate_id from 9)::bigint
                  ELSE 0
                END
              )
              FROM exam_registrations
            ),
            0
          ),
          1
        ),
        true
      )
    `)

    console.log('Exam registration schema ready.')
  } finally {
    await db.execute(sql`
      SELECT pg_advisory_unlock(${ADVISORY_LOCK})
    `)
  }
}
