CREATE TABLE IF NOT EXISTS google_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_sub varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS google_identities_sub_unique
  ON google_identities (google_sub);

CREATE UNIQUE INDEX IF NOT EXISTS google_identities_user_unique
  ON google_identities (user_id);

CREATE TABLE IF NOT EXISTS passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id text NOT NULL,
  public_key text NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  transports text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS passkeys_credential_id_unique
  ON passkeys (credential_id);

CREATE INDEX IF NOT EXISTS passkeys_user_id_index
  ON passkeys (user_id);

CREATE TABLE IF NOT EXISTS auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  challenge_type varchar(30) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_challenges_challenge_index
  ON auth_challenges (challenge);

CREATE INDEX IF NOT EXISTS auth_challenges_expires_index
  ON auth_challenges (expires_at);
