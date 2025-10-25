-- Run this query in your PostgreSQL 18 database (port 5433) to see your schema
-- You can use pgAdmin, DBeaver, or any PostgreSQL client

-- 1. List all tables
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Get detailed column information for key tables
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'colleges', 'posts', 'challenges', 'problems')
ORDER BY table_name, ordinal_position;

-- 3. Count rows in main tables
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'colleges', COUNT(*) FROM colleges
UNION ALL  
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'problems', COUNT(*) FROM problems;