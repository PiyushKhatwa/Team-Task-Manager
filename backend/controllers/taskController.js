const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, status, deadline } = req.body;

    // Verify project exists and user is admin of it
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project admin can create tasks' });
    }

    // Verify assignedTo is a member of the project
    const isMember = project.members.some((m) => m.toString() === assignedTo);
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'Assigned user is not a project member' });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo,
      status: status || 'todo',
      deadline,
    });

    const populated = await task
      .populate([
        { path: 'projectId', select: 'title' },
        { path: 'assignedTo', select: 'name email' },
      ]);

    res.status(201).json({ success: true, message: 'Task created successfully', task: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks (admin: all tasks for their projects; member: only assigned tasks)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    let query = {};

    if (req.user.role === 'admin') {
      // Find all projects owned by admin
      const adminProjects = await Project.find({ admin: req.user._id }).select('_id');
      const projectIds = adminProjects.map((p) => p._id);
      query.projectId = { $in: projectIds };
    } else {
      // Member only sees tasks assigned to them
      query.assignedTo = req.user._id;
    }

    // Filter by specific project if provided
    if (projectId) {
      query.projectId = projectId;
    }

    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'title description')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'title admin members')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check access
    const isAdmin = task.projectId.admin?.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo._id.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task (admin: any field; member: only status)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId', 'admin members');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isProjectAdmin = task.projectId.admin?.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();

    if (!isProjectAdmin && !isAssignee) {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot update this task.' });
    }

    // Members can only update status
    if (!isProjectAdmin && isAssignee) {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Members can only update the task status' });
      }
      task.status = status;
      await task.save();

      const updated = await Task.findById(task._id)
        .populate('projectId', 'title')
        .populate('assignedTo', 'name email');

      return res.json({ success: true, message: 'Task status updated', task: updated });
    }

    // Admin can update any field
    const { title, description, assignedTo, status, deadline } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (status) task.status = status;
    if (deadline !== undefined) task.deadline = deadline;

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('projectId', 'title')
      .populate('assignedTo', 'name email');

    res.json({ success: true, message: 'Task updated successfully', task: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId', 'admin');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.projectId.admin?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only project admin can delete tasks' });
    }

    await task.deleteOne();

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task statistics for dashboard
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      const adminProjects = await Project.find({ admin: req.user._id }).select('_id');
      const projectIds = adminProjects.map((p) => p._id);
      query.projectId = { $in: projectIds };
    } else {
      query.assignedTo = req.user._id;
    }

    const [total, completed, inProgress, todo] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'done' }),
      Task.countDocuments({ ...query, status: 'in-progress' }),
      Task.countDocuments({ ...query, status: 'todo' }),
    ]);

    const now = new Date();
    const overdue = await Task.countDocuments({
      ...query,
      deadline: { $lt: now },
      status: { $ne: 'done' },
    });

    res.json({
      success: true,
      stats: { total, completed, inProgress, todo, overdue },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, getTaskStats };
