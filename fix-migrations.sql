-- Fix migrations table for existing database
-- This script creates the migrations table and marks existing migration as applied

-- Create migrations table with correct field sizes
CREATE TABLE IF NOT EXISTS migrations (
    id VARCHAR(20) PRIMARY KEY,  -- Increased from VARCHAR(10) to VARCHAR(20)
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mark the existing migration as applied without running it
INSERT INTO migrations (id, name, applied_at) 
VALUES ('20241201120000', 'initial_schema', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Verify the migration was recorded
SELECT * FROM migrations;
