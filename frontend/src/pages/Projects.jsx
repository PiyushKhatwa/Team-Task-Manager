import { useEffect, useState, useCallback } from 'react';
import { Plus, Users, X, FolderKanban, ChevronRight, UserPlus, Trash2 } from 'lucide-react';
import { projectsAPI, authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Create Project Modal ────────────────────────────────────────────────────
const CreateProjectModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);
    try {
      await projectsAPI.create(form);
      toast.success('Project created!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">New Project</h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm !px-2"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Project Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Website Redesign"
              className="input"
            />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief project description..."
              rows={3}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Add Member Modal ────────────────────────────────────────────────────────
const AddMemberModal = ({ project, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    authAPI.getAllUsers()
      .then(({ data }) => {
        // Filter out existing members
        const memberIds = project.members.map((m) => m._id);
        setUsers(data.users.filter((u) => !memberIds.includes(u._id)));
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setFetching(false));
  }, [project]);

  const handleAdd = async (userId) => {
    setLoading(true);
    try {
      await projectsAPI.addMember({ projectId: project._id, userId });
      toast.success('Member added!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add Member to <span className="text-primary-400">{project.title}</span></h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm !px-2"><X size={16} /></button>
        </div>
        {fetching ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">All users are already members.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {users.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-3 rounded-lg border border-dark-700 bg-dark-700/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-dark-400 capitalize">{user.email} • {user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(user._id)}
                  disabled={loading}
                  className="btn-primary btn-sm"
                >
                  <UserPlus size={14} />
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Project Card ────────────────────────────────────────────────────────────
const ProjectCard = ({ project, isAdmin, onAddMember, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card hover:border-dark-600 transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
              <h3 className="font-semibold text-white text-base truncate">{project.title}</h3>
            </div>
            {project.description && (
              <p className="text-sm text-dark-400 line-clamp-2 ml-4">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={() => onAddMember(project)}
                className="btn-secondary btn-sm"
                title="Add member"
              >
                <UserPlus size={14} />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-secondary btn-sm"
            >
              <Users size={14} />
              <span>{project.members?.length || 0}</span>
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 ml-4">
          <span className="text-xs text-dark-500">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs text-dark-600">•</span>
          <span className="text-xs text-dark-500">Admin: {project.admin?.name}</span>
        </div>
      </div>

      {/* Members expanded */}
      {expanded && (
        <div className="border-t border-dark-700 px-5 py-4">
          <p className="text-xs font-semibold text-dark-400 uppercase mb-3">Members</p>
          <div className="flex flex-wrap gap-2">
            {project.members?.map((member) => (
              <div key={member._id} className="flex items-center gap-2 bg-dark-700 px-3 py-1.5 rounded-full">
                <div className="w-5 h-5 rounded-full bg-primary-600/30 flex items-center justify-center text-xs text-primary-400 font-semibold">
                  {member.name.charAt(0)}
                </div>
                <span className="text-xs text-dark-200">{member.name}</span>
                <span className="text-xs text-dark-500 capitalize">({member.role})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Projects Page ────────────────────────────────────────────────────────────
const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [addMemberProject, setAddMemberProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

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
          <h2 className="page-title">Projects</h2>
          <p className="text-dark-400 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban size={40} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-300 font-medium">No projects yet</p>
          <p className="text-dark-500 text-sm mt-1">
            {isAdmin ? 'Create your first project to get started.' : 'You have no projects assigned yet.'}
          </p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              isAdmin={isAdmin}
              onAddMember={setAddMemberProject}
              onRefresh={fetchProjects}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onSuccess={fetchProjects} />
      )}
      {addMemberProject && (
        <AddMemberModal
          project={addMemberProject}
          onClose={() => setAddMemberProject(null)}
          onSuccess={fetchProjects}
        />
      )}
    </div>
  );
};

export default Projects;
