import { query } from './src/utils/database.ts';

// Comprehensive list of Indian colleges and universities
const indianColleges = [
  // IITs (Indian Institutes of Technology)
  { id: 'iit-madras', name: 'Indian Institute of Technology Madras', shortName: 'IIT Madras', location: 'Chennai, Tamil Nadu', rank: 1, description: 'Premier engineering institute, ranked #1 in India for engineering and technology education.' },
  { id: 'iit-delhi', name: 'Indian Institute of Technology Delhi', shortName: 'IIT Delhi', location: 'New Delhi', rank: 2, description: 'Leading engineering institute in the capital city, known for research and innovation.' },
  { id: 'iit-bombay', name: 'Indian Institute of Technology Bombay', shortName: 'IIT Bombay', location: 'Mumbai, Maharashtra', rank: 3, description: 'Premier engineering institute in Mumbai, known for computer science and engineering programs.' },
  { id: 'iit-kanpur', name: 'Indian Institute of Technology Kanpur', shortName: 'IIT Kanpur', location: 'Kanpur, Uttar Pradesh', rank: 4, description: 'Leading engineering institute known for aerospace and mechanical engineering.' },
  { id: 'iit-kharagpur', name: 'Indian Institute of Technology Kharagpur', shortName: 'IIT Kharagpur', location: 'Kharagpur, West Bengal', rank: 5, description: 'First IIT established in India, known for mining and metallurgical engineering.' },
  { id: 'iit-roorkee', name: 'Indian Institute of Technology Roorkee', shortName: 'IIT Roorkee', location: 'Roorkee, Uttarakhand', rank: 6, description: 'Formerly University of Roorkee, known for civil and earthquake engineering.' },
  { id: 'iit-guwahati', name: 'Indian Institute of Technology Guwahati', shortName: 'IIT Guwahati', location: 'Guwahati, Assam', rank: 7, description: 'Premier engineering institute in Northeast India.' },
  { id: 'iit-hyderabad', name: 'Indian Institute of Technology Hyderabad', shortName: 'IIT Hyderabad', location: 'Hyderabad, Telangana', rank: 8, description: 'New generation IIT known for interdisciplinary research.' },
  { id: 'iit-indore', name: 'Indian Institute of Technology Indore', shortName: 'IIT Indore', location: 'Indore, Madhya Pradesh', rank: 9, description: 'New generation IIT focusing on innovation and entrepreneurship.' },
  { id: 'iit-bhubaneswar', name: 'Indian Institute of Technology Bhubaneswar', shortName: 'IIT Bhubaneswar', location: 'Bhubaneswar, Odisha', rank: 10, description: 'New generation IIT in Eastern India.' },
  { id: 'iit-gandhinagar', name: 'Indian Institute of Technology Gandhinagar', shortName: 'IIT Gandhinagar', location: 'Gandhinagar, Gujarat', rank: 11, description: 'New generation IIT known for liberal arts integration.' },
  { id: 'iit-rorkee', name: 'Indian Institute of Technology Ropar', shortName: 'IIT Ropar', location: 'Ropar, Punjab', rank: 12, description: 'New generation IIT in Punjab.' },
  { id: 'iit-patna', name: 'Indian Institute of Technology Patna', shortName: 'IIT Patna', location: 'Patna, Bihar', rank: 13, description: 'New generation IIT in Bihar.' },
  { id: 'iit-jodhpur', name: 'Indian Institute of Technology Jodhpur', shortName: 'IIT Jodhpur', location: 'Jodhpur, Rajasthan', rank: 14, description: 'New generation IIT in Rajasthan.' },
  { id: 'iit-goa', name: 'Indian Institute of Technology Goa', shortName: 'IIT Goa', location: 'Goa', rank: 15, description: 'New generation IIT in Goa.' },
  { id: 'iit-jammu', name: 'Indian Institute of Technology Jammu', shortName: 'IIT Jammu', location: 'Jammu, Jammu and Kashmir', rank: 16, description: 'New generation IIT in Jammu and Kashmir.' },
  { id: 'iit-dhanbad', name: 'Indian Institute of Technology Dhanbad', shortName: 'IIT Dhanbad', location: 'Dhanbad, Jharkhand', rank: 17, description: 'Formerly ISM Dhanbad, known for mining and petroleum engineering.' },
  { id: 'iit-bhilai', name: 'Indian Institute of Technology Bhilai', shortName: 'IIT Bhilai', location: 'Bhilai, Chhattisgarh', rank: 18, description: 'New generation IIT in Chhattisgarh.' },
  { id: 'iit-tirupati', name: 'Indian Institute of Technology Tirupati', shortName: 'IIT Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 19, description: 'New generation IIT in Andhra Pradesh.' },
  { id: 'iit-palakkad', name: 'Indian Institute of Technology Palakkad', shortName: 'IIT Palakkad', location: 'Palakkad, Kerala', rank: 20, description: 'New generation IIT in Kerala.' },

  // NITs (National Institutes of Technology)
  { id: 'nit-trichy', name: 'National Institute of Technology Tiruchirappalli', shortName: 'NIT Trichy', location: 'Tiruchirappalli, Tamil Nadu', rank: 21, description: 'Premier NIT, formerly REC Trichy.' },
  { id: 'nit-surathkal', name: 'National Institute of Technology Karnataka', shortName: 'NIT Surathkal', location: 'Surathkal, Karnataka', rank: 22, description: 'Premier NIT in Karnataka, known for computer science.' },
  { id: 'nit-warangal', name: 'National Institute of Technology Warangal', shortName: 'NIT Warangal', location: 'Warangal, Telangana', rank: 23, description: 'Premier NIT in Telangana.' },
  { id: 'nit-calicut', name: 'National Institute of Technology Calicut', shortName: 'NIT Calicut', location: 'Calicut, Kerala', rank: 24, description: 'Premier NIT in Kerala.' },
  { id: 'nit-rourkela', name: 'National Institute of Technology Rourkela', shortName: 'NIT Rourkela', location: 'Rourkela, Odisha', rank: 25, description: 'Premier NIT in Odisha.' },
  { id: 'nit-durgapur', name: 'National Institute of Technology Durgapur', shortName: 'NIT Durgapur', location: 'Durgapur, West Bengal', rank: 26, description: 'Premier NIT in West Bengal.' },
  { id: 'nit-kurukshetra', name: 'National Institute of Technology Kurukshetra', shortName: 'NIT Kurukshetra', location: 'Kurukshetra, Haryana', rank: 27, description: 'Premier NIT in Haryana.' },
  { id: 'nit-jalandhar', name: 'Dr. B.R. Ambedkar National Institute of Technology Jalandhar', shortName: 'NIT Jalandhar', location: 'Jalandhar, Punjab', rank: 28, description: 'Premier NIT in Punjab.' },
  { id: 'nit-allahabad', name: 'Motilal Nehru National Institute of Technology Allahabad', shortName: 'MNNIT Allahabad', location: 'Allahabad, Uttar Pradesh', rank: 29, description: 'Premier NIT in Uttar Pradesh.' },
  { id: 'nit-bhopal', name: 'Maulana Azad National Institute of Technology Bhopal', shortName: 'MANIT Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 30, description: 'Premier NIT in Madhya Pradesh.' },

  // Central Universities
  { id: 'du', name: 'University of Delhi', shortName: 'DU', location: 'New Delhi', rank: 31, description: 'Premier central university in Delhi, known for arts, science, and commerce.' },
  { id: 'jnu', name: 'Jawaharlal Nehru University', shortName: 'JNU', location: 'New Delhi', rank: 32, description: 'Premier central university known for social sciences and international studies.' },
  { id: 'bhu', name: 'Banaras Hindu University', shortName: 'BHU', location: 'Varanasi, Uttar Pradesh', rank: 33, description: 'Premier central university known for Sanskrit and traditional studies.' },
  { id: 'amu', name: 'Aligarh Muslim University', shortName: 'AMU', location: 'Aligarh, Uttar Pradesh', rank: 34, description: 'Premier central university known for Islamic studies and engineering.' },
  { id: 'jmi', name: 'Jamia Millia Islamia', shortName: 'JMI', location: 'New Delhi', rank: 35, description: 'Central university known for Islamic studies and technical education.' },
  { id: 'hcu', name: 'University of Hyderabad', shortName: 'HCU', location: 'Hyderabad, Telangana', rank: 36, description: 'Premier central university known for research and innovation.' },
  { id: 'pune-univ', name: 'Savitribai Phule Pune University', shortName: 'SPPU', location: 'Pune, Maharashtra', rank: 37, description: 'Premier state university in Maharashtra.' },
  { id: 'calcutta-univ', name: 'University of Calcutta', shortName: 'CU', location: 'Kolkata, West Bengal', rank: 38, description: 'Premier state university in West Bengal.' },
  { id: 'mumbai-univ', name: 'University of Mumbai', shortName: 'MU', location: 'Mumbai, Maharashtra', rank: 39, description: 'Premier state university in Maharashtra.' },
  { id: 'anna-univ', name: 'Anna University', shortName: 'AU', location: 'Chennai, Tamil Nadu', rank: 40, description: 'Premier technical university in Tamil Nadu.' },

  // Medical Colleges
  { id: 'aiims-delhi', name: 'All India Institute of Medical Sciences Delhi', shortName: 'AIIMS Delhi', location: 'New Delhi', rank: 41, description: 'Premier medical institute and hospital in India.' },
  { id: 'aiims-jodhpur', name: 'All India Institute of Medical Sciences Jodhpur', shortName: 'AIIMS Jodhpur', location: 'Jodhpur, Rajasthan', rank: 42, description: 'Premier medical institute in Rajasthan.' },
  { id: 'aiims-bhubaneswar', name: 'All India Institute of Medical Sciences Bhubaneswar', shortName: 'AIIMS Bhubaneswar', location: 'Bhubaneswar, Odisha', rank: 43, description: 'Premier medical institute in Odisha.' },
  { id: 'aiims-raipur', name: 'All India Institute of Medical Sciences Raipur', shortName: 'AIIMS Raipur', location: 'Raipur, Chhattisgarh', rank: 44, description: 'Premier medical institute in Chhattisgarh.' },
  { id: 'aiims-rishikesh', name: 'All India Institute of Medical Sciences Rishikesh', shortName: 'AIIMS Rishikesh', location: 'Rishikesh, Uttarakhand', rank: 45, description: 'Premier medical institute in Uttarakhand.' },

  // Management Institutes
  { id: 'iim-ahmedabad', name: 'Indian Institute of Management Ahmedabad', shortName: 'IIM Ahmedabad', location: 'Ahmedabad, Gujarat', rank: 46, description: 'Premier management institute, ranked #1 in India for MBA programs.' },
  { id: 'iim-bangalore', name: 'Indian Institute of Management Bangalore', shortName: 'IIM Bangalore', location: 'Bangalore, Karnataka', rank: 47, description: 'Premier management institute in Bangalore.' },
  { id: 'iim-calcutta', name: 'Indian Institute of Management Calcutta', shortName: 'IIM Calcutta', location: 'Kolkata, West Bengal', rank: 48, description: 'Premier management institute in Kolkata.' },
  { id: 'iim-lucknow', name: 'Indian Institute of Management Lucknow', shortName: 'IIM Lucknow', location: 'Lucknow, Uttar Pradesh', rank: 49, description: 'Premier management institute in Lucknow.' },
  { id: 'iim-kolkata', name: 'Indian Institute of Management Kozhikode', shortName: 'IIM Kozhikode', location: 'Kozhikode, Kerala', rank: 50, description: 'Premier management institute in Kerala.' },

  // Other Premier Institutes
  { id: 'iisc', name: 'Indian Institute of Science', shortName: 'IISc Bangalore', location: 'Bangalore, Karnataka', rank: 51, description: 'Premier research institute for science and engineering.' },
  { id: 'tifr', name: 'Tata Institute of Fundamental Research', shortName: 'TIFR', location: 'Mumbai, Maharashtra', rank: 52, description: 'Premier research institute for fundamental sciences.' },
  { id: 'iiser-pune', name: 'Indian Institute of Science Education and Research Pune', shortName: 'IISER Pune', location: 'Pune, Maharashtra', rank: 53, description: 'Premier institute for science education and research.' },
  { id: 'iiser-kolkata', name: 'Indian Institute of Science Education and Research Kolkata', shortName: 'IISER Kolkata', location: 'Kolkata, West Bengal', rank: 54, description: 'Premier institute for science education and research.' },
  { id: 'iiser-bhopal', name: 'Indian Institute of Science Education and Research Bhopal', shortName: 'IISER Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 55, description: 'Premier institute for science education and research.' },

  // State Universities
  { id: 'osmania-univ', name: 'Osmania University', shortName: 'OU', location: 'Hyderabad, Telangana', rank: 56, description: 'Premier state university in Telangana.' },
  { id: 'karnataka-univ', name: 'Karnataka University', shortName: 'KU', location: 'Dharwad, Karnataka', rank: 57, description: 'Premier state university in Karnataka.' },
  { id: 'rajasthan-univ', name: 'University of Rajasthan', shortName: 'RU', location: 'Jaipur, Rajasthan', rank: 58, description: 'Premier state university in Rajasthan.' },
  { id: 'gujarat-univ', name: 'Gujarat University', shortName: 'GU', location: 'Ahmedabad, Gujarat', rank: 59, description: 'Premier state university in Gujarat.' },
  { id: 'punjab-univ', name: 'Panjab University', shortName: 'PU', location: 'Chandigarh', rank: 60, description: 'Premier state university in Chandigarh.' },

  // Private Universities
  { id: 'bits-pilani', name: 'Birla Institute of Technology and Science Pilani', shortName: 'BITS Pilani', location: 'Pilani, Rajasthan', rank: 61, description: 'Premier private engineering institute.' },
  { id: 'vit', name: 'Vellore Institute of Technology', shortName: 'VIT', location: 'Vellore, Tamil Nadu', rank: 62, description: 'Premier private engineering institute.' },
  { id: 'manipal-univ', name: 'Manipal Academy of Higher Education', shortName: 'MAHE', location: 'Manipal, Karnataka', rank: 63, description: 'Premier private university known for medical and engineering.' },
  { id: 'srm-univ', name: 'SRM Institute of Science and Technology', shortName: 'SRM', location: 'Chennai, Tamil Nadu', rank: 64, description: 'Premier private engineering institute.' },
  { id: 'amity-univ', name: 'Amity University', shortName: 'AU', location: 'Noida, Uttar Pradesh', rank: 65, description: 'Premier private university with multiple campuses.' },

  // Specialized Institutes
  { id: 'iiser-mohali', name: 'Indian Institute of Science Education and Research Mohali', shortName: 'IISER Mohali', location: 'Mohali, Punjab', rank: 66, description: 'Premier institute for science education and research.' },
  { id: 'iiser-thiruvananthapuram', name: 'Indian Institute of Science Education and Research Thiruvananthapuram', shortName: 'IISER TVM', location: 'Thiruvananthapuram, Kerala', rank: 67, description: 'Premier institute for science education and research.' },
  { id: 'iiser-tirupati', name: 'Indian Institute of Science Education and Research Tirupati', shortName: 'IISER Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 68, description: 'Premier institute for science education and research.' },
  { id: 'iiser-berhampur', name: 'Indian Institute of Science Education and Research Berhampur', shortName: 'IISER Berhampur', location: 'Berhampur, Odisha', rank: 69, description: 'Premier institute for science education and research.' },
  { id: 'iiser-bhopal', name: 'Indian Institute of Science Education and Research Bhopal', shortName: 'IISER Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 70, description: 'Premier institute for science education and research.' },

  // Additional NITs
  { id: 'nit-srinagar', name: 'National Institute of Technology Srinagar', shortName: 'NIT Srinagar', location: 'Srinagar, Jammu and Kashmir', rank: 71, description: 'Premier NIT in Jammu and Kashmir.' },
  { id: 'nit-hamirpur', name: 'National Institute of Technology Hamirpur', shortName: 'NIT Hamirpur', location: 'Hamirpur, Himachal Pradesh', rank: 72, description: 'Premier NIT in Himachal Pradesh.' },
  { id: 'nit-jamshedpur', name: 'National Institute of Technology Jamshedpur', shortName: 'NIT Jamshedpur', location: 'Jamshedpur, Jharkhand', rank: 73, description: 'Premier NIT in Jharkhand.' },
  { id: 'nit-silchar', name: 'National Institute of Technology Silchar', shortName: 'NIT Silchar', location: 'Silchar, Assam', rank: 74, description: 'Premier NIT in Assam.' },
  { id: 'nit-nagpur', name: 'Visvesvaraya National Institute of Technology Nagpur', shortName: 'VNIT Nagpur', location: 'Nagpur, Maharashtra', rank: 75, description: 'Premier NIT in Maharashtra.' },

  // Additional IITs
  { id: 'iit-mandi', name: 'Indian Institute of Technology Mandi', shortName: 'IIT Mandi', location: 'Mandi, Himachal Pradesh', rank: 76, description: 'New generation IIT in Himachal Pradesh.' },
  { id: 'iit-varanasi', name: 'Indian Institute of Technology Varanasi', shortName: 'IIT Varanasi', location: 'Varanasi, Uttar Pradesh', rank: 77, description: 'New generation IIT in Uttar Pradesh.' },
  { id: 'iit-tirupati', name: 'Indian Institute of Technology Tirupati', shortName: 'IIT Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 78, description: 'New generation IIT in Andhra Pradesh.' },
  { id: 'iit-dharwad', name: 'Indian Institute of Technology Dharwad', shortName: 'IIT Dharwad', location: 'Dharwad, Karnataka', rank: 79, description: 'New generation IIT in Karnataka.' },
  { id: 'iit-bhilai', name: 'Indian Institute of Technology Bhilai', shortName: 'IIT Bhilai', location: 'Bhilai, Chhattisgarh', rank: 80, description: 'New generation IIT in Chhattisgarh.' },

  // Additional Central Universities
  { id: 'jnu-delhi', name: 'Jamia Hamdard University', shortName: 'JHU', location: 'New Delhi', rank: 81, description: 'Central university known for pharmacy and medical sciences.' },
  { id: 'jmi-delhi', name: 'Jamia Millia Islamia', shortName: 'JMI', location: 'New Delhi', rank: 82, description: 'Central university known for Islamic studies and technical education.' },
  { id: 'hcu-hyderabad', name: 'University of Hyderabad', shortName: 'HCU', location: 'Hyderabad, Telangana', rank: 83, description: 'Premier central university known for research and innovation.' },
  { id: 'pune-univ', name: 'Savitribai Phule Pune University', shortName: 'SPPU', location: 'Pune, Maharashtra', rank: 84, description: 'Premier state university in Maharashtra.' },
  { id: 'calcutta-univ', name: 'University of Calcutta', shortName: 'CU', location: 'Kolkata, West Bengal', rank: 85, description: 'Premier state university in West Bengal.' },

  // Additional Private Universities
  { id: 'bits-goa', name: 'Birla Institute of Technology and Science Goa', shortName: 'BITS Goa', location: 'Goa', rank: 86, description: 'Premier private engineering institute in Goa.' },
  { id: 'bits-hyderabad', name: 'Birla Institute of Technology and Science Hyderabad', shortName: 'BITS Hyderabad', location: 'Hyderabad, Telangana', rank: 87, description: 'Premier private engineering institute in Hyderabad.' },
  { id: 'vit-chennai', name: 'Vellore Institute of Technology Chennai', shortName: 'VIT Chennai', location: 'Chennai, Tamil Nadu', rank: 88, description: 'Premier private engineering institute in Chennai.' },
  { id: 'vit-bhopal', name: 'Vellore Institute of Technology Bhopal', shortName: 'VIT Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 89, description: 'Premier private engineering institute in Bhopal.' },
  { id: 'vit-bangalore', name: 'Vellore Institute of Technology Bangalore', shortName: 'VIT Bangalore', location: 'Bangalore, Karnataka', rank: 90, description: 'Premier private engineering institute in Bangalore.' },

  // Additional State Universities
  { id: 'andhra-univ', name: 'Andhra University', shortName: 'AU', location: 'Visakhapatnam, Andhra Pradesh', rank: 91, description: 'Premier state university in Andhra Pradesh.' },
  { id: 'kerala-univ', name: 'University of Kerala', shortName: 'KU', location: 'Thiruvananthapuram, Kerala', rank: 92, description: 'Premier state university in Kerala.' },
  { id: 'tamil-nadu-univ', name: 'Tamil Nadu Agricultural University', shortName: 'TNAU', location: 'Coimbatore, Tamil Nadu', rank: 93, description: 'Premier agricultural university in Tamil Nadu.' },
  { id: 'haryana-univ', name: 'Kurukshetra University', shortName: 'KU', location: 'Kurukshetra, Haryana', rank: 94, description: 'Premier state university in Haryana.' },
  { id: 'himachal-univ', name: 'Himachal Pradesh University', shortName: 'HPU', location: 'Shimla, Himachal Pradesh', rank: 95, description: 'Premier state university in Himachal Pradesh.' },

  // Additional Specialized Institutes
  { id: 'iiser-mohali', name: 'Indian Institute of Science Education and Research Mohali', shortName: 'IISER Mohali', location: 'Mohali, Punjab', rank: 96, description: 'Premier institute for science education and research.' },
  { id: 'iiser-thiruvananthapuram', name: 'Indian Institute of Science Education and Research Thiruvananthapuram', shortName: 'IISER TVM', location: 'Thiruvananthapuram, Kerala', rank: 97, description: 'Premier institute for science education and research.' },
  { id: 'iiser-tirupati', name: 'Indian Institute of Science Education and Research Tirupati', shortName: 'IISER Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 98, description: 'Premier institute for science education and research.' },
  { id: 'iiser-berhampur', name: 'Indian Institute of Science Education and Research Berhampur', shortName: 'IISER Berhampur', location: 'Berhampur, Odisha', rank: 99, description: 'Premier institute for science education and research.' },
  { id: 'iiser-bhopal', name: 'Indian Institute of Science Education and Research Bhopal', shortName: 'IISER Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 100, description: 'Premier institute for science education and research.' }
];

async function populateColleges() {
  try {
    console.log('Starting to populate colleges database...\n');
    
    // First, clear existing colleges
    console.log('Clearing existing colleges...');
    await query('DELETE FROM colleges');
    
    // Insert new colleges
    console.log(`Inserting ${indianColleges.length} Indian colleges...`);
    
    for (const college of indianColleges) {
      const insertQuery = `
        INSERT INTO colleges (id, name, short_name, location, rank, description, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          location = EXCLUDED.location,
          rank = EXCLUDED.rank,
          description = EXCLUDED.description
      `;
      
      await query(insertQuery, [
        college.id,
        college.name,
        college.shortName,
        college.location,
        college.rank,
        college.description
      ]);
    }
    
    // Verify insertion
    const countResult = await query('SELECT COUNT(*) as total FROM colleges');
    console.log(`\nSuccessfully inserted ${countResult.rows[0].total} colleges!`);
    
    // Show sample data
    const sampleResult = await query('SELECT * FROM colleges ORDER BY rank LIMIT 5');
    console.log('\nSample colleges:');
    console.log(JSON.stringify(sampleResult.rows, null, 2));
    
  } catch (error) {
    console.error('Error populating colleges:', error.message);
  }
  process.exit(0);
}

populateColleges();
