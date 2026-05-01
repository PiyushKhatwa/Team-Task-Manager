const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('projectId').notEmpty().withMessage('Project ID is required').isMongoId().withMessage('Invalid project ID'),
  body('assignedTo').notEmpty().withMessage('Assigned user ID is required').isMongoId().withMessage('Invalid user ID'),
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('deadline').optional().isISO8601().withMessage('Invalid date format'),
];

const updateTaskValidation = [
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('deadline').optional().isISO8601().withMessage('Invalid date format'),
];

// Stats route must come before :id route
router.get('/stats', protect, getTaskStats);

router.post('/', protect, createTaskValidation, validate, createTask);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTaskValidation, validate, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
