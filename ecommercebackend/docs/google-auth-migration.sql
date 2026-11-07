-- Apply before deploying if Hibernate schema updates are disabled.
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_google_subject ON users (google_subject);
