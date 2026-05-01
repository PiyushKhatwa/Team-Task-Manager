const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createProjectValidation = [
  body('title').trim().notEmpty().withMessage('Project title is required').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

const addMemberValidation = [
  body('projectId').notEmpty().withMessage('Project ID is required').isMongoId().withMessage('Invalid project ID'),
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid user ID'),
];

router.post('/', protect, adminOnly, createProjectValidation, validate, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/add-member', protect, adminOnly, addMemberValidation, validate, addMember);
router.delete('/:id/members/:userId', protect, adminOnly, removeMember);

module.exports = router;
