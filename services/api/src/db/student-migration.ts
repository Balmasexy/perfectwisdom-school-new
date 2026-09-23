import { sql } from 'drizzle-orm'
import { db } from './client.js'

export async function ensureStudentSchema() {
  await db.execute(sql`
    SELECT pg_advisory_xact_lock(824731908);

    CREATE SEQUENCE IF NOT EXISTS pws_student_id_seq
      START WITH 1
      INCREMENT BY 1
      MINVALUE 1;

    WITH current_max AS (
      SELECT COALESCE(
        MAX(
          CASE
            WHEN student_id ~ '^PWS-STU-[0-9]{6}$'
            THEN CAST(SUBSTRING(student_id FROM 9) AS INTEGER)
            ELSE 0
          END
        ), 0
      ) AS max_id
      FROM students
    )
    SELECT setval(
      'pws_student_id_seq',
      CASE
        WHEN (SELECT max_id FROM current_max) = 0
        THEN 1
        ELSE (SELECT max_id FROM current_max)
      END,
      (SELECT max_id FROM current_max) > 0
    );
  `)
}
