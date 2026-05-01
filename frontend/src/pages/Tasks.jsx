import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, CheckSquare, Filter, AlertTriangle } from 'lucide-react';
import { tasksAPI, projectsAPI, authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ task }) => {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  if (isOverdue) return <span className="badge-overdue flex items-center gap-1"><AlertTriangle size={10} /> Overdue</span>;
  const map = {
    'todo': <span className="badge-todo">Todo</span>,
    'in-progress': <span className="badge-in-progress">In Progress</span>,
    'done': <span className="badge-done">✓ Done</span>,
  };
  return map[task.status] || null;
};

// ─── Create/Edit Task Modal ───────────────────────────────────────────────────
const TaskModal = ({ task, onClose, onSuccess }) => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    projectId: task?.projectId?._id || '',
    assignedTo: task?.assignedTo?._id || '',
    status: task?.status || 'todo',
    deadline: task?.deadline ? task.deadline.slice(0, 10) : '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    projectsAPI.getAll().then(({ data }) => setProjects(data.projects));
  }, []);

  useEffect(() => {
    if (!form.projectId) { setUsers([]); return; }
    setLoadingUsers(true);
    projectsAPI.getById(form.projectId)
      .then(({ data }) => setUsers(data.project.members || []))
      .catch(() => toast.error('Failed to load project members'))
      .finally(() => setLoadingUsers(false));
  }, [form.projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.projectId || !form.assignedTo) {
      return toast.error('Title, project, and assigned user are required');
    }
    setLoading(true);
    try {
      if (task) {
        await tasksAPI.update(task._id, form);
        toast.success('Task updated!');
      } else {
        await tasksAPI.create(form);
        toast.success('Task created!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm !px-2"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Task Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Design homepage mockup"
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Task details..."
              rows={2}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Project *</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value, assignedTo: '' })}
                className="select"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Assign To *</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="select"
                disabled={!form.projectId || loadingUsers}
              >
                <option value="">{loadingUsers ? 'Loading...' : 'Select member'}</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="select"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Inline Status Update (for members) ──────────────────────────────────────
const StatusDropdown = ({ task, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setLoading(true);
    try {
      await tasksAPI.update(task._id, { status: newStatus });
      toast.success('Status updated');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={task.status}
      onChange={handleChange}
      disabled={loading}
      className="select !py-1 !px-2 text-xs w-32"
    >
      <option value="todo">Todo</option>
      <option value="in-progress">In Progress</option>
      <option value="done">Done</option>
    </select>
  );
};

// ─── Tasks Page ───────────────────────────────────────────────────────────────
const Tasks = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ projectId: '', status: '' });

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.status) params.status = filters.status;
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    projectsAPI.getAll().then(({ data }) => setProjects(data.projects));
  }, []);

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const overdueCount = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Tasks</h2>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-dark-400 text-sm">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
            {overdueCount > 0 && (
              <span className="badge-overdue flex items-center gap-1 text-xs">
                <AlertTriangle size={10} /> {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-dark-400" />
        <select
          value={filters.projectId}
          onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
          className="select !w-auto min-w-[160px]"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="select !w-auto min-w-[140px]"
        >
          <option value="">All Statuses</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {(filters.projectId || filters.status) && (
          <button
            onClick={() => setFilters({ projectId: '', status: '' })}
            className="btn-secondary btn-sm"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Tasks table */}
      {tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare size={40} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-300 font-medium">No tasks found</p>
          <p className="text-dark-500 text-sm mt-1">
            {isAdmin ? 'Create a task to get started.' : 'No tasks assigned to you yet.'}
          </p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
              <Plus size={16} /> Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead className="table-head">
              <tr>
                <th className="table-th">Task</th>
                <th className="table-th">Project</th>
                <th className="table-th">Assigned To</th>
                <th className="table-th">Status</th>
                <th className="table-th">Deadline</th>
                {isAdmin && <th className="table-th">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                return (
                  <tr key={task._id} className={`table-row ${isOverdue ? 'bg-red-500/5' : ''}`}>
                    <td className="table-td">
                      <div>
                        <p className={`font-medium ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-dark-500 text-xs mt-0.5 max-w-xs truncate">{task.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-dark-400">{task.projectId?.title}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-semibold flex-shrink-0">
                          {task.assignedTo?.name?.charAt(0)}
                        </div>
                        <span className="text-dark-300">{task.assignedTo?.name}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      {isAdmin ? (
                        <StatusBadge task={task} />
                      ) : (
                        <StatusDropdown task={task} onUpdate={fetchTasks} />
                      )}
                    </td>
                    <td className="table-td">
                      {task.deadline ? (
                        <span className={isOverdue ? 'text-red-400 font-medium' : 'text-dark-400'}>
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-dark-600">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="table-td">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditTask(task)}
                            className="btn-secondary btn-sm"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="btn btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <TaskModal onClose={() => setShowCreate(false)} onSuccess={fetchTasks} />
      )}
      {editTask && (
        <TaskModal task={editTask} onClose={() => setEditTask(null)} onSuccess={fetchTasks} />
      )}
    </div>
  );
};

export default Tasks;
