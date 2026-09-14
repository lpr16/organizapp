import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Edit3,
  FolderKanban,
  Leaf,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { projectApi, seasonApi } from '../api/client';
import { ProjectModal } from '../components/ProjectModal';
import { SeasonModal } from '../components/SeasonModal';
import { localDateIso } from '../finance/money';
import { formatSeasonRange, isCurrentSeason } from '../seasons/range';
import type { Priority, Project, ProjectStatus, Season } from '../types/kanban';
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

export const SeasonDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addId, setAddId] = useState('');
  const [seasonModalOpen, setSeasonModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const today = localDateIso();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [seasonData, allSeasons, projectData] = await Promise.all([
        seasonApi.getSeason(id),
        seasonApi.listSeasons(),
        projectApi.listProjects(),
      ]);
      setSeason(seasonData);
      setSeasons(allSeasons);
      setProjects(projectData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load season');
      setSeason(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const members = useMemo(
    () => projects.filter((project) => project.seasonId === id),
    [projects, id]
  );
  const unassigned = useMemo(
    () => projects.filter((project) => !project.seasonId),
    [projects]
  );

  const handleSaveSeason = async (data: {
    id?: string;
    name: string;
    notes: string;
    startsOn: string;
    endsOn?: string;
  }) => {
    if (!data.id) return;
    const updated = await seasonApi.updateSeason(data.id, data);
    setSeason(updated);
    setSeasons((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleSaveProject = async (data: {
    id?: string;
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    dueDate?: string;
    seasonId?: string | null;
  }) => {
    const created = await projectApi.createProject({
      ...data,
      seasonId: data.seasonId ?? id,
    });
    setProjects((prev) => [...prev, created]);
  };

  const handleAddExisting = async () => {
    if (!addId || !id) return;
    try {
      const updated = await projectApi.setProjectSeason(addId, id);
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setAddId('');
    } catch (err) {
      console.error('Failed to add project to season', err);
    }
  };

  const handleRemove = async (project: Project) => {
    try {
      const updated = await projectApi.setProjectSeason(project.id, null);
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      console.error('Failed to remove project from season', err);
    }
  };

  const handleDeleteSeason = async () => {
    if (!season) return;
    if (!confirm(`Delete season "${season.name}"? Projects stay; they become unassigned.`)) return;
    try {
      await seasonApi.deleteSeason(season.id);
      navigate('/seasons');
    } catch (err) {
      console.error('Failed to delete season', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto space-y-3">
          <Link to="/seasons" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
            <ArrowLeft className="w-3.5 h-3.5" />
            All seasons
          </Link>
          {season && (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className={ui.kicker}>
                  {formatSeasonRange(season)}
                  {isCurrentSeason(season, today) ? ' · Current' : ''}
                </p>
                <h1 className={ui.title}>{season.name}</h1>
                {season.notes && <p className="mt-1 text-sm text-muted max-w-2xl">{season.notes}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={() => {
                    setProjectModalOpen(true);
                  }}
                  className={ui.btnPrimary}
                >
                  <Plus className="w-4 h-4" />
                  New project
                </button>
                <button type="button" onClick={() => setSeasonModalOpen(true)} className={ui.btnSecondary}>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button type="button" onClick={handleDeleteSeason} className={ui.btnSecondary}>
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
              <p className="text-sm font-medium">Loading season...</p>
            </div>
          )}

          {error && (
            <div className={`max-w-md mx-auto p-6 text-center space-y-3 ${ui.card}`}>
              <div className="w-10 h-10 mx-auto rounded-md bg-danger-bg flex items-center justify-center text-danger-fg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-fg">Unable to load season</h3>
              <p className="text-sm text-muted">{error}</p>
              <button onClick={load} className={ui.btnPrimary}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && season && (
            <>
              {unassigned.length > 0 && (
                <div className={`p-4 flex flex-col sm:flex-row sm:items-end gap-3 ${ui.card}`}>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-fg mb-1.5">Add an existing project</label>
                    <select
                      value={addId}
                      onChange={(event) => setAddId(event.target.value)}
                      className={ui.field}
                    >
                      <option value="">Unassigned projects…</option>
                      {unassigned.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExisting}
                    disabled={!addId}
                    className={ui.btnSecondary}
                  >
                    Add to season
                  </button>
                </div>
              )}

              {members.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-surface">
                  <FolderKanban className="w-8 h-8 text-subtle mb-3" />
                  <p className="text-sm text-fg font-medium">No projects in this season</p>
                  <p className="text-sm text-muted mt-1 max-w-md">
                    Create one here, or add a project that is not in a season yet. Unassigned work stays on
                    the Projects page.
                  </p>
                </div>
              )}

              {members.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {members.map((project) => (
                    <article key={project.id} className={`group flex flex-col gap-3 p-4 ${ui.cardHover}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded ${statusStyles[project.status]}`}
                        >
                          {statusLabels[project.status]}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(project)}
                          className={`${ui.iconBtn} opacity-0 group-hover:opacity-100`}
                          title="Remove from season"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h2 className="text-sm font-semibold text-fg leading-snug">{project.name}</h2>
                      {project.description && (
                        <p className="text-sm text-muted leading-relaxed line-clamp-3">{project.description}</p>
                      )}
                      {project.dueDate && (
                        <span className="mt-auto inline-flex items-center gap-1 text-[11px] text-muted pt-1">
                          <Calendar className="w-3 h-3" />
                          {project.dueDate}
                        </span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && !error && !season && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Leaf className="w-8 h-8 text-subtle mb-3" />
              <p className="text-sm text-fg font-medium">Season not found</p>
              <Link to="/seasons" className="mt-2 text-sm font-medium text-fg hover:underline">
                Back to seasons
              </Link>
            </div>
          )}
        </div>
      </main>

      <SeasonModal
        isOpen={seasonModalOpen}
        onClose={() => setSeasonModalOpen(false)}
        onSave={handleSaveSeason}
        initialSeason={season}
      />
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        seasons={seasons}
        defaultSeasonId={id}
      />
    </div>
  );
};
