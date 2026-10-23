CREATE TABLE IF NOT EXISTS sideby_families (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id text NOT NULL UNIQUE,
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 60), revision integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sideby_children (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), family_id uuid NOT NULL REFERENCES sideby_families(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 40), age integer NOT NULL CHECK(age BETWEEN 1 AND 17),
 color text NOT NULL CHECK(color IN ('mint','peach','lavender','sky')),
 daily_limit integer NOT NULL DEFAULT 120 CHECK(daily_limit BETWEEN 15 AND 720 AND daily_limit % 15 = 0),
 avatar_key text, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sideby_children_family_idx ON sideby_children(family_id);
CREATE TABLE IF NOT EXISTS sideby_routines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), family_id uuid NOT NULL REFERENCES sideby_families(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 50), start_time text NOT NULL, end_time text NOT NULL,
 days text NOT NULL CHECK(days IN ('weekdays','weekends','daily')), enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sideby_routines_family_idx ON sideby_routines(family_id);
