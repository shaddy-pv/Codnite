import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        // Store hashed password in a separate auth table in production
      }
    });
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

export default router;