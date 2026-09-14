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
  Workflow,
  Wallet,
} from 'lucide-react';
import { diagramApi, financeApi, kanbanApi, projectApi } from '../api/client';
import type { Board, BpmnDiagram, FinanceTransaction, Project } from '../types/kanban';
import { formatCents, localMonthIso } from '../finance/money';
import { ui } from '../theme/ui';

export const HomePage: React.FC = () => {
  const [board, setBoard] = useState<Board | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [diagrams, setDiagrams] = useState<BpmnDiagram[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [boardData, projectData, diagramData, financeData] = await Promise.all([
        kanbanApi.getBoard(),
        projectApi.listProjects(),
        diagramApi.listDiagrams(),
        financeApi.listTransactions(),
      ]);
      setBoard(boardData);
      setProjects(projectData);
      setDiagrams(diagramData);
      setTransactions(financeData);
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
  const month = localMonthIso();
  const monthNet = transactions
    .filter((item) => item.occurredOn.startsWith(month))
    .reduce((sum, item) => sum + (item.type === 'INCOME' ? item.amountCents : -item.amountCents), 0);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="space-y-2">
          <p className={ui.kicker}>Personal workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-fg">
            Where do you want to work?
          </h1>
          <p className="text-sm text-muted max-w-xl leading-relaxed">
            OrganizApp keeps a Kanban board, projects, simple BPMN diagrams, and a finance ledger.
            They all live in the same local SQLite file on this machine.
          </p>
        </section>

        {loading && (
          <div className="flex items-center gap-2 text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading workspace...
          </div>
        )}

        {error && (
          <div className={`max-w-md p-5 space-y-3 ${ui.card}`}>
            <div className="flex items-center gap-2 text-danger-fg text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Unable to connect
            </div>
            <p className="text-sm text-muted">{error}</p>
            <button onClick={load} className={ui.btnPrimary}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Board tasks" value={totalTasks} />
              <Stat label="In progress" value={activeTasks} icon={<Clock className="w-3.5 h-3.5 text-subtle" />} />
              <Stat label="Done" value={doneTasks} icon={<CheckCircle2 className="w-3.5 h-3.5 text-subtle" />} />
              <Stat label="Active projects" value={activeProjects} />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <DestinationCard
                to="/finance"
                title="Finance"
                description={
                  transactions.length === 0
                    ? 'Track income and expenses by category.'
                    : `This month net ${monthNet < 0 ? '−' : monthNet > 0 ? '+' : ''}${formatCents(Math.abs(monthNet))} across ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}.`
                }
                icon={<Wallet className="w-5 h-5" />}
                cta="Open ledger"
              />
              <DestinationCard
                to="/diagrams"
                title="BPMN diagrams"
                description={`${diagrams.length} process diagram${diagrams.length === 1 ? '' : 's'} with start, tasks, decisions, and end.`}
                icon={<Workflow className="w-5 h-5" />}
                cta="Open diagrams"
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
  <div className={`px-4 py-3 ${ui.card}`}>
    <p className="text-[11px] text-muted flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <p className="mt-1 text-xl font-semibold text-fg">{value}</p>
  </div>
);

const DestinationCard: React.FC<{
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
}> = ({ to, title, description, icon, cta }) => (
  <Link to={to} className={`group flex flex-col gap-4 p-6 ${ui.cardHover}`}>
    <div className="w-10 h-10 rounded-md bg-surface-muted text-fg flex items-center justify-center">
      {icon}
    </div>
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-fg mt-auto">
      {cta}
      <ArrowRight className="w-3.5 h-3.5" />
    </span>
  </Link>
);
