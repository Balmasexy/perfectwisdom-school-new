CREATE SEQUENCE IF NOT EXISTS pws_waec_candidate_seq;

CREATE SEQUENCE IF NOT EXISTS pws_neco_candidate_seq;

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
);

CREATE INDEX IF NOT EXISTS exam_registrations_exam_type_index
ON exam_registrations(exam_type);

CREATE INDEX IF NOT EXISTS exam_registrations_branch_index
ON exam_registrations(branch_id);

CREATE INDEX IF NOT EXISTS exam_registrations_phone_index
ON exam_registrations(phone_number);

CREATE INDEX IF NOT EXISTS exam_registrations_exam_year_index
ON exam_registrations(exam_year);

CREATE INDEX IF NOT EXISTS exam_registrations_status_index
ON exam_registrations(status);

CREATE INDEX IF NOT EXISTS exam_registrations_student_index
ON exam_registrations(student_id);
