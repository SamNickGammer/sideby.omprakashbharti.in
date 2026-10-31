ALTER TABLE sideby_devices ADD COLUMN IF NOT EXISTS permission_report jsonb;
ALTER TABLE sideby_devices ADD COLUMN IF NOT EXISTS permissions_updated_at timestamptz;
