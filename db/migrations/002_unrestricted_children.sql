-- Preserve legacy preferences without applying them. New profiles are unrestricted.
ALTER TABLE sideby_children ALTER COLUMN daily_limit DROP NOT NULL;
ALTER TABLE sideby_children ALTER COLUMN daily_limit SET DEFAULT NULL;
