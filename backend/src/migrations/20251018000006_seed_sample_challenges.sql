-- UP: Seed sample challenges data
INSERT INTO challenges (id, title, description, difficulty, points, start_date, end_date, created_at) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'JavaScript Fundamentals Challenge',
  'Solve basic JavaScript problems including arrays, objects, and functions. Perfect for beginners!',
  'easy',
  50,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  CURRENT_TIMESTAMP
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Algorithm Mastery Contest',
  'Advanced algorithmic problems including sorting, searching, and dynamic programming.',
  'hard',
  150,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '14 days',
  CURRENT_TIMESTAMP
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'React Component Challenge',
  'Build interactive React components with hooks and state management.',
  'medium',
  100,
  CURRENT_TIMESTAMP + INTERVAL '2 days',
  CURRENT_TIMESTAMP + INTERVAL '9 days',
  CURRENT_TIMESTAMP
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Database Design Challenge',
  'Design efficient database schemas and write optimized SQL queries.',
  'medium',
  120,
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  CURRENT_TIMESTAMP + INTERVAL '4 days',
  CURRENT_TIMESTAMP
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Python Data Science Challenge',
  'Analyze datasets using pandas, numpy, and matplotlib. Perfect for data enthusiasts!',
  'easy',
  75,
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  CURRENT_TIMESTAMP - INTERVAL '1 day',
  CURRENT_TIMESTAMP
),
(
  '550e8400-e29b-41d4-a716-446655440006',
  'Node.js Backend Challenge',
  'Build RESTful APIs with Express.js, handle authentication, and implement real-time features.',
  'medium',
  125,
  CURRENT_TIMESTAMP + INTERVAL '1 day',
  CURRENT_TIMESTAMP + INTERVAL '8 days',
  CURRENT_TIMESTAMP
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  'CSS Grid & Flexbox Mastery',
  'Master modern CSS layout techniques with Grid and Flexbox. Create responsive designs.',
  'easy',
  60,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '5 days',
  CURRENT_TIMESTAMP
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  'Machine Learning Basics',
  'Implement basic machine learning algorithms using Python and scikit-learn.',
  'hard',
  200,
  CURRENT_TIMESTAMP + INTERVAL '3 days',
  CURRENT_TIMESTAMP + INTERVAL '10 days',
  CURRENT_TIMESTAMP
);

-- DOWN: Remove seeded challenges
DELETE FROM challenges WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440008'
);
