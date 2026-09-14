import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Leaf, Loader2, Plus } from 'lucide-react';
import { projectApi, seasonApi } from '../api/client';
import { SeasonModal } from '../components/SeasonModal';
import { localDateIso } from '../finance/money';
import { formatSeasonRange, isCurrentSeason } from '../seasons/range';
import type { Project, Season } from '../types/kanban';
import { ui } from '../theme/ui';

export const SeasonsPage: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const today = localDateIso();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [seasonData, projectData] = await Promise.all([seasonApi.listSeasons(), projectApi.listProjects()]);
      setSeasons(seasonData);
      setProjects(projectData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const project of projects) {
      if (!project.seasonId) continue;
      map.set(project.seasonId, (map.get(project.seasonId) ?? 0) + 1);
    }
    return map;
  }, [projects]);

  const unassigned = projects.filter((project) => !project.seasonId).length;

  const handleSave = async (data: {
    id?: string;
    name: string;
    notes: string;
    startsOn: string;
    endsOn?: string;
  }) => {
    if (data.id) {
      const updated = await seasonApi.updateSeason(data.id, data);
      setSeasons((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      return;
    }
    const created = await seasonApi.createSeason(data);
    setSeasons((prev) =>
      [...prev, created].sort((a, b) => b.startsOn.localeCompare(a.startsOn) || a.name.localeCompare(b.name))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={ui.kicker}>Collections of work</p>
            <h1 className={ui.title}>Seasons</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`${ui.btnPrimary} self-end sm:self-center`}
          >
            <Plus className="w-4 h-4" />
            New season
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Loading seasons...</p>
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

          {!loading && !error && (
            <>
              {unassigned > 0 && (
                <p className="text-sm text-muted">
                  {unassigned} project{unassigned === 1 ? '' : 's'} not in a season yet — they stay on{' '}
                  <Link to="/projects" className="text-fg font-medium hover:underline">
                    Projects
                  </Link>{' '}
                  until you add them.
                </p>
              )}

              {seasons.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-surface">
                  <Leaf className="w-8 h-8 text-subtle mb-3" />
                  <p className="text-sm text-fg font-medium">No seasons yet</p>
                  <p className="text-sm text-muted mt-1 mb-4 max-w-md">
                    A season groups projects you are carrying in the same stretch of work. Projects can exist
                    without one.
                  </p>
                  <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium text-fg hover:underline">
                    + New season
                  </button>
                </div>
              )}

              {seasons.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {seasons.map((season) => {
                    const count = counts.get(season.id) ?? 0;
                    const current = isCurrentSeason(season, today);
                    return (
                      <Link
                        key={season.id}
                        to={`/seasons/${season.id}`}
                        className={`group flex flex-col gap-3 p-4 ${ui.cardHover}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] text-muted">{formatSeasonRange(season)}</p>
                          {current && (
                            <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded bg-status-active text-status-active-fg">
                              Current
                            </span>
                          )}
                        </div>
                        <h2 className="text-sm font-semibold text-fg leading-snug">{season.name}</h2>
                        {season.notes && (
                          <p className="text-sm text-muted leading-relaxed line-clamp-3">{season.notes}</p>
                        )}
                        <p className="mt-auto pt-1 text-[11px] text-muted">
                          {count} project{count === 1 ? '' : 's'}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SeasonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
    </div>
  );
};
