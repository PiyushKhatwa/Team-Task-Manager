const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      admin: req.user._id,
      members: [req.user._id], // Admin is also a member by default
    });

    const populated = await project.populate('admin', 'name email');

    res.status(201).json({ success: true, message: 'Project created successfully', project: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (admin sees all their own, member sees assigned)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      // Admin sees all projects they own
      projects = await Project.find({ admin: req.user._id })
        .populate('admin', 'name email')
        .populate('members', 'name email role')
        .sort({ createdAt: -1 });
    } else {
      // Member sees projects they belong to
      projects = await Project.find({ members: req.user._id })
        .populate('admin', 'name email')
        .populate('members', 'name email role')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check access
    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    const isAdmin = project.admin._id.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Not a project member.' });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a member to a project
// @route   POST /api/projects/add-member
// @access  Private/Admin
const addMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only the project's admin can add members
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project admin can add members' });
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already a member
    if (project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a project member' });
    }

    project.members.push(userId);
    await project.save();

    const updated = await Project.findById(projectId)
      .populate('admin', 'name email')
      .populate('members', 'name email role');

    res.json({ success: true, message: 'Member added successfully', project: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private/Admin
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project admin can remove members' });
    }

    // Cannot remove admin
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot remove themselves from the project' });
    }

    project.members = project.members.filter((m) => m.toString() !== req.params.userId);
    await project.save();

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getProjects, getProjectById, addMember, removeMember };
