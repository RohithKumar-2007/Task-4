// src/routes/taskRoutes.js
import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
  bulkDeleteCompleted
} from '../controllers/taskController.js';
import { validate, taskSchema, updateTaskSchema } from '../utils/validators.js';

const router = Router();

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Returns all tasks (or paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of tasks per page
 *     responses:
 *       200:
 *         description: List of task objects
 *   post:
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Learn Mongoose indexing"
 *     responses:
 *       201:
 *         description: Created task object
 *       400:
 *         description: Validation failed
 */
router.route('/')
  .get(getTasks)
  .post(validate(taskSchema), createTask);

/**
 * @swagger
 * /api/tasks/search:
 *   get:
 *     summary: Full-text search tasks
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query term
 *     responses:
 *       200:
 *         description: Array of matching tasks sorted by relevance
 *       400:
 *         description: Search query required
 */
router.get('/search', searchTasks);

/**
 * @swagger
 * /api/tasks/clear-completed:
 *   post:
 *     summary: Bulk delete completed tasks using transactions
 *     responses:
 *       200:
 *         description: Count of deleted tasks
 *       500:
 *         description: Database transaction failed
 */
router.post('/clear-completed', bulkDeleteCompleted);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Task object
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Task not found
 *   put:
 *     summary: Update task properties
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated task object
 *       400:
 *         description: Validation failed / Invalid ID
 *       404:
 *         description: Task not found
 *   delete:
 *     summary: Delete task permanently
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       204:
 *         description: No Content
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Task not found
 */
router.route('/:id')
  .get(getTaskById)
  .put(validate(updateTaskSchema), updateTask)
  .delete(deleteTask);

export default router;
