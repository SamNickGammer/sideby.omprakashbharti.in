CREATE TABLE IF NOT EXISTS sideby_live_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 device_id uuid NOT NULL REFERENCES sideby_devices(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('screen','camera','audio')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','active','ended','declined','expired')),
 desired_lens text NOT NULL DEFAULT 'front' CHECK(desired_lens IN ('front','back')),
 actual_lens text CHECK(actual_lens IN ('front','back')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '60 seconds',
 parent_seen timestamptz NOT NULL DEFAULT now(),
 device_seen timestamptz NOT NULL DEFAULT now(),
 ended_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS sideby_live_device_open ON sideby_live_sessions(device_id) WHERE status IN ('pending','approved','active');
CREATE INDEX IF NOT EXISTS sideby_live_created ON sideby_live_sessions(created_at);
CREATE TABLE IF NOT EXISTS sideby_live_supervisor (id boolean PRIMARY KEY DEFAULT true CHECK(id), seen_at timestamptz NOT NULL DEFAULT now());
