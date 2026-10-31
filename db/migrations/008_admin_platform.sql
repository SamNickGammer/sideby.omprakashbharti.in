CREATE TABLE IF NOT EXISTS sideby_admin_sessions (
 token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sideby_admin_limits (
 key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS sideby_policy_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL CHECK(slug IN ('privacy','terms','support')),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 160), body text NOT NULL CHECK(length(body) BETWEEN 100 AND 60000),
 summary text NOT NULL CHECK(length(summary) BETWEEN 3 AND 1000), effective_date date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE TABLE IF NOT EXISTS sideby_policy_current (
 slug text PRIMARY KEY CHECK(slug IN ('privacy','terms','support')), version_id uuid NOT NULL REFERENCES sideby_policy_versions(id)
);
CREATE TABLE IF NOT EXISTS sideby_bug_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL DEFAULT '' CHECK(length(name)<=100),
 email text NOT NULL CHECK(length(email)<=254), category text NOT NULL CHECK(category IN ('bug','privacy','account','feedback')),
 subject text NOT NULL CHECK(length(subject) BETWEEN 3 AND 160), description text NOT NULL CHECK(length(description) BETWEEN 20 AND 5000),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','investigating','resolved')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sideby_bug_reports_created_idx ON sideby_bug_reports(created_at DESC);
CREATE TABLE IF NOT EXISTS sideby_admin_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, action text NOT NULL, resource_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION sideby_policy_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Policy versions cannot be deleted'; END IF;
 IF (NEW.id,NEW.slug,NEW.title,NEW.body,NEW.summary,NEW.effective_date,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.slug,OLD.title,OLD.body,OLD.summary,OLD.effective_date,OLD.created_at)
 OR OLD.published_at IS NOT NULL OR NEW.published_at IS NULL THEN RAISE EXCEPTION 'Policy versions are immutable'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sideby_policy_immutable_trigger ON sideby_policy_versions;
CREATE TRIGGER sideby_policy_immutable_trigger BEFORE UPDATE OR DELETE ON sideby_policy_versions FOR EACH ROW EXECUTE FUNCTION sideby_policy_immutable();
