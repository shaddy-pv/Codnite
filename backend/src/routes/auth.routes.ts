import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../utils/database';
import config from '../config/env';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Enhanced input validation middleware with detailed error messages
const validateRegister = (req: any, res: any, next: any) => {
  const { email, username, password, name } = req.body;
  const errors: string[] = [];
  
  // Required field validation
  if (!email) errors.push('Email is required');
  if (!username) errors.push('Username is required');
  if (!password) errors.push('Password is required');
  if (!name) errors.push('Name is required');
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.join(', '),
      errors: errors
    });
  }
  
  // Password validation
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  // Username validation
  if (username.length < 3 || username.length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  }
  
  // Name validation
  if (name.length < 2 || name.length > 50) {
    errors.push('Name must be between 2 and 50 characters');
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  // Username validation (alphanumeric and underscores only)
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.join(', '),
      errors: errors
    });
  }
  
  next();
};

const validateLogin = (req: any, res: any, next: any) => {
  const { email, password } = req.body;
  const errors: string[] = [];
  
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.join(', '),
      errors: errors
    });
  }
  
  if (password.length < 1 || password.length > 128) {
    errors.push('Invalid password length');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.join(', '),
      errors: errors
    });
  }
  
  next();
};

// Register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, username, password, name, collegeId } = req.body;
    
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'User already exists',
        details: 'An account with this email or username already exists. Please try logging in or use different credentials.'
      });
    }
    
    // Hash password with configured rounds
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    
    // Create user
    const result = await query(
      `INSERT INTO users (email, username, name, password, college_id, points, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, email, username, name, college_id, points, avatar_url, created_at`,
      [
        email.toLowerCase(),
        username.toLowerCase(),
        name,
        hashedPassword,
        collegeId ? String(collegeId) : null,
        0
      ]
    );
    
    const user = result.rows[0];
    
    // Generate token with expiration
    const token = jwt.sign(
      { userId: user.id }, 
      config.jwtSecret,
      { expiresIn: config.security.jwtExpiresIn }
    );
    
    res.status(201).json({ 
      user: {
        ...user,
        avatarUrl: user.avatar_url
      }, 
      token,
      message: 'User registered successfully'
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: 'An unexpected error occurred during registration. Please try again.'
    });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with case-insensitive email
    const result = await query(
      'SELECT id, email, username, name, password, college_id, points, avatar_url, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email or password is incorrect. Please check your credentials and try again.'
      });
    }
    
    const user = result.rows[0];
    
    if (!user.password) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email or password is incorrect. Please check your credentials and try again.'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email or password is incorrect. Please check your credentials and try again.'
      });
    }
    
    // Generate token with expiration
    const token = jwt.sign(
      { userId: user.id }, 
      config.jwtSecret,
      { expiresIn: config.security.jwtExpiresIn }
    );
    
    // Award daily login points (5 points)
    await query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [5, user.id]
    );
    
    // Update user points for response
    const updatedUser = await query(
      'SELECT points FROM users WHERE id = $1',
      [user.id]
    );
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        collegeId: user.college_id,
        points: updatedUser.rows[0].points,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      }, 
      token,
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: 'An unexpected error occurred during login. Please try again.'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT id, email, username, name, bio, avatar_url, github_username, linkedin_url, college_id, points, created_at, updated_at 
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      githubUsername: user.github_username,
      linkedinUrl: user.linkedin_url,
      collegeId: user.college_id,
      points: user.points,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const { name, bio, avatarUrl, githubUsername, linkedinUrl } = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }
    if (avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramCount}`);
      values.push(avatarUrl);
      paramCount++;
    }
    if (githubUsername !== undefined) {
      updateFields.push(`github_username = $${paramCount}`);
      values.push(githubUsername);
      paramCount++;
    }
    if (linkedinUrl !== undefined) {
      updateFields.push(`linkedin_url = $${paramCount}`);
      values.push(linkedinUrl);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, email, username, name, bio, avatar_url, github_username, linkedin_url, college_id, points, updated_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        githubUsername: user.github_username,
        linkedinUrl: user.linkedin_url,
        collegeId: user.college_id,
        points: user.points,
        updatedAt: user.updated_at,
      }, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    
    // Get user with password
    const result = await query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    
    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.userId]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout (client-side token removal, but we can add token blacklisting here)
router.post('/logout', authenticate, async (req: any, res) => {
  try {
    // In a more advanced setup, you could blacklist the token here
    // For now, we'll just return success and let the client handle token removal
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;