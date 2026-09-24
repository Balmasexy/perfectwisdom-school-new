import { sql } from 'drizzle-orm'
import { db } from './client.js'

export async function ensureAdmissionSchema() {
  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS pws_admission_id_seq START 1;

    CREATE TABLE IF NOT EXISTS admissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id VARCHAR(50) NOT NULL UNIQUE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      other_name VARCHAR(100),
      phone_number VARCHAR(30) NOT NULL,
      email VARCHAR(255),
      date_of_birth DATE,
      gender VARCHAR(20),
      state_of_origin VARCHAR(100),
      lga VARCHAR(100),
      address TEXT,

      parent_first_name VARCHAR(100),
      parent_last_name VARCHAR(100),
      parent_phone_number VARCHAR(30),
      parent_email VARCHAR(255),
      parent_relationship VARCHAR(80),

      previous_school VARCHAR(200),
      desired_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
      branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,

      application_date DATE NOT NULL DEFAULT CURRENT_DATE,
      status VARCHAR(30) NOT NULL DEFAULT 'NEW',

      application_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
      payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
      payment_reference VARCHAR(120),

      notes TEXT,

      converted_student_id UUID REFERENCES students(id) ON DELETE SET NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS admissions_status_index
      ON admissions(status);

    CREATE INDEX IF NOT EXISTS admissions_branch_index
      ON admissions(branch_id);

    CREATE INDEX IF NOT EXISTS admissions_application_date_index
      ON admissions(application_date);

    CREATE INDEX IF NOT EXISTS admissions_phone_index
      ON admissions(phone_number);
  `)
}
