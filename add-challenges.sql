-- Create sample challenges
INSERT INTO challenges (title, description, difficulty, points, start_date, end_date, created_at) VALUES
('JavaScript Fundamentals Challenge', 'Solve basic JavaScript problems including arrays, objects, and functions. Perfect for beginners!', 'easy', 50, NOW(), NOW() + INTERVAL '7 days', NOW()),
('Algorithm Mastery Contest', 'Advanced algorithmic problems including sorting, searching, and dynamic programming.', 'hard', 150, NOW(), NOW() + INTERVAL '14 days', NOW()),
('React Component Challenge', 'Build interactive React components with hooks and state management.', 'medium', 100, NOW() + INTERVAL '2 days', NOW() + INTERVAL '9 days', NOW()),
('Database Design Challenge', 'Design efficient database schemas and write optimized SQL queries.', 'medium', 120, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', NOW()),
('Python Data Science Challenge', 'Analyze datasets using pandas, numpy, and matplotlib. Perfect for data enthusiasts!', 'easy', 75, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', NOW());
