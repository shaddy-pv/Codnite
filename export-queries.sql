-- Run these queries in your PostgreSQL 18 (port 5433) and save results as CSV

-- 1. Export colleges (save as colleges.csv)
SELECT * FROM colleges;

-- 2. Export users (save as users.csv)  
SELECT * FROM users;

-- 3. Export posts (save as posts.csv)
SELECT * FROM posts;

-- 4. Export challenges (save as challenges.csv)
SELECT * FROM challenges;

-- 5. Export problems (save as problems.csv)
SELECT * FROM problems;

-- 6. Export any other important tables
SELECT * FROM comments;
SELECT * FROM likes;
SELECT * FROM follows;