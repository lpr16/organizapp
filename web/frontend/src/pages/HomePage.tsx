import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Columns3,
  FolderKanban,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { kanbanApi, projectApi } from '../api/client';
import type { Board, Project } from '../types/kanban';

export const HomePage: React.FC = () => {
  const [board, setBoard] = useState<Board | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [boardData, projectData] = await Promise.all([
        kanbanApi.getBoard(),
        projectApi.listProjects(),
      ]);
      setBoard(boardData);
      setProjects(projectData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load workspace';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalTasks = board?.columns.reduce((sum, col) => sum + col.tasks.length, 0) || 0;
  const activeTasks = board?.columns
    .filter((col) => col.name.toLowerCase().includes('progress'))
    .reduce((sum, col) => sum + col.tasks.length, 0) || 0;
  const doneTasks = board?.columns
    .filter((col) => col.name.toLowerCase().includes('done') || col.name.toLowerCase().includes('complete'))
    .reduce((sum, col) => sum + col.tasks.length, 0) || 0;
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        <section className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-indigo-400 font-medium">Personal workspace</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-50">
            Where do you want to work?
          </h1>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            OrganizApp keeps a Kanban board for daily tasks and a project list for longer efforts.
            Both live in the same local SQLite file on this machine.
          </p>
        </section>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            Loading workspace...
          </div>
        )}

        {error && (
          <div className="max-w-md p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Unable to connect
            </div>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={load}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Board tasks" value={totalTasks} />
              <Stat label="In progress" value={activeTasks} icon={<Clock className="w-3.5 h-3.5 text-sky-400" />} />
              <Stat label="Done" value={doneTasks} icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} />
              <Stat label="Active projects" value={activeProjects} />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <DestinationCard
                to="/board"
                title="Kanban board"
                description={`Move cards across ${board?.columns.length ?? 0} columns on ${board?.name ?? 'your board'}.`}
                icon={<Columns3 className="w-5 h-5" />}
                cta="Open board"
              />
              <DestinationCard
                to="/projects"
                title="Project management"
                description={`${projects.length} project${projects.length === 1 ? '' : 's'} with status, priority, and due dates.`}
                icon={<FolderKanban className="w-5 h-5" />}
                cta="Open projects"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
};

const Stat: React.FC<{ label: string; value: number; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800">
    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
  </div>
);

const DestinationCard: React.FC<{
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
}> = ({ to, title, description, icon, cta }) => (
  <Link
    to={to}
    className="group flex flex-col gap-4 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition"
  >
    <div className="w-11 h-11 rounded-xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-300 flex items-center justify-center">
      {icon}
    </div>
    <div className="space-y-1.5">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 group-hover:text-indigo-300 mt-auto">
      {cta}
      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
    </span>
  </Link>
);
