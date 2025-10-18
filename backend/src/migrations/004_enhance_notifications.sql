-- UP
-- Add notification preferences and enhance notifications table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email": true,
  "push": true,
  "inApp": true,
  "types": {
    "follow": true,
    "like": true,
    "comment": true,
    "challenge": true,
    "problem": true,
    "achievement": true,
    "system": true
  }
}'::jsonb;

-- Enhance notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- DOWN
-- Remove notification preferences and enhanced columns
ALTER TABLE users DROP COLUMN IF EXISTS notification_preferences;
ALTER TABLE notifications DROP COLUMN IF EXISTS priority;
ALTER TABLE notifications DROP COLUMN IF EXISTS expires_at;
ALTER TABLE notifications DROP COLUMN IF EXISTS read_at;

-- Remove indexes
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_expires_at;
