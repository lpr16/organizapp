import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Loader2,
  SquareKanban,
  Wallet,
} from 'lucide-react';
import { financeApi, kanbanApi, projectApi } from '../api/client';
import { formatCents, localDateIso } from '../finance/money';
import {
  addMonths,
  formatDayHeading,
  monthCells,
  monthTitle,
  startOfMonth,
  weekdayLabels,
} from '../calendar/dates';
import type { Board, FinanceTransaction, Project } from '../types/kanban';
import { ui } from '../theme/ui';

type Kind = 'task' | 'project' | 'finance';
type KindFilter = 'ALL' | Kind;

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind: Kind;
  href: string;
  meta?: string;
  overdue?: boolean;
};

const kindLabel: Record<Kind, string> = {
  task: 'Task',
  project: 'Project',
  finance: 'Finance',
};

const collectEvents = (
  board: Board | null,
  projects: Project[],
  transactions: FinanceTransaction[],
  today: string
): CalendarEvent[] => {
  const columnName = new Map(board?.columns.map((column) => [column.id, column.name]) ?? []);
  const events: CalendarEvent[] = [];

  for (const column of board?.columns ?? []) {
    for (const task of column.tasks) {
      if (!task.dueDate) continue;
      events.push({
        id: `task:${task.id}`,
        date: task.dueDate,
        title: task.title,
        kind: 'task',
        href: '/board',
        meta: columnName.get(task.columnId),
        overdue: task.dueDate < today && !/done|complete/i.test(columnName.get(task.columnId) ?? ''),
      });
    }
  }

  for (const project of projects) {
    if (!project.dueDate) continue;
    events.push({
      id: `project:${project.id}`,
      date: project.dueDate,
      title: project.name,
      kind: 'project',
      href: '/projects',
      meta: project.status.replace('_', ' ').toLowerCase(),
      overdue: project.dueDate < today && project.status !== 'COMPLETED',
    });
  }

  for (const item of transactions) {
    const sign = item.type === 'INCOME' ? '+' : '−';
    events.push({
      id: `finance:${item.id}`,
      date: item.occurredOn,
      title: item.description,
      kind: 'finance',
      href: '/finance',
      meta: `${sign}${formatCents(item.amountCents)} · ${item.category}`,
    });
  }

  return events.sort((a, b) => a.title.localeCompare(b.title));
};

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const today = localDateIso();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const [kindFilter, setKindFilter] = useState<KindFilter>('ALL');
  const [board, setBoard] = useState<Board | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [boardData, projectData, financeData] = await Promise.all([
        kanbanApi.getBoard(),
        projectApi.listProjects(),
        financeApi.listTransactions(),
      ]);
      setBoard(boardData);
      setProjects(projectData);
      setTransactions(financeData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const events = useMemo(
    () => collectEvents(board, projects, transactions, today),
    [board, projects, transactions, today]
  );

  const visibleEvents = useMemo(
    () => (kindFilter === 'ALL' ? events : events.filter((item) => item.kind === kindFilter)),
    [events, kindFilter]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const item of visibleEvents) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [visibleEvents]);

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const weekdays = useMemo(() => weekdayLabels(), []);
  const selectedItems = byDate.get(selected) ?? [];

  const goMonth = (delta: number) => {
    const next = addMonths(cursor, delta);
    setCursor(next);
    const nextIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
    if (!selected.startsWith(nextIso.slice(0, 7))) {
      const monthKey = nextIso.slice(0, 7);
      setSelected(today.startsWith(monthKey) ? today : nextIso);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={ui.kicker}>Dated work</p>
            <h1 className={ui.title}>{monthTitle(cursor)}</h1>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button type="button" onClick={() => goMonth(-1)} className={ui.iconBtn} title="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = startOfMonth(new Date());
                setCursor(now);
                setSelected(today);
              }}
              className={ui.btnSecondary}
            >
              Today
            </button>
            <button type="button" onClick={() => goMonth(1)} className={ui.iconBtn} title="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 min-h-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'task', 'project', 'finance'] as KindFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKindFilter(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  kindFilter === value
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'text-muted border-border bg-surface hover:bg-surface-muted hover:text-fg'
                }`}
              >
                {value === 'ALL' ? 'All' : kindLabel[value]}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Loading calendar...</p>
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
            <div className="grid lg:grid-cols-[1fr_20rem] gap-5 min-h-0 flex-1">
              <div className={`${ui.card} overflow-hidden flex flex-col min-h-0`}>
                <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
                  {weekdays.map((label) => (
                    <div
                      key={label}
                      className="px-2 py-2 text-[11px] uppercase tracking-wider text-muted font-medium text-center"
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                  {cells.map((cell) => {
                    const dayEvents = byDate.get(cell.iso) ?? [];
                    const isToday = cell.iso === today;
                    const isSelected = cell.iso === selected;
                    const preview = dayEvents.slice(0, 3);
                    const extra = dayEvents.length - preview.length;
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        onClick={() => setSelected(cell.iso)}
                        className={`min-h-24 p-2 text-left border-b border-r border-border last:border-r-0 align-top ${
                          isSelected ? 'bg-surface-muted' : 'bg-surface hover:bg-surface-muted/60'
                        } ${!cell.inMonth ? 'opacity-40' : ''}`}
                      >
                        <span
                          className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-xs font-medium ${
                            isToday ? 'bg-accent text-accent-fg' : 'text-fg'
                          }`}
                        >
                          {cell.day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {preview.map((item) => (
                            <p
                              key={item.id}
                              className={`truncate text-[11px] leading-snug ${
                                item.overdue ? 'text-danger-fg' : 'text-muted'
                              }`}
                            >
                              {item.title}
                            </p>
                          ))}
                          {extra > 0 && <p className="text-[11px] text-subtle">+{extra} more</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <aside className={`${ui.card} p-4 flex flex-col min-h-0`}>
                <p className={ui.kicker}>{formatDayHeading(selected)}</p>
                <div className="mt-4 space-y-2 overflow-y-auto min-h-0">
                  {selectedItems.length === 0 && (
                    <div className="py-8 text-center">
                      <CalendarDays className="w-7 h-7 text-subtle mx-auto mb-2" />
                      <p className="text-sm text-fg font-medium">Nothing dated this day</p>
                      <p className="text-sm text-muted mt-1">
                        Task due dates, project due dates, and ledger entries show up here.
                      </p>
                    </div>
                  )}
                  {selectedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      className={`w-full text-left p-3 ${ui.cardHover}`}
                    >
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
                        {item.kind === 'task' && <SquareKanban className="w-3 h-3" />}
                        {item.kind === 'project' && <FolderKanban className="w-3 h-3" />}
                        {item.kind === 'finance' && <Wallet className="w-3 h-3" />}
                        {kindLabel[item.kind]}
                      </span>
                      <p className={`mt-1 text-sm font-medium ${item.overdue ? 'text-danger-fg' : 'text-fg'}`}>
                        {item.title}
                      </p>
                      {item.meta && <p className="text-[11px] text-muted mt-0.5">{item.meta}</p>}
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
