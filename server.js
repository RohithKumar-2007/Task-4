// server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './src/db/connect.js';
import Task from './src/models/Task.js';
import taskRouter from './src/routes/taskRoutes.js';
import { securityHeaders } from './src/middleware/security.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import swaggerSpec from './src/utils/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB BEFORE starting the server
await connectDB();

// ■■ Middleware Pipeline (ORDER MATTERS) ■■■■■■■■■■■■■■■■■■■■■■■
app.use(helmet({
  contentSecurityPolicy: false // Allows dynamic Google Fonts and UI assets
})); // Security headers first
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend statically
app.use(cors()); // Cross-origin support
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(securityHeaders); // Custom security headers

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 100, // 100 req / IP / window
  message: { error: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ■■ Swagger Documentation ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ■■ Routes ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
app.use('/api/tasks', taskRouter);

// ■■ Health Check ■■■■■■■■■■■■■■■■■■■■■■■
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
);

// Catch-all route for unmatched paths (404)
app.use((req, res, next) => {
  const err = new Error('Resource not found');
  err.status = 404;
  next(err);
});

// ■■ Global Error Handler (must be LAST) ■■■■■■■■■■■■■■■■■■■■■■
app.use(errorHandler);

// ■■ Change Streams (Bonus Feature - Real-Time Updates) ■■■■■■■■■
try {
  const changeStream = Task.watch();
  changeStream.on('change', (data) => {
    console.log(`[WATCH CHANGE] Detected operation: ${data.operationType} on task: ${data.documentKey._id}`);
  });
  
  process.on('SIGINT', () => {
    changeStream.close();
  });
} catch (err) {
  console.warn('[WATCH WARNING] Change streams require replica sets (default on MongoDB Atlas M0). Standalone MongoDB will skip stream watching.', err.message);
}

app.listen(PORT, () => {
  console.log(`TaskFlow API running on http://localhost:${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
});
