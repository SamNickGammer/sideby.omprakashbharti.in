ALTER TABLE sideby_devices ADD COLUMN IF NOT EXISTS content_reports jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE sideby_devices ADD COLUMN IF NOT EXISTS content_samples jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE TABLE IF NOT EXISTS sideby_content_gc (object_key text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), pending_upload boolean NOT NULL DEFAULT false);
