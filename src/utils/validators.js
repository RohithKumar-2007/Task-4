// src/utils/validators.js
import { z } from 'zod';

export const taskSchema = z.object({
  text: z.string({
    required_error: 'Task text is required'
  }).min(3, 'Task text must be at least 3 characters').max(255, 'Task text cannot exceed 255 characters'),
  completed: z.boolean().optional()
});

// For update validations (allows fields to be optional for partial updates)
export const updateTaskSchema = z.object({
  text: z.string().min(3, 'Task text must be at least 3 characters').max(255, 'Task text cannot exceed 255 characters').optional(),
  completed: z.boolean().optional()
});

export const validate = (schema) => (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: ['Request body is empty or missing'] 
    });
  }

  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.errors.map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }
  
  req.body = result.data; // sanitised + typed data
  next();
};
