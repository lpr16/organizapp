import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Calendar, Edit3, FolderKanban, Loader2, Plus, Trash2 } from 'lucide-react';
import { kanbanApi, projectApi, seasonApi } from '../api/client';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';
import type { Board, Priority, Project, ProjectStatus, Season, TaskCard } from '../types/kanban';
import { ui } from '../theme/ui';

const flattenTasks = (board: Board | null): TaskCard[] =>
  board?.columns.flatMap((column) => column.tasks) ?? [];

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addId, setAddId] = useState('');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [allProjects, seasonData, boardData] = await Promise.all([
        projectApi.listProjects(),
        seasonApi.listSeasons(),
        kanbanApi.getBoard(),
      ]);
      setProject(allProjects.find((item) => item.id === id) ?? null);
      setProjects(allProjects);
      setSeasons(seasonData);
      setBoard(boardData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const tasks = useMemo(() => flattenTasks(board), [board]);
  const members = useMemo(() => tasks.filter((task) => task.projectId === id), [tasks, id]);
  const unassigned = useMemo(() => tasks.filter((task) => !task.projectId), [tasks]);
  const columnName = useMemo(
    () => new Map(board?.columns.map((column) => [column.id, column.name]) ?? []),
    [board]
  );
  const seasonName = seasons.find((season) => season.id === project?.seasonId)?.name;

  const handleSaveProject = async (data: {
    id?: string;
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    dueDate?: string;
    seasonId?: string | null;
  }) => {
    if (!data.id) return;
    const updated = await projectApi.updateProject(data.id, data);
    setProject(updated);
    setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleSaveTask = async (data: {
    id?: string;
    columnId: string;
    laneId: string;
    title: string;
    description: string;
    priority: Priority;
    dueDate?: string;
    projectId?: string | null;
  }) => {
    const created = await kanbanApi.createTask({
      ...data,
      projectId: data.projectId ?? id,
    });
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((column) =>
          column.id === created.columnId ? { ...column, tasks: [...column.tasks, created] } : column
        ),
      };
    });
  };

  const handleAddExisting = async () => {
    if (!addId || !id) return;
    try {
      const updated = await kanbanApi.setTaskProject(addId, id);
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((column) => ({
            ...column,
            tasks: column.tasks.map((task) => (task.id === updated.id ? updated : task)),
          })),
        };
      });
      setAddId('');
    } catch (err) {
      console.error('Failed to add task to project', err);
    }
  };

  const handleRemove = async (task: TaskCard) => {
    try {
      const updated = await kanbanApi.setTaskProject(task.id, null);
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((column) => ({
            ...column,
            tasks: column.tasks.map((item) => (item.id === updated.id ? updated : item)),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to remove task from project', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm(`Delete project "${project.name}"? Tasks stay on the board; they become unassigned.`)) return;
    try {
      await projectApi.deleteProject(project.id);
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto space-y-3">
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
            <ArrowLeft className="w-3.5 h-3.5" />
            All projects
          </Link>
          {project && (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className={ui.kicker}>{seasonName ?? 'Not in a season yet'}</p>
                <h1 className={ui.title}>{project.name}</h1>
                {project.description && <p className="mt-1 text-sm text-muted max-w-2xl">{project.description}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start">
                <button type="button" onClick={() => setTaskModalOpen(true)} className={ui.btnPrimary}>
                  <Plus className="w-4 h-4" />
                  New task
                </button>
                <button type="button" onClick={() => setProjectModalOpen(true)} className={ui.btnSecondary}>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button type="button" onClick={handleDeleteProject} className={ui.btnSecondary}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Loading project...</p>
            </div>
          )}

          {error && (
            <div className={`max-w-md mx-auto p-6 text-center space-y-3 ${ui.card}`}>
              <div className="w-10 h-10 mx-auto rounded-md bg-danger-bg flex items-center justify-center text-danger-fg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-fg">Unable to load project</h3>
              <p className="text-sm text-muted">{error}</p>
              <button onClick={load} className={ui.btnPrimary}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && project && (
            <>
              {unassigned.length > 0 && (
                <div className={`p-4 flex flex-col sm:flex-row sm:items-end gap-3 ${ui.card}`}>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-fg mb-1.5">Add an existing task</label>
                    <select value={addId} onChange={(event) => setAddId(event.target.value)} className={ui.field}>
                      <option value="">Unassigned tasks…</option>
                      {unassigned.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={handleAddExisting} disabled={!addId} className={ui.btnSecondary}>
                    Add to project
                  </button>
                </div>
              )}

              {members.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-surface">
                  <FolderKanban className="w-8 h-8 text-subtle mb-3" />
                  <p className="text-sm text-fg font-medium">No tasks in this project</p>
                  <p className="text-sm text-muted mt-1 max-w-md">
                    Create one here, or add a board task that is not in a project yet. Unassigned work stays on
                    the Kanban board.
                  </p>
                </div>
              )}

              {members.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {members.map((task) => (
                    <article key={task.id} className={`group flex flex-col gap-3 p-4 ${ui.cardHover}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] text-muted">{columnName.get(task.columnId) ?? 'Board'}</span>
                        <button
                          type="button"
                          onClick={() => handleRemove(task)}
                          className={`${ui.iconBtn} opacity-0 group-hover:opacity-100`}
                          title="Remove from project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h2 className="text-sm font-semibold text-fg leading-snug">{task.title}</h2>
                      {task.description && (
                        <p className="text-sm text-muted leading-relaxed line-clamp-3">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <span className="mt-auto inline-flex items-center gap-1 text-[11px] text-muted pt-1">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && !error && !project && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderKanban className="w-8 h-8 text-subtle mb-3" />
              <p className="text-sm text-fg font-medium">Project not found</p>
              <Link to="/projects" className="mt-2 text-sm font-medium text-fg hover:underline">
                Back to projects
              </Link>
            </div>
          )}
        </div>
      </main>

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        initialProject={project}
        seasons={seasons}
      />
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        columns={board?.columns ?? []}
        lanes={board?.lanes ?? []}
        projects={projects}
        defaultProjectId={id}
      />
    </div>
  );
};
