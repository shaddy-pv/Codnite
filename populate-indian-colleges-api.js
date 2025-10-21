// Script to populate Indian colleges database via API
// This script can be run when the database connection is working

const indianColleges = [
  // IITs (Indian Institutes of Technology)
  { name: 'Indian Institute of Technology Madras', shortName: 'IIT Madras', location: 'Chennai, Tamil Nadu', rank: 1, description: 'Premier engineering institute, ranked #1 in India for engineering and technology education.' },
  { name: 'Indian Institute of Technology Delhi', shortName: 'IIT Delhi', location: 'New Delhi', rank: 2, description: 'Leading engineering institute in the capital city, known for research and innovation.' },
  { name: 'Indian Institute of Technology Bombay', shortName: 'IIT Bombay', location: 'Mumbai, Maharashtra', rank: 3, description: 'Premier engineering institute in Mumbai, known for computer science and engineering programs.' },
  { name: 'Indian Institute of Technology Kanpur', shortName: 'IIT Kanpur', location: 'Kanpur, Uttar Pradesh', rank: 4, description: 'Leading engineering institute known for aerospace and mechanical engineering.' },
  { name: 'Indian Institute of Technology Kharagpur', shortName: 'IIT Kharagpur', location: 'Kharagpur, West Bengal', rank: 5, description: 'First IIT established in India, known for mining and metallurgical engineering.' },
  { name: 'Indian Institute of Technology Roorkee', shortName: 'IIT Roorkee', location: 'Roorkee, Uttarakhand', rank: 6, description: 'Formerly University of Roorkee, known for civil and earthquake engineering.' },
  { name: 'Indian Institute of Technology Guwahati', shortName: 'IIT Guwahati', location: 'Guwahati, Assam', rank: 7, description: 'Premier engineering institute in Northeast India.' },
  { name: 'Indian Institute of Technology Hyderabad', shortName: 'IIT Hyderabad', location: 'Hyderabad, Telangana', rank: 8, description: 'New generation IIT known for interdisciplinary research.' },
  { name: 'Indian Institute of Technology Indore', shortName: 'IIT Indore', location: 'Indore, Madhya Pradesh', rank: 9, description: 'New generation IIT focusing on innovation and entrepreneurship.' },
  { name: 'Indian Institute of Technology Bhubaneswar', shortName: 'IIT Bhubaneswar', location: 'Bhubaneswar, Odisha', rank: 10, description: 'New generation IIT in Eastern India.' },

  // NITs (National Institutes of Technology)
  { name: 'National Institute of Technology Tiruchirappalli', shortName: 'NIT Trichy', location: 'Tiruchirappalli, Tamil Nadu', rank: 11, description: 'Premier NIT, formerly REC Trichy.' },
  { name: 'National Institute of Technology Karnataka', shortName: 'NIT Surathkal', location: 'Surathkal, Karnataka', rank: 12, description: 'Premier NIT in Karnataka, known for computer science.' },
  { name: 'National Institute of Technology Warangal', shortName: 'NIT Warangal', location: 'Warangal, Telangana', rank: 13, description: 'Premier NIT in Telangana.' },
  { name: 'National Institute of Technology Calicut', shortName: 'NIT Calicut', location: 'Calicut, Kerala', rank: 14, description: 'Premier NIT in Kerala.' },
  { name: 'National Institute of Technology Rourkela', shortName: 'NIT Rourkela', location: 'Rourkela, Odisha', rank: 15, description: 'Premier NIT in Odisha.' },

  // Central Universities
  { name: 'University of Delhi', shortName: 'DU', location: 'New Delhi', rank: 16, description: 'Premier central university in Delhi, known for arts, science, and commerce.' },
  { name: 'Jawaharlal Nehru University', shortName: 'JNU', location: 'New Delhi', rank: 17, description: 'Premier central university known for social sciences and international studies.' },
  { name: 'Banaras Hindu University', shortName: 'BHU', location: 'Varanasi, Uttar Pradesh', rank: 18, description: 'Premier central university known for Sanskrit and traditional studies.' },
  { name: 'Aligarh Muslim University', shortName: 'AMU', location: 'Aligarh, Uttar Pradesh', rank: 19, description: 'Premier central university known for Islamic studies and engineering.' },
  { name: 'University of Hyderabad', shortName: 'HCU', location: 'Hyderabad, Telangana', rank: 20, description: 'Premier central university known for research and innovation.' },

  // Medical Colleges
  { name: 'All India Institute of Medical Sciences Delhi', shortName: 'AIIMS Delhi', location: 'New Delhi', rank: 21, description: 'Premier medical institute and hospital in India.' },
  { name: 'All India Institute of Medical Sciences Jodhpur', shortName: 'AIIMS Jodhpur', location: 'Jodhpur, Rajasthan', rank: 22, description: 'Premier medical institute in Rajasthan.' },
  { name: 'All India Institute of Medical Sciences Bhubaneswar', shortName: 'AIIMS Bhubaneswar', location: 'Bhubaneswar, Odisha', rank: 23, description: 'Premier medical institute in Odisha.' },

  // Management Institutes
  { name: 'Indian Institute of Management Ahmedabad', shortName: 'IIM Ahmedabad', location: 'Ahmedabad, Gujarat', rank: 24, description: 'Premier management institute, ranked #1 in India for MBA programs.' },
  { name: 'Indian Institute of Management Bangalore', shortName: 'IIM Bangalore', location: 'Bangalore, Karnataka', rank: 25, description: 'Premier management institute in Bangalore.' },
  { name: 'Indian Institute of Management Calcutta', shortName: 'IIM Calcutta', location: 'Kolkata, West Bengal', rank: 26, description: 'Premier management institute in Kolkata.' },
  { name: 'Indian Institute of Management Lucknow', shortName: 'IIM Lucknow', location: 'Lucknow, Uttar Pradesh', rank: 27, description: 'Premier management institute in Lucknow.' },
  { name: 'Indian Institute of Management Kozhikode', shortName: 'IIM Kozhikode', location: 'Kozhikode, Kerala', rank: 28, description: 'Premier management institute in Kerala.' },

  // Other Premier Institutes
  { name: 'Indian Institute of Science', shortName: 'IISc Bangalore', location: 'Bangalore, Karnataka', rank: 29, description: 'Premier research institute for science and engineering.' },
  { name: 'Tata Institute of Fundamental Research', shortName: 'TIFR', location: 'Mumbai, Maharashtra', rank: 30, description: 'Premier research institute for fundamental sciences.' },
  { name: 'Indian Institute of Science Education and Research Pune', shortName: 'IISER Pune', location: 'Pune, Maharashtra', rank: 31, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Kolkata', shortName: 'IISER Kolkata', location: 'Kolkata, West Bengal', rank: 32, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Bhopal', shortName: 'IISER Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 33, description: 'Premier institute for science education and research.' },

  // State Universities
  { name: 'Savitribai Phule Pune University', shortName: 'SPPU', location: 'Pune, Maharashtra', rank: 34, description: 'Premier state university in Maharashtra.' },
  { name: 'University of Calcutta', shortName: 'CU', location: 'Kolkata, West Bengal', rank: 35, description: 'Premier state university in West Bengal.' },
  { name: 'University of Mumbai', shortName: 'MU', location: 'Mumbai, Maharashtra', rank: 36, description: 'Premier state university in Maharashtra.' },
  { name: 'Anna University', shortName: 'AU', location: 'Chennai, Tamil Nadu', rank: 37, description: 'Premier technical university in Tamil Nadu.' },
  { name: 'Osmania University', shortName: 'OU', location: 'Hyderabad, Telangana', rank: 38, description: 'Premier state university in Telangana.' },

  // Private Universities
  { name: 'Birla Institute of Technology and Science Pilani', shortName: 'BITS Pilani', location: 'Pilani, Rajasthan', rank: 39, description: 'Premier private engineering institute.' },
  { name: 'Vellore Institute of Technology', shortName: 'VIT', location: 'Vellore, Tamil Nadu', rank: 40, description: 'Premier private engineering institute.' },
  { name: 'Manipal Academy of Higher Education', shortName: 'MAHE', location: 'Manipal, Karnataka', rank: 41, description: 'Premier private university known for medical and engineering.' },
  { name: 'SRM Institute of Science and Technology', shortName: 'SRM', location: 'Chennai, Tamil Nadu', rank: 42, description: 'Premier private engineering institute.' },
  { name: 'Amity University', shortName: 'AU', location: 'Noida, Uttar Pradesh', rank: 43, description: 'Premier private university with multiple campuses.' },

  // Additional IITs
  { name: 'Indian Institute of Technology Gandhinagar', shortName: 'IIT Gandhinagar', location: 'Gandhinagar, Gujarat', rank: 44, description: 'New generation IIT known for liberal arts integration.' },
  { name: 'Indian Institute of Technology Ropar', shortName: 'IIT Ropar', location: 'Ropar, Punjab', rank: 45, description: 'New generation IIT in Punjab.' },
  { name: 'Indian Institute of Technology Patna', shortName: 'IIT Patna', location: 'Patna, Bihar', rank: 46, description: 'New generation IIT in Bihar.' },
  { name: 'Indian Institute of Technology Jodhpur', shortName: 'IIT Jodhpur', location: 'Jodhpur, Rajasthan', rank: 47, description: 'New generation IIT in Rajasthan.' },
  { name: 'Indian Institute of Technology Goa', shortName: 'IIT Goa', location: 'Goa', rank: 48, description: 'New generation IIT in Goa.' },

  // Additional NITs
  { name: 'National Institute of Technology Durgapur', shortName: 'NIT Durgapur', location: 'Durgapur, West Bengal', rank: 49, description: 'Premier NIT in West Bengal.' },
  { name: 'National Institute of Technology Kurukshetra', shortName: 'NIT Kurukshetra', location: 'Kurukshetra, Haryana', rank: 50, description: 'Premier NIT in Haryana.' },
  { name: 'Dr. B.R. Ambedkar National Institute of Technology Jalandhar', shortName: 'NIT Jalandhar', location: 'Jalandhar, Punjab', rank: 51, description: 'Premier NIT in Punjab.' },
  { name: 'Motilal Nehru National Institute of Technology Allahabad', shortName: 'MNNIT Allahabad', location: 'Allahabad, Uttar Pradesh', rank: 52, description: 'Premier NIT in Uttar Pradesh.' },
  { name: 'Maulana Azad National Institute of Technology Bhopal', shortName: 'MANIT Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 53, description: 'Premier NIT in Madhya Pradesh.' },

  // Additional Central Universities
  { name: 'Jamia Millia Islamia', shortName: 'JMI', location: 'New Delhi', rank: 54, description: 'Central university known for Islamic studies and technical education.' },
  { name: 'Jamia Hamdard University', shortName: 'JHU', location: 'New Delhi', rank: 55, description: 'Central university known for pharmacy and medical sciences.' },

  // Additional State Universities
  { name: 'Karnataka University', shortName: 'KU', location: 'Dharwad, Karnataka', rank: 56, description: 'Premier state university in Karnataka.' },
  { name: 'University of Rajasthan', shortName: 'RU', location: 'Jaipur, Rajasthan', rank: 57, description: 'Premier state university in Rajasthan.' },
  { name: 'Gujarat University', shortName: 'GU', location: 'Ahmedabad, Gujarat', rank: 58, description: 'Premier state university in Gujarat.' },
  { name: 'Panjab University', shortName: 'PU', location: 'Chandigarh', rank: 59, description: 'Premier state university in Chandigarh.' },
  { name: 'Andhra University', shortName: 'AU', location: 'Visakhapatnam, Andhra Pradesh', rank: 60, description: 'Premier state university in Andhra Pradesh.' },

  // Additional Private Universities
  { name: 'Birla Institute of Technology and Science Goa', shortName: 'BITS Goa', location: 'Goa', rank: 61, description: 'Premier private engineering institute in Goa.' },
  { name: 'Birla Institute of Technology and Science Hyderabad', shortName: 'BITS Hyderabad', location: 'Hyderabad, Telangana', rank: 62, description: 'Premier private engineering institute in Hyderabad.' },
  { name: 'Vellore Institute of Technology Chennai', shortName: 'VIT Chennai', location: 'Chennai, Tamil Nadu', rank: 63, description: 'Premier private engineering institute in Chennai.' },
  { name: 'Vellore Institute of Technology Bhopal', shortName: 'VIT Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 64, description: 'Premier private engineering institute in Bhopal.' },
  { name: 'Vellore Institute of Technology Bangalore', shortName: 'VIT Bangalore', location: 'Bangalore, Karnataka', rank: 65, description: 'Premier private engineering institute in Bangalore.' },

  // Additional Specialized Institutes
  { name: 'Indian Institute of Science Education and Research Mohali', shortName: 'IISER Mohali', location: 'Mohali, Punjab', rank: 66, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Thiruvananthapuram', shortName: 'IISER TVM', location: 'Thiruvananthapuram, Kerala', rank: 67, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Tirupati', shortName: 'IISER Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 68, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Berhampur', shortName: 'IISER Berhampur', location: 'Berhampur, Odisha', rank: 69, description: 'Premier institute for science education and research.' },

  // Additional NITs
  { name: 'National Institute of Technology Srinagar', shortName: 'NIT Srinagar', location: 'Srinagar, Jammu and Kashmir', rank: 70, description: 'Premier NIT in Jammu and Kashmir.' },
  { name: 'National Institute of Technology Hamirpur', shortName: 'NIT Hamirpur', location: 'Hamirpur, Himachal Pradesh', rank: 71, description: 'Premier NIT in Himachal Pradesh.' },
  { name: 'National Institute of Technology Jamshedpur', shortName: 'NIT Jamshedpur', location: 'Jamshedpur, Jharkhand', rank: 72, description: 'Premier NIT in Jharkhand.' },
  { name: 'National Institute of Technology Silchar', shortName: 'NIT Silchar', location: 'Silchar, Assam', rank: 73, description: 'Premier NIT in Assam.' },
  { name: 'Visvesvaraya National Institute of Technology Nagpur', shortName: 'VNIT Nagpur', location: 'Nagpur, Maharashtra', rank: 74, description: 'Premier NIT in Maharashtra.' },

  // Additional IITs
  { name: 'Indian Institute of Technology Mandi', shortName: 'IIT Mandi', location: 'Mandi, Himachal Pradesh', rank: 75, description: 'New generation IIT in Himachal Pradesh.' },
  { name: 'Indian Institute of Technology Varanasi', shortName: 'IIT Varanasi', location: 'Varanasi, Uttar Pradesh', rank: 76, description: 'New generation IIT in Uttar Pradesh.' },
  { name: 'Indian Institute of Technology Dharwad', shortName: 'IIT Dharwad', location: 'Dharwad, Karnataka', rank: 77, description: 'New generation IIT in Karnataka.' },
  { name: 'Indian Institute of Technology Bhilai', shortName: 'IIT Bhilai', location: 'Bhilai, Chhattisgarh', rank: 78, description: 'New generation IIT in Chhattisgarh.' },
  { name: 'Indian Institute of Technology Tirupati', shortName: 'IIT Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 79, description: 'New generation IIT in Andhra Pradesh.' },

  // Additional State Universities
  { name: 'University of Kerala', shortName: 'KU', location: 'Thiruvananthapuram, Kerala', rank: 80, description: 'Premier state university in Kerala.' },
  { name: 'Tamil Nadu Agricultural University', shortName: 'TNAU', location: 'Coimbatore, Tamil Nadu', rank: 81, description: 'Premier agricultural university in Tamil Nadu.' },
  { name: 'Kurukshetra University', shortName: 'KU', location: 'Kurukshetra, Haryana', rank: 82, description: 'Premier state university in Haryana.' },
  { name: 'Himachal Pradesh University', shortName: 'HPU', location: 'Shimla, Himachal Pradesh', rank: 83, description: 'Premier state university in Himachal Pradesh.' },
  { name: 'Utkal University', shortName: 'UU', location: 'Bhubaneswar, Odisha', rank: 84, description: 'Premier state university in Odisha.' },

  // Additional Medical Colleges
  { name: 'All India Institute of Medical Sciences Raipur', shortName: 'AIIMS Raipur', location: 'Raipur, Chhattisgarh', rank: 85, description: 'Premier medical institute in Chhattisgarh.' },
  { name: 'All India Institute of Medical Sciences Rishikesh', shortName: 'AIIMS Rishikesh', location: 'Rishikesh, Uttarakhand', rank: 86, description: 'Premier medical institute in Uttarakhand.' },
  { name: 'All India Institute of Medical Sciences Nagpur', shortName: 'AIIMS Nagpur', location: 'Nagpur, Maharashtra', rank: 87, description: 'Premier medical institute in Maharashtra.' },
  { name: 'All India Institute of Medical Sciences Mangalagiri', shortName: 'AIIMS Mangalagiri', location: 'Mangalagiri, Andhra Pradesh', rank: 88, description: 'Premier medical institute in Andhra Pradesh.' },
  { name: 'All India Institute of Medical Sciences Gorakhpur', shortName: 'AIIMS Gorakhpur', location: 'Gorakhpur, Uttar Pradesh', rank: 89, description: 'Premier medical institute in Uttar Pradesh.' },

  // Additional Management Institutes
  { name: 'Indian Institute of Management Indore', shortName: 'IIM Indore', location: 'Indore, Madhya Pradesh', rank: 90, description: 'Premier management institute in Indore.' },
  { name: 'Indian Institute of Management Shillong', shortName: 'IIM Shillong', location: 'Shillong, Meghalaya', rank: 91, description: 'Premier management institute in Northeast India.' },
  { name: 'Indian Institute of Management Raipur', shortName: 'IIM Raipur', location: 'Raipur, Chhattisgarh', rank: 92, description: 'Premier management institute in Chhattisgarh.' },
  { name: 'Indian Institute of Management Ranchi', shortName: 'IIM Ranchi', location: 'Ranchi, Jharkhand', rank: 93, description: 'Premier management institute in Jharkhand.' },
  { name: 'Indian Institute of Management Udaipur', shortName: 'IIM Udaipur', location: 'Udaipur, Rajasthan', rank: 94, description: 'Premier management institute in Rajasthan.' },

  // Additional Specialized Institutes
  { name: 'Indian Institute of Science Education and Research Mohali', shortName: 'IISER Mohali', location: 'Mohali, Punjab', rank: 95, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Thiruvananthapuram', shortName: 'IISER TVM', location: 'Thiruvananthapuram, Kerala', rank: 96, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Tirupati', shortName: 'IISER Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 97, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Berhampur', shortName: 'IISER Berhampur', location: 'Berhampur, Odisha', rank: 98, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Bhopal', shortName: 'IISER Bhopal', location: 'Bhopal, Madhya Pradesh', rank: 99, description: 'Premier institute for science education and research.' },
  { name: 'Indian Institute of Science Education and Research Tirupati', shortName: 'IISER Tirupati', location: 'Tirupati, Andhra Pradesh', rank: 100, description: 'Premier institute for science education and research.' }
];

// Function to populate colleges via API
async function populateCollegesViaAPI() {
  try {
    console.log('Starting to populate colleges database via API...\n');
    
    // First, get authentication token
    console.log('Getting authentication token...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser2@test.com',
        password: 'testpass123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Failed to authenticate');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Authentication successful!\n');
    
    // Clear existing colleges first
    console.log('Clearing existing colleges...');
    // Note: We'll need to implement a DELETE endpoint or clear manually
    
    // Insert new colleges
    console.log(`Inserting ${indianColleges.length} Indian colleges...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const college of indianColleges) {
      try {
        const response = await fetch('http://localhost:5000/api/colleges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: college.name,
            shortName: college.shortName,
            location: college.location,
            rank: college.rank,
            description: college.description
          })
        });
        
        if (response.ok) {
          successCount++;
          console.log(`✓ Created: ${college.shortName}`);
        } else {
          errorCount++;
          const errorData = await response.json();
          console.log(`✗ Failed: ${college.shortName} - ${errorData.error}`);
        }
      } catch (error) {
        errorCount++;
        console.log(`✗ Error: ${college.shortName} - ${error.message}`);
      }
    }
    
    console.log(`\nCompleted! Success: ${successCount}, Errors: ${errorCount}`);
    
    // Verify by getting colleges list
    console.log('\nVerifying colleges...');
    const verifyResponse = await fetch('http://localhost:5000/api/colleges');
    if (verifyResponse.ok) {
      const collegesData = await verifyResponse.json();
      console.log(`Total colleges in database: ${collegesData.pagination.total}`);
    }
    
  } catch (error) {
    console.error('Error populating colleges:', error.message);
  }
}

// Run the script
populateCollegesViaAPI();
