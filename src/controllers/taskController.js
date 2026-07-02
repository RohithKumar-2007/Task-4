// src/controllers/taskController.js
import mongoose from 'mongoose';
import Task from '../models/Task.js';

// ■■ Database Error Helper ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
const handleDBError = (res, error) => {
  console.error('[DATABASE ERROR]', error);
  if (error.name === 'ValidationError') {
    const msgs = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: msgs });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid task ID format' });
  }
  res.status(500).json({ error: 'Database operation failed' });
};

// GET /api/tasks (supports both full retrieval and pagination)
export const getTasks = async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
      const skipNum = (pageNum - 1) * limitNum;

      const [tasks, total] = await Promise.all([
        Task.find().sort({ createdAt: -1 }).skip(skipNum).limit(limitNum).lean(),
        Task.countDocuments()
      ]);

      return res.status(200).json({
        tasks,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalTasks: total,
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1
        }
      });
    }

    // Default: return all tasks sorted by createdAt descending
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(tasks);
  } catch (error) {
    handleDBError(res, error);
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).lean();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    handleDBError(res, error);
  }
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { text } = req.body;
    const task = new Task({ text });
    const savedTask = await task.save(); // triggers Mongoose schema validations
    res.status(201).json(savedTask);
  } catch (error) {
    handleDBError(res, error);
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const { text, completed } = req.body;
    const updateOps = {};
    if (text !== undefined) updateOps.text = text;
    if (completed !== undefined) updateOps.completed = completed;
    
    // lastModified is updated automatically by Mongoose timestamps: { updatedAt: 'lastModified' }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateOps,
      { new: true, runValidators: true } // returns updated document + runs validations
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    handleDBError(res, error);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).end();
  } catch (error) {
    handleDBError(res, error);
  }
};

// GET /api/tasks/search?q=query
export const searchTasks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = await Task.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.status(200).json(results);
  } catch (error) {
    handleDBError(res, error);
  }
};

// POST /api/tasks/clear-completed (Transaction Handling - Bonus)
export const bulkDeleteCompleted = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await Task.deleteMany({ completed: true }, { session });
    await session.commitTransaction();
    res.status(200).json({ deleted: result.deletedCount });
  } catch (error) {
    await session.abortTransaction();
    handleDBError(res, error);
  } finally {
    session.endSession();
  }
};
