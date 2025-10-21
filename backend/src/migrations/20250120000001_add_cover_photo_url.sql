-- UP
-- Add cover_photo_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_photo_url VARCHAR(500) DEFAULT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_cover_photo_url ON users(cover_photo_url);

-- DOWN
-- Remove cover_photo_url column and index
DROP INDEX IF EXISTS idx_users_cover_photo_url;
ALTER TABLE users DROP COLUMN IF EXISTS cover_photo_url;
