-- Perfect Wisdom School
-- JAMB Registration Centre module
-- Internal registration workflow; this does NOT claim to be an official JAMB API.

CREATE SEQUENCE IF NOT EXISTS pws_jamb_candidate_seq;

CREATE TABLE IF NOT EXISTS jamb_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  candidate_id varchar(30) NOT NULL UNIQUE
    DEFAULT (
      'PWS-JMB-' ||
      lpad(nextval('pws_jamb_candidate_seq')::text, 6, '0')
    ),

  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,

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
  registration_type varchar(50) NOT NULL DEFAULT 'UTME',

  preferred_course varchar(200),
  first_choice_institution varchar(200),
  second_choice_institution varchar(200),
  third_choice_institution varchar(200),

  status varchar(30) NOT NULL DEFAULT 'DRAFT',
  payment_status varchar(30) NOT NULL DEFAULT 'UNPAID',

  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_reference varchar(120),

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jamb_registrations_branch_index
  ON jamb_registrations(branch_id);

CREATE INDEX IF NOT EXISTS jamb_registrations_phone_index
  ON jamb_registrations(phone_number);

CREATE INDEX IF NOT EXISTS jamb_registrations_exam_year_index
  ON jamb_registrations(exam_year);

CREATE INDEX IF NOT EXISTS jamb_registrations_status_index
  ON jamb_registrations(status);
