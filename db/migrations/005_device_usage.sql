ALTER TABLE sideby_devices ADD COLUMN IF NOT EXISTS usage_report jsonb;
ALTER TABLE sideby_devices ADD COLUMN IF NOT EXISTS usage_updated_at timestamptz;
ALTER TABLE sideby_devices ADD COLUMN IF NOT EXISTS usage_sample_at timestamptz;
