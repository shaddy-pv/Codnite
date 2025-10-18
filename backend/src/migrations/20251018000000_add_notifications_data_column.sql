-- UP
-- Add missing data column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;

-- DOWN
-- Remove data column from notifications table
ALTER TABLE notifications DROP COLUMN IF EXISTS data;
