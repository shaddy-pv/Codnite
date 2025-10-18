import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional(),
  github_username: z.string()
    .max(100, 'GitHub username must be less than 100 characters')
    .regex(/^[a-zA-Z0-9-]+$/, 'GitHub username can only contain letters, numbers, and hyphens')
    .optional(),
  linkedin_url: z.string()
    .url('Invalid LinkedIn URL')
    .max(500, 'LinkedIn URL must be less than 500 characters')
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Post validation schemas
export const createPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters'),
  code: z.string()
    .max(50000, 'Code must be less than 50000 characters')
    .optional(),
  language: z.string()
    .max(50, 'Language must be less than 50 characters')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

export const updatePostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters')
    .optional(),
  code: z.string()
    .max(50000, 'Code must be less than 50000 characters')
    .optional(),
  language: z.string()
    .max(50, 'Language must be less than 50 characters')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment must be less than 2000 characters'),
  post_id: z.string()
    .uuid('Invalid post ID')
    .optional(),
  challenge_id: z.string()
    .uuid('Invalid challenge ID')
    .optional(),
  parent_id: z.string()
    .uuid('Invalid parent comment ID')
    .optional(),
}).refine((data) => data.post_id || data.challenge_id, {
  message: "Either post_id or challenge_id is required",
});

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment must be less than 2000 characters'),
});

// Challenge validation schemas
export const createChallengeSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' }),
  }),
  points: z.number()
    .int('Points must be an integer')
    .min(1, 'Points must be at least 1')
    .max(1000, 'Points must be less than 1000'),
  start_date: z.string()
    .datetime('Invalid start date format'),
  end_date: z.string()
    .datetime('Invalid end date format'),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

export const submitChallengeSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(50000, 'Code must be less than 50000 characters'),
  language: z.string()
    .min(1, 'Language is required')
    .max(50, 'Language must be less than 50 characters'),
});

// Problem validation schemas
export const createProblemSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(10000, 'Description must be less than 10000 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' }),
  }),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).min(1, 'At least one example is required'),
  constraints: z.array(z.string().max(500, 'Constraint must be less than 500 characters'))
    .max(20, 'Maximum 20 constraints allowed')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  companies: z.array(z.string().max(100, 'Company name must be less than 100 characters'))
    .max(20, 'Maximum 20 companies allowed')
    .optional(),
});

export const submitProblemSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(50000, 'Code must be less than 50000 characters'),
  language: z.string()
    .min(1, 'Language is required')
    .max(50, 'Language must be less than 50 characters'),
});

// Search validation schemas
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(255, 'Search query must be less than 255 characters'),
  type: z.enum(['posts', 'users', 'challenges', 'problems']).optional(),
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page must be less than 1000')
    .optional(),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be less than 100')
    .optional(),
});

// Pagination validation schemas
export const paginationSchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page must be less than 1000')
    .default(1),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be less than 100')
    .default(10),
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    size: z.number(),
    buffer: z.instanceof(Buffer),
  }),
});

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const idSchema = z.string().min(1, 'ID is required');

// Validation middleware helper
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Query validation helper
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Params validation helper
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parameter validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export default {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  createChallengeSchema,
  submitChallengeSchema,
  createProblemSchema,
  submitProblemSchema,
  searchSchema,
  paginationSchema,
  fileUploadSchema,
  uuidSchema,
  idSchema,
  validateSchema,
  validateQuery,
  validateParams,
};
