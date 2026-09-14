import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Edit3, FolderKanban, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { projectApi } from '../api/client';
import { ProjectModal } from '../components/ProjectModal';
import type { Priority, Project, ProjectStatus } from '../types/kanban';

const statusStyles: Record<ProjectStatus, string> = {
  PLANNING: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  ACTIVE: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  ON_HOLD: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
};

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
};

const priorityStyles: Record<Priority, string> = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-sky-400',
  HIGH: 'text-amber-400',
  URGENT: 'text-rose-400',
};

type Filter = 'ALL' | ProjectStatus;

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProjects(await projectApi.listProjects());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === 'ALL' ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter]
  );

  const handleSave = async (data: {
    id?: string;
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    dueDate?: string;
  }) => {
    if (data.id) {
      const updated = await projectApi.updateProject(data.id, data);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await projectApi.createProject(data);
      setProjects((prev) => [...prev, created]);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    try {
      await projectApi.deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-indigo-400 font-medium">Project management</p>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Projects</h1>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/20 self-end sm:self-center"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as Filter[]).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  filter === value
                    ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30'
                    : 'text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {value === 'ALL' ? 'All' : statusLabels[value]}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Loading projects...</p>
            </div>
          )}

          {error && (
            <div className="max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-100">Unable to Connect</h3>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={load}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Retry Connection
              </button>
            </div>
          )}

          {!loading && !error && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-2xl">
              <FolderKanban className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-sm text-slate-300 font-medium">No projects in this view</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Create one to track a longer piece of work.</p>
              <button
                onClick={() => {
                  setEditing(null);
                  setIsModalOpen(true);
                }}
                className="text-xs font-medium text-indigo-400 hover:underline"
              >
                + New project
              </button>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((project) => (
                <article
                  key={project.id}
                  className="group flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusStyles[project.status]}`}
                    >
                      {statusLabels[project.status]}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditing(project);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded"
                        title="Edit project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h2 className="text-sm font-semibold text-slate-100 leading-snug">{project.name}</h2>
                  {project.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{project.description}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-1 text-[11px]">
                    <span className={`font-medium ${priorityStyles[project.priority]}`}>
                      {project.priority.charAt(0) + project.priority.slice(1).toLowerCase()}
                    </span>
                    {project.dueDate && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {project.dueDate}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialProject={editing}
      />
    </div>
  );
};
