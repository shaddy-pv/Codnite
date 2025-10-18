import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createSampleChallenges() {
  try {
    console.log('Creating sample challenges...');

    // Sample challenges data
    const challenges = [
      {
        title: 'JavaScript Fundamentals Challenge',
        description: 'Solve basic JavaScript problems including arrays, objects, and functions. Perfect for beginners!',
        difficulty: 'easy',
        points: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Algorithm Mastery Contest',
        description: 'Advanced algorithmic problems including sorting, searching, and dynamic programming.',
        difficulty: 'hard',
        points: 150,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      },
      {
        title: 'React Component Challenge',
        description: 'Build interactive React components with hooks and state management.',
        difficulty: 'medium',
        points: 100,
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000) // 9 days from now
      },
      {
        title: 'Database Design Challenge',
        description: 'Design efficient database schemas and write optimized SQL queries.',
        difficulty: 'medium',
        points: 120,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
      },
      {
        title: 'Python Data Science Challenge',
        description: 'Analyze datasets using pandas, numpy, and matplotlib. Perfect for data enthusiasts!',
        difficulty: 'easy',
        points: 75,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago (past challenge)
      }
    ];

    for (const challenge of challenges) {
      const query = `
        INSERT INTO challenges (title, description, difficulty, points, start_date, end_date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id, title
      `;

      const result = await pool.query(query, [
        challenge.title,
        challenge.description,
        challenge.difficulty,
        challenge.points,
        challenge.startDate,
        challenge.endDate
      ]);

      console.log(`Created challenge: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
    }

    console.log('✅ Sample challenges created successfully!');
  } catch (error) {
    console.error('❌ Error creating challenges:', error);
  } finally {
    await pool.end();
  }
}

createSampleChallenges();
