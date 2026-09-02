import pg from "pg";

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    })
  : null;

export async function migrate() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS records (
      resource_key TEXT NOT NULL,
      record_id    TEXT NOT NULL,
      data         JSONB NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (resource_key, record_id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE EXTENSION IF NOT EXISTS citext;

    CREATE TABLE IF NOT EXISTS users (
      user_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name      text        NOT NULL,
      email          citext      NOT NULL UNIQUE,
      password_hash  text        NOT NULL,
      role           text        NOT NULL DEFAULT 'viewer'
                       CHECK (role IN ('admin','procurement_manager','site_engineer',
                                       'quality_inspector','sustainability_officer','viewer')),
      department     text,
      status         text        NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','disabled','pending')),
      verify_token         text,
      verify_token_expires timestamptz,
      last_login_at  timestamptz,
      created_at     timestamptz NOT NULL DEFAULT now(),
      updated_at     timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS users_email_idx  ON users (email);
    CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

    ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);
  `);
}
