import { useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, AlertCircle, ListTodo, TrendingUp, FolderKanban, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { tasksAPI, projectsAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, icon: Icon, color, bgColor, borderColor }) => (
  <div className={`card p-5 border ${borderColor} hover:scale-[1.02] transition-transform duration-200`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon size={20} className={color} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes, tasksRes] = await Promise.all([
          tasksAPI.getStats(),
          projectsAPI.getAll(),
          tasksAPI.getAll(),
        ]);
        setStats(statsRes.data.stats);
        setProjects(projectsRes.data.projects.slice(0, 3));
        setRecentTasks(tasksRes.data.tasks.slice(0, 5));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (task) => {
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
    if (isOverdue) return <span className="badge-overdue">Overdue</span>;
    const map = {
      'todo': <span className="badge-todo">Todo</span>,
      'in-progress': <span className="badge-in-progress">In Progress</span>,
      'done': <span className="badge-done">Done</span>,
    };
    return map[task.status] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-dark-400 text-sm mt-0.5">
            Here's what's happening with your tasks today.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/projects" className="btn-primary btn-sm">
              <FolderKanban size={14} /> New Project
            </Link>
          )}
          <Link to="/tasks" className="btn-secondary btn-sm">
            <ListTodo size={14} /> View Tasks
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={stats?.total ?? 0}
          icon={ListTodo}
          color="text-primary-400"
          bgColor="bg-primary-500/10"
          borderColor="border-primary-500/20"
        />
        <StatCard
          label="Completed"
          value={stats?.completed ?? 0}
          icon={CheckCircle2}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgress ?? 0}
          icon={TrendingUp}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          borderColor="border-amber-500/20"
        />
        <StatCard
          label="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertCircle}
          color="text-red-400"
          bgColor="bg-red-500/10"
          borderColor="border-red-500/20"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-10 text-dark-400">
              <ListTodo size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                return (
                  <div
                    key={task._id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isOverdue ? 'border-red-500/20 bg-red-500/5' : 'border-dark-700 bg-dark-700/40 hover:bg-dark-700/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-dark-500 mt-0.5">
                        {task.projectId?.title} • {task.assignedTo?.name}
                      </p>
                    </div>
                    <div className="flex-shrink-0">{getStatusBadge(task)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Projects</h3>
            <Link to="/projects" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-10 text-dark-400">
              <FolderKanban size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No projects yet</p>
              {isAdmin && (
                <Link to="/projects" className="btn-primary btn-sm mt-3">
                  Create project
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project._id} className="p-3 rounded-lg border border-dark-700 bg-dark-700/40 hover:bg-dark-700/60 transition-colors">
                  <p className="text-sm font-medium text-white truncate">{project.title}</p>
                  <p className="text-xs text-dark-400 mt-0.5 flex items-center gap-1">
                    <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                    <span className="text-dark-600">•</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
