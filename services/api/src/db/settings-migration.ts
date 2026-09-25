import { db } from './client.js'

export async function ensureSettingsSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS school_information (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_name VARCHAR(200) NOT NULL DEFAULT 'Perfect Wisdom School',
      motto VARCHAR(300),
      registration_number VARCHAR(100),
      address TEXT,
      phone_number VARCHAR(30),
      email VARCHAR(255),
      website VARCHAR(255),
      logo_data TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS academic_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL UNIQUE,
      start_date DATE,
      end_date DATE,
      active BOOLEAN NOT NULL DEFAULT FALSE,
      active_term VARCHAR(50),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS system_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
      date_format VARCHAR(50) NOT NULL DEFAULT 'DD/MM/YYYY',
      timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Lagos',
      pass_mark INTEGER NOT NULL DEFAULT 40,
      default_student_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
      push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    ALTER TABLE students
    ADD COLUMN IF NOT EXISTS passport_photo TEXT
  `)

  await db.execute(`
    INSERT INTO school_information (school_name)
    SELECT 'Perfect Wisdom School'
    WHERE NOT EXISTS (SELECT 1 FROM school_information)
  `)

  await db.execute(`
    INSERT INTO system_preferences (currency, date_format, timezone, pass_mark)
    SELECT 'NGN', 'DD/MM/YYYY', 'Africa/Lagos', 40
    WHERE NOT EXISTS (SELECT 1 FROM system_preferences)
  `)

  await db.execute(`
    INSERT INTO academic_sessions (name, active, active_term)
    SELECT
      EXTRACT(YEAR FROM CURRENT_DATE)::text || '/' ||
      (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::text,
      TRUE,
      'First Term'
    WHERE NOT EXISTS (
      SELECT 1 FROM academic_sessions WHERE active = TRUE
    )
  `)
}
