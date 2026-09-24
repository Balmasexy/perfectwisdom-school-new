import { sql } from 'drizzle-orm'
import { db } from './client.js'

export async function ensureStudentClassSchema() {
  await db.execute(sql`
    ALTER TABLE students
    ADD COLUMN IF NOT EXISTS class_id UUID
    REFERENCES classes(id)
    ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS students_class_index
    ON students(class_id);
  `)
}
