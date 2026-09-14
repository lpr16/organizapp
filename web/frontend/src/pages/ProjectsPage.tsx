import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit3, FolderKanban, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { kanbanApi, projectApi, seasonApi } from '../api/client';
import { ProjectModal } from '../components/ProjectModal';
import type { Board, Priority, Project, ProjectStatus, Season } from '../types/kanban';
import { ui } from '../theme/ui';

const statusStyles: Record<ProjectStatus, string> = {
  PLANNING: 'bg-status-planning text-status-planning-fg',
  ACTIVE: 'bg-status-active text-status-active-fg',
  ON_HOLD: 'bg-status-hold text-status-hold-fg',
  COMPLETED: 'bg-status-done text-status-done-fg',
};

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
};

const priorityStyles: Record<Priority, string> = {
  LOW: 'text-badge-low-fg',
  MEDIUM: 'text-badge-medium-fg',
  HIGH: 'text-badge-high-fg',
  URGENT: 'text-badge-urgent-fg',
};

type Filter = 'ALL' | ProjectStatus;

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectData, seasonData, boardData] = await Promise.all([
        projectApi.listProjects(),
        seasonApi.listSeasons(),
        kanbanApi.getBoard(),
      ]);
      setProjects(projectData);
      setSeasons(seasonData);
      setBoard(boardData);
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

  const seasonName = useMemo(() => {
    const map = new Map(seasons.map((season) => [season.id, season.name]));
    return (seasonId: string | null) => (seasonId ? map.get(seasonId) ?? 'Season' : null);
  }, [seasons]);

  const taskCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const column of board?.columns ?? []) {
      for (const task of column.tasks) {
        if (!task.projectId) continue;
        map.set(task.projectId, (map.get(task.projectId) ?? 0) + 1);
      }
    }
    return map;
  }, [board]);

  const handleSave = async (data: {
    id?: string;
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    dueDate?: string;
    seasonId?: string | null;
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
    if (!confirm(`Delete project "${project.name}"? Tasks stay on the board; they become unassigned.`)) return;
    try {
      await projectApi.deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={ui.kicker}>Project management</p>
            <h1 className={ui.title}>Projects</h1>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setIsModalOpen(true);
            }}
            className={`${ui.btnPrimary} self-end sm:self-center`}
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
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  filter === value
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'text-muted border-border bg-surface hover:bg-surface-muted hover:text-fg'
                }`}
              >
                {value === 'ALL' ? 'All' : statusLabels[value]}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Loading projects...</p>
            </div>
          )}

          {error && (
            <div className={`max-w-md mx-auto p-6 text-center space-y-3 ${ui.card}`}>
              <div className="w-10 h-10 mx-auto rounded-md bg-danger-bg flex items-center justify-center text-danger-fg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-fg">Unable to Connect</h3>
              <p className="text-sm text-muted">{error}</p>
              <button onClick={load} className={ui.btnPrimary}>
                Retry Connection
              </button>
            </div>
          )}

          {!loading && !error && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-surface">
              <FolderKanban className="w-8 h-8 text-subtle mb-3" />
              <p className="text-sm text-fg font-medium">No projects in this view</p>
              <p className="text-sm text-muted mt-1 mb-4">Create one to track a longer piece of work.</p>
              <button
                onClick={() => {
                  setEditing(null);
                  setIsModalOpen(true);
                }}
                className="text-sm font-medium text-fg hover:underline"
              >
                + New project
              </button>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((project) => {
                const count = taskCount.get(project.id) ?? 0;
                return (
                <article
                  key={project.id}
                  className={`group flex flex-col gap-3 p-4 ${ui.cardHover}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded ${statusStyles[project.status]}`}
                    >
                      {statusLabels[project.status]}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditing(project);
                          setIsModalOpen(true);
                        }}
                        className={ui.iconBtn}
                        title="Edit project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className={ui.iconBtnDanger}
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h2 className="text-sm font-semibold text-fg leading-snug">
                    <Link to={`/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </h2>
                  {project.description && (
                    <p className="text-sm text-muted leading-relaxed line-clamp-3">{project.description}</p>
                  )}
                  <p className="text-[11px] text-muted">
                    {seasonName(project.seasonId) ?? 'Not in a season yet'}
                    {' · '}
                    {count === 1 ? '1 task' : `${count} tasks`}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-1 text-[11px]">
                    <span className={`font-medium ${priorityStyles[project.priority]}`}>
                      {project.priority.charAt(0) + project.priority.slice(1).toLowerCase()}
                    </span>
                    {project.dueDate && (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <Calendar className="w-3 h-3" />
                        {project.dueDate}
                      </span>
                    )}
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialProject={editing}
        seasons={seasons}
      />
    </div>
  );
};
