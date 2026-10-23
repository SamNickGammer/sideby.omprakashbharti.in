CREATE TABLE IF NOT EXISTS sideby_pairings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 child_id uuid NOT NULL UNIQUE REFERENCES sideby_children(id) ON DELETE CASCADE,
 selector text NOT NULL UNIQUE,
 code_hash text NOT NULL,
 status text NOT NULL CHECK(status IN ('offered','pending','approved','cancelled')),
 expires_at timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0,
 window_started_at timestamptz NOT NULL DEFAULT now(),
 generation_count integer NOT NULL DEFAULT 1,
 credential_hash text,
 device_name text,
 verification text
);
CREATE TABLE IF NOT EXISTS sideby_devices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 child_id uuid NOT NULL REFERENCES sideby_children(id) ON DELETE CASCADE,
 pairing_id uuid NOT NULL UNIQUE,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 60),
 platform text NOT NULL DEFAULT 'android' CHECK(platform='android'),
 credential_hash text NOT NULL UNIQUE,
 credential_expires_at timestamptz NOT NULL DEFAULT now()+interval '90 days',
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz,
 revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS sideby_devices_child_idx ON sideby_devices(child_id);
