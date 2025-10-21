-- Migration: Add Missing Indian Colleges
-- This migration adds missing Indian colleges without deleting existing ones

-- Update the colleges table to include additional fields if they don't exist
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Insert missing Indian colleges (only if they don't exist)
INSERT INTO colleges (id, name, short_name, location, rank, description, created_at) VALUES
-- IITs (Indian Institutes of Technology)
('iit-madras', 'Indian Institute of Technology Madras', 'IIT Madras', 'Chennai, Tamil Nadu', 1, 'Premier engineering institute, ranked #1 in India for engineering and technology education.', CURRENT_TIMESTAMP),
('iit-delhi', 'Indian Institute of Technology Delhi', 'IIT Delhi', 'New Delhi', 2, 'Leading engineering institute in the capital city, known for research and innovation.', CURRENT_TIMESTAMP),
('iit-bombay', 'Indian Institute of Technology Bombay', 'IIT Bombay', 'Mumbai, Maharashtra', 3, 'Premier engineering institute in Mumbai, known for computer science and engineering programs.', CURRENT_TIMESTAMP),
('iit-kanpur', 'Indian Institute of Technology Kanpur', 'IIT Kanpur', 'Kanpur, Uttar Pradesh', 4, 'Leading engineering institute known for aerospace and mechanical engineering.', CURRENT_TIMESTAMP),
('iit-kharagpur', 'Indian Institute of Technology Kharagpur', 'IIT Kharagpur', 'Kharagpur, West Bengal', 5, 'First IIT established in India, known for mining and metallurgical engineering.', CURRENT_TIMESTAMP),
('iit-roorkee', 'Indian Institute of Technology Roorkee', 'IIT Roorkee', 'Roorkee, Uttarakhand', 6, 'Formerly University of Roorkee, known for civil and earthquake engineering.', CURRENT_TIMESTAMP),
('iit-guwahati', 'Indian Institute of Technology Guwahati', 'IIT Guwahati', 'Guwahati, Assam', 7, 'Premier engineering institute in Northeast India.', CURRENT_TIMESTAMP),
('iit-hyderabad', 'Indian Institute of Technology Hyderabad', 'IIT Hyderabad', 'Hyderabad, Telangana', 8, 'New generation IIT known for interdisciplinary research.', CURRENT_TIMESTAMP),
('iit-indore', 'Indian Institute of Technology Indore', 'IIT Indore', 'Indore, Madhya Pradesh', 9, 'New generation IIT focusing on innovation and entrepreneurship.', CURRENT_TIMESTAMP),
('iit-bhubaneswar', 'Indian Institute of Technology Bhubaneswar', 'IIT Bhubaneswar', 'Bhubaneswar, Odisha', 10, 'New generation IIT in Eastern India.', CURRENT_TIMESTAMP),

-- NITs (National Institutes of Technology)
('nit-trichy', 'National Institute of Technology Tiruchirappalli', 'NIT Trichy', 'Tiruchirappalli, Tamil Nadu', 11, 'Premier NIT, formerly REC Trichy.', CURRENT_TIMESTAMP),
('nit-surathkal', 'National Institute of Technology Karnataka', 'NIT Surathkal', 'Surathkal, Karnataka', 12, 'Premier NIT in Karnataka, known for computer science.', CURRENT_TIMESTAMP),
('nit-warangal', 'National Institute of Technology Warangal', 'NIT Warangal', 'Warangal, Telangana', 13, 'Premier NIT in Telangana.', CURRENT_TIMESTAMP),
('nit-calicut', 'National Institute of Technology Calicut', 'NIT Calicut', 'Calicut, Kerala', 14, 'Premier NIT in Kerala.', CURRENT_TIMESTAMP),
('nit-rourkela', 'National Institute of Technology Rourkela', 'NIT Rourkela', 'Rourkela, Odisha', 15, 'Premier NIT in Odisha.', CURRENT_TIMESTAMP),

-- Central Universities
('du', 'University of Delhi', 'DU', 'New Delhi', 16, 'Premier central university in Delhi, known for arts, science, and commerce.', CURRENT_TIMESTAMP),
('jnu', 'Jawaharlal Nehru University', 'JNU', 'New Delhi', 17, 'Premier central university known for social sciences and international studies.', CURRENT_TIMESTAMP),
('bhu', 'Banaras Hindu University', 'BHU', 'Varanasi, Uttar Pradesh', 18, 'Premier central university known for Sanskrit and traditional studies.', CURRENT_TIMESTAMP),
('amu', 'Aligarh Muslim University', 'AMU', 'Aligarh, Uttar Pradesh', 19, 'Premier central university known for Islamic studies and engineering.', CURRENT_TIMESTAMP),
('hcu', 'University of Hyderabad', 'HCU', 'Hyderabad, Telangana', 20, 'Premier central university known for research and innovation.', CURRENT_TIMESTAMP),

-- Medical Colleges
('aiims-delhi', 'All India Institute of Medical Sciences Delhi', 'AIIMS Delhi', 'New Delhi', 21, 'Premier medical institute and hospital in India.', CURRENT_TIMESTAMP),
('aiims-jodhpur', 'All India Institute of Medical Sciences Jodhpur', 'AIIMS Jodhpur', 'Jodhpur, Rajasthan', 22, 'Premier medical institute in Rajasthan.', CURRENT_TIMESTAMP),
('aiims-bhubaneswar', 'All India Institute of Medical Sciences Bhubaneswar', 'AIIMS Bhubaneswar', 'Bhubaneswar, Odisha', 23, 'Premier medical institute in Odisha.', CURRENT_TIMESTAMP),

-- Management Institutes
('iim-ahmedabad', 'Indian Institute of Management Ahmedabad', 'IIM Ahmedabad', 'Ahmedabad, Gujarat', 24, 'Premier management institute, ranked #1 in India for MBA programs.', CURRENT_TIMESTAMP),
('iim-bangalore', 'Indian Institute of Management Bangalore', 'IIM Bangalore', 'Bangalore, Karnataka', 25, 'Premier management institute in Bangalore.', CURRENT_TIMESTAMP),
('iim-calcutta', 'Indian Institute of Management Calcutta', 'IIM Calcutta', 'Kolkata, West Bengal', 26, 'Premier management institute in Kolkata.', CURRENT_TIMESTAMP),
('iim-lucknow', 'Indian Institute of Management Lucknow', 'IIM Lucknow', 'Lucknow, Uttar Pradesh', 27, 'Premier management institute in Lucknow.', CURRENT_TIMESTAMP),
('iim-kozhikode', 'Indian Institute of Management Kozhikode', 'IIM Kozhikode', 'Kozhikode, Kerala', 28, 'Premier management institute in Kerala.', CURRENT_TIMESTAMP),

-- Other Premier Institutes
('iisc', 'Indian Institute of Science', 'IISc Bangalore', 'Bangalore, Karnataka', 29, 'Premier research institute for science and engineering.', CURRENT_TIMESTAMP),
('tifr', 'Tata Institute of Fundamental Research', 'TIFR', 'Mumbai, Maharashtra', 30, 'Premier research institute for fundamental sciences.', CURRENT_TIMESTAMP),
('iiser-pune', 'Indian Institute of Science Education and Research Pune', 'IISER Pune', 'Pune, Maharashtra', 31, 'Premier institute for science education and research.', CURRENT_TIMESTAMP),
('iiser-kolkata', 'Indian Institute of Science Education and Research Kolkata', 'IISER Kolkata', 'Kolkata, West Bengal', 32, 'Premier institute for science education and research.', CURRENT_TIMESTAMP),
('iiser-bhopal', 'Indian Institute of Science Education and Research Bhopal', 'IISER Bhopal', 'Bhopal, Madhya Pradesh', 33, 'Premier institute for science education and research.', CURRENT_TIMESTAMP),

-- State Universities
('pune-univ', 'Savitribai Phule Pune University', 'SPPU', 'Pune, Maharashtra', 34, 'Premier state university in Maharashtra.', CURRENT_TIMESTAMP),
('calcutta-univ', 'University of Calcutta', 'CU', 'Kolkata, West Bengal', 35, 'Premier state university in West Bengal.', CURRENT_TIMESTAMP),
('mumbai-univ', 'University of Mumbai', 'MU', 'Mumbai, Maharashtra', 36, 'Premier state university in Maharashtra.', CURRENT_TIMESTAMP),
('anna-univ', 'Anna University', 'AU', 'Chennai, Tamil Nadu', 37, 'Premier technical university in Tamil Nadu.', CURRENT_TIMESTAMP),
('osmania-univ', 'Osmania University', 'OU', 'Hyderabad, Telangana', 38, 'Premier state university in Telangana.', CURRENT_TIMESTAMP),

-- Private Universities
('bits-pilani', 'Birla Institute of Technology and Science Pilani', 'BITS Pilani', 'Pilani, Rajasthan', 39, 'Premier private engineering institute.', CURRENT_TIMESTAMP),
('vit', 'Vellore Institute of Technology', 'VIT', 'Vellore, Tamil Nadu', 40, 'Premier private engineering institute.', CURRENT_TIMESTAMP),
('manipal-univ', 'Manipal Academy of Higher Education', 'MAHE', 'Manipal, Karnataka', 41, 'Premier private university known for medical and engineering.', CURRENT_TIMESTAMP),
('srm-univ', 'SRM Institute of Science and Technology', 'SRM', 'Chennai, Tamil Nadu', 42, 'Premier private engineering institute.', CURRENT_TIMESTAMP),
('amity-univ', 'Amity University', 'AU', 'Noida, Uttar Pradesh', 43, 'Premier private university with multiple campuses.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_colleges_rank ON colleges(rank);
CREATE INDEX IF NOT EXISTS idx_colleges_location ON colleges(location);
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);

-- DOWN
-- Remove the additional columns and indexes
DROP INDEX IF EXISTS idx_colleges_name;
DROP INDEX IF EXISTS idx_colleges_location;
DROP INDEX IF EXISTS idx_colleges_rank;

-- Remove additional columns
ALTER TABLE colleges DROP COLUMN IF EXISTS created_at;
ALTER TABLE colleges DROP COLUMN IF EXISTS description;
ALTER TABLE colleges DROP COLUMN IF EXISTS rank;
ALTER TABLE colleges DROP COLUMN IF EXISTS location;
ALTER TABLE colleges DROP COLUMN IF EXISTS short_name;
