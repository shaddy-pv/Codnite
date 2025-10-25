import { query } from './database.js';
import logger from './logger.js';

// Real college data to seed the database
const collegesData = [
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    short_name: 'MIT',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png',
    location: 'Cambridge, Massachusetts',
    rank: 1,
    description: 'A world-renowned private research university specializing in science, technology, engineering, and mathematics.'
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    short_name: 'Stanford',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png',
    location: 'Stanford, California',
    rank: 2,
    description: 'A leading private research university known for its academic strength, wealth, proximity to Silicon Valley, and ranking as one of the world\'s top universities.'
  },
  {
    id: 'harvard',
    name: 'Harvard University',
    short_name: 'Harvard',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Harvard_Crimson_logo.svg/1200px-Harvard_Crimson_logo.svg.png',
    location: 'Cambridge, Massachusetts',
    rank: 3,
    description: 'The oldest institution of higher education in the United States and among the most prestigious in the world.'
  },
  {
    id: 'caltech',
    name: 'California Institute of Technology',
    short_name: 'Caltech',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Caltech_Beavers_logo.svg/1200px-Caltech_Beavers_logo.svg.png',
    location: 'Pasadena, California',
    rank: 4,
    description: 'A private research university known for its strength in science and engineering.'
  },
  {
    id: 'princeton',
    name: 'Princeton University',
    short_name: 'Princeton',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_Tigers_logo.svg/1200px-Princeton_Tigers_logo.svg.png',
    location: 'Princeton, New Jersey',
    rank: 5,
    description: 'A private Ivy League research university known for its academic excellence and beautiful campus.'
  },
  {
    id: 'berkeley',
    name: 'University of California, Berkeley',
    short_name: 'UC Berkeley',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1200px-Seal_of_University_of_California%2C_Berkeley.svg.png',
    location: 'Berkeley, California',
    rank: 6,
    description: 'A public land-grant research university and the flagship institution of the University of California system.'
  },
  {
    id: 'ucla',
    name: 'University of California, Los Angeles',
    short_name: 'UCLA',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/UCLA_Bruins_logo.svg/1200px-UCLA_Bruins_logo.svg.png',
    location: 'Los Angeles, California',
    rank: 7,
    description: 'A public land-grant research university and one of the most prestigious public universities in the United States.'
  },
  {
    id: 'yale',
    name: 'Yale University',
    short_name: 'Yale',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Yale_University_Shield_1.svg/1200px-Yale_University_Shield_1.svg.png',
    location: 'New Haven, Connecticut',
    rank: 8,
    description: 'A private Ivy League research university known for its academic excellence and historic campus.'
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    short_name: 'Columbia',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Columbia_University_logo.svg/1200px-Columbia_University_logo.svg.png',
    location: 'New York, New York',
    rank: 9,
    description: 'A private Ivy League research university located in Manhattan, New York City.'
  },
  {
    id: 'chicago',
    name: 'University of Chicago',
    short_name: 'UChicago',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/University_of_Chicago_shield.svg/1200px-University_of_Chicago_shield.svg.png',
    location: 'Chicago, Illinois',
    rank: 10,
    description: 'A private research university known for its rigorous academic programs and intellectual atmosphere.'
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    short_name: 'Cornell',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Cornell_University_logo.svg/1200px-Cornell_University_logo.svg.png',
    location: 'Ithaca, New York',
    rank: 11,
    description: 'A private Ivy League and statutory land-grant research university.'
  },
  {
    id: 'penn',
    name: 'University of Pennsylvania',
    short_name: 'Penn',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/University_of_Pennsylvania_logo.svg/1200px-University_of_Pennsylvania_logo.svg.png',
    location: 'Philadelphia, Pennsylvania',
    rank: 12,
    description: 'A private Ivy League research university founded by Benjamin Franklin.'
  },
  {
    id: 'duke',
    name: 'Duke University',
    short_name: 'Duke',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Duke_University_logo.svg/1200px-Duke_University_logo.svg.png',
    location: 'Durham, North Carolina',
    rank: 13,
    description: 'A private research university known for its academic excellence and strong athletics program.'
  },
  {
    id: 'northwestern',
    name: 'Northwestern University',
    short_name: 'Northwestern',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Northwestern_University_logo.svg/1200px-Northwestern_University_logo.svg.png',
    location: 'Evanston, Illinois',
    rank: 14,
    description: 'A private research university with campuses in Evanston and Chicago.'
  },
  {
    id: 'brown',
    name: 'Brown University',
    short_name: 'Brown',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Brown_University_logo.svg/1200px-Brown_University_logo.svg.png',
    location: 'Providence, Rhode Island',
    rank: 15,
    description: 'A private Ivy League research university known for its open curriculum.'
  }
];

export async function seedColleges(): Promise<void> {
  try {
    logger.info('Starting college data seeding...');

    // Check if colleges already exist
    const existingColleges = await query('SELECT COUNT(*) as count FROM colleges');
    const count = parseInt(existingColleges.rows[0].count);

    if (count > 0) {
      logger.info(`Colleges already exist (${count} records). Skipping seeding.`);
      return;
    }

    // Insert colleges
    for (const college of collegesData) {
      await query(
        `INSERT INTO colleges (id, name, short_name, logo_url, location, rank, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING`,
        [
          college.id,
          college.name,
          college.short_name,
          college.logo_url,
          college.location,
          college.rank,
          college.description
        ]
      );
    }

    logger.info(`Successfully seeded ${collegesData.length} colleges`);
  } catch (error) {
    logger.error('Error seeding colleges:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedColleges()
    .then(() => {
      logger.info('College seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('College seeding failed:', error);
      process.exit(1);
    });
}
