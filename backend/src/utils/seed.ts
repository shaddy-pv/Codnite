import { query } from './database.js';
import logger from './logger.js';

// Sample problems data
const sampleProblems = [
  {
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: 'Easy',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    tags: ['Array', 'Hash Table'],
    companies: ['Amazon', 'Google', 'Facebook', 'Microsoft'],
    testCases: [
      { input: '[2,7,11,15]', expectedOutput: '[0,1]' },
      { input: '[3,2,4]', expectedOutput: '[1,2]' },
      { input: '[3,3]', expectedOutput: '[0,1]' }
    ]
  },
  {
    title: 'Add Two Numbers',
    description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    difficulty: 'Medium',
    examples: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807'
      },
      {
        input: 'l1 = [0], l2 = [0]',
        output: '[0]',
        explanation: '0 + 0 = 0'
      },
      {
        input: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]',
        output: '[8,9,9,9,0,0,0,1]',
        explanation: '9999999 + 9999 = 10009998'
      }
    ],
    constraints: [
      'The number of nodes in each linked list is in the range [1, 100].',
      '0 <= Node.val <= 9',
      'It is guaranteed that the list represents a number that does not have leading zeros.'
    ],
    tags: ['Linked List', 'Math', 'Recursion'],
    companies: ['Amazon', 'Microsoft', 'Bloomberg'],
    testCases: [
      { input: '[2,4,3], [5,6,4]', expectedOutput: '[7,0,8]' },
      { input: '[0], [0]', expectedOutput: '[0]' },
      { input: '[9,9,9,9,9,9,9], [9,9,9,9]', expectedOutput: '[8,9,9,9,0,0,0,1]' }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    difficulty: 'Medium',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.'
      }
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    tags: ['Hash Table', 'String', 'Sliding Window'],
    companies: ['Amazon', 'Google', 'Facebook'],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3' },
      { input: '"bbbbb"', expectedOutput: '1' },
      { input: '"pwwkew"', expectedOutput: '3' }
    ]
  },
  {
    title: 'Median of Two Sorted Arrays',
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    difficulty: 'Hard',
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.00000',
        explanation: 'merged array = [1,2,3] and median is 2.'
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.50000',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.'
      }
    ],
    constraints: [
      'nums1.length == m',
      'nums2.length == n',
      '0 <= m <= 1000',
      '0 <= n <= 1000',
      '1 <= m + n <= 2000',
      '-10^6 <= nums1[i], nums2[i] <= 10^6'
    ],
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    companies: ['Amazon', 'Google', 'Microsoft'],
    testCases: [
      { input: '[1,3], [2]', expectedOutput: '2.00000' },
      { input: '[1,2], [3,4]', expectedOutput: '2.50000' }
    ]
  },
  {
    title: 'Reverse Integer',
    description: `Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.

Assume the environment does not allow you to store 64-bit integers (signed or unsigned).`,
    difficulty: 'Easy',
    examples: [
      {
        input: 'x = 123',
        output: '321',
        explanation: '123 reversed is 321.'
      },
      {
        input: 'x = -123',
        output: '-321',
        explanation: '-123 reversed is -321.'
      },
      {
        input: 'x = 120',
        output: '21',
        explanation: '120 reversed is 21.'
      }
    ],
    constraints: [
      '-2^31 <= x <= 2^31 - 1'
    ],
    tags: ['Math'],
    companies: ['Amazon', 'Apple', 'Google'],
    testCases: [
      { input: '123', expectedOutput: '321' },
      { input: '-123', expectedOutput: '-321' },
      { input: '120', expectedOutput: '21' }
    ]
  }
];

export const seedProblems = async (): Promise<void> => {
  try {
    console.log('Seeding problems...');
    
    for (const problem of sampleProblems) {
      // Check if problem already exists
      const existingProblem = await query(
        'SELECT id FROM problems WHERE title = $1',
        [problem.title]
      );
      
      if (existingProblem.rows.length === 0) {
        await query(`
          INSERT INTO problems (title, description, difficulty, examples, constraints, tags, companies, test_cases, acceptance_rate, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          problem.title,
          problem.description,
          problem.difficulty,
          JSON.stringify(problem.examples),
          problem.constraints,
          problem.tags,
          problem.companies,
          JSON.stringify(problem.testCases),
          Math.random() * 50 + 20 // Random acceptance rate between 20-70%
        ]);
        
        console.log(`Created problem: ${problem.title}`);
      } else {
        console.log(`Problem already exists: ${problem.title}`);
      }
    }
    
    console.log('Problems seeded successfully');
  } catch (error) {
    console.error('Error seeding problems:', error);
    throw error;
  }
};

// Sample colleges data
const sampleColleges = [
  {
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png',
    location: 'Cambridge, MA',
    rank: 1,
    description: 'A world-renowned private research university known for its programs in engineering, science, and technology.',
  },
  {
    name: 'Stanford University',
    shortName: 'Stanford',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/Stanford_University_seal_2003.svg/1200px-Stanford_University_seal_2003.svg.png',
    location: 'Stanford, CA',
    rank: 2,
    description: 'A leading research university known for its academic strength, wealth, proximity to Silicon Valley, and ranking as one of the world\'s top universities.',
  },
  {
    name: 'Carnegie Mellon University',
    shortName: 'CMU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Carnegie_Mellon_University_seal.svg/1200px-Carnegie_Mellon_University_seal.svg.png',
    location: 'Pittsburgh, PA',
    rank: 3,
    description: 'A private research university known for its programs in computer science, engineering, business, public policy, and fine arts.',
  },
  {
    name: 'University of California, Berkeley',
    shortName: 'UC Berkeley',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1200px-Seal_of_University_of_California%2C_Berkeley.svg.png',
    location: 'Berkeley, CA',
    rank: 4,
    description: 'A public land-grant research university and the flagship institution of the University of California system.',
  },
  {
    name: 'Georgia Institute of Technology',
    shortName: 'Georgia Tech',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Georgia_Tech_seal.svg/1200px-Georgia_Tech_seal.svg.png',
    location: 'Atlanta, GA',
    rank: 5,
    description: 'A public research university and institute of technology specializing in engineering, computing, design, business, the sciences, and architecture.',
  },
];

export const seedColleges = async (): Promise<void> => {
  try {
    console.log('Seeding colleges...');
    
    for (const college of sampleColleges) {
      // Check if college already exists
      const existingCollege = await query(
        'SELECT id FROM colleges WHERE name = $1',
        [college.name]
      );
      
      if (existingCollege.rows.length === 0) {
        await query(`
          INSERT INTO colleges (name, short_name, logo_url, location, rank, description, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          college.name,
          college.shortName,
          college.logoUrl,
          college.location,
          college.rank,
          college.description
        ]);
        
        console.log(`Created college: ${college.name}`);
      } else {
        console.log(`College already exists: ${college.name}`);
      }
    }
    
    console.log('Colleges seeded successfully');
  } catch (error) {
    logger.error('Error seeding colleges:', error);
    throw error;
  }
};

export const seedUsers = async (): Promise<void> => {
  try {
    console.log('Seeding users...');
    
    // Create a test user
    const testUser = {
      email: 'test@codnite.com',
      username: 'testuser',
      name: 'Test User',
      password: '$2b$10$rQZ8K9vXqYwE7nF5tG8H.uQZ8K9vXqYwE7nF5tG8H.uQZ8K9vXqYwE7nF5tG8H.u', // "password123"
      bio: 'I love coding and solving problems!',
      avatarUrl: '/default-avatar.svg',
      githubUsername: 'testuser',
      linkedinUrl: 'https://linkedin.com/in/testuser',
      collegeId: null, // Will be set after colleges are created
      points: 150
    };
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [testUser.email]
    );
    
    if (existingUser.rows.length === 0) {
      // Get first college ID to assign to user
      const collegeResult = await query('SELECT id FROM colleges LIMIT 1');
      const collegeId = collegeResult.rows.length > 0 ? collegeResult.rows[0].id : null;
      
      await query(`
        INSERT INTO users (email, username, name, password, bio, avatar_url, github_username, linkedin_url, college_id, points, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        testUser.email,
        testUser.username,
        testUser.name,
        testUser.password,
        testUser.bio,
        testUser.avatarUrl,
        testUser.githubUsername,
        testUser.linkedinUrl,
        collegeId,
        testUser.points
      ]);
      
      console.log(`Created test user: ${testUser.name}`);
    } else {
      console.log(`Test user already exists: ${testUser.email}`);
    }
    
    console.log('Users seeded successfully');
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};
