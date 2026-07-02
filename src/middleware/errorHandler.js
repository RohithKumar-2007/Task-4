// src/middleware/errorHandler.js

// Express identifies error middleware by the 4-parameter signature
export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);

  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let details = undefined;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map(e => e.message);
  }

  // Handle Mongoose invalid ObjectId format (CastError)
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid task ID format';
  }

  const response = { error: message };
  if (details) response.details = details;

  // Add stack trace only in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};
