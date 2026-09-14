import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  Loader2,
  SquareKanban,
  Wallet,
} from 'lucide-react';
import { financeApi, kanbanApi, projectApi } from '../api/client';
import { formatCents, localDateIso } from '../finance/money';
import {
  addDays,
  addMonths,
  addYears,
  clampToMonth,
  formatDayHeading,
  isoFromDate,
  isoRange,
  monthCells,
  monthKey,
  monthLabels,
  monthTitle,
  parseIso,
  startOfMonth,
  weekCells,
  weekdayLabels,
  weekdayLetters,
  weekTitle,
  yearMonthStarts,
  yearOptions,
} from '../calendar/dates';
import type { Board, FinanceTransaction, Project } from '../types/kanban';
import { ui } from '../theme/ui';

type Kind = 'task' | 'project' | 'finance';
type KindFilter = 'ALL' | Kind;
type CalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda';

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind: Kind;
  href: string;
  meta?: string;
  overdue?: boolean;
};

const VIEWS: CalendarView[] = ['day', 'week', 'month', 'year', 'agenda'];
const VIEW_LABEL: Record<CalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  agenda: 'Agenda',
};

const kindLabel: Record<Kind, string> = {
  task: 'Task',
  project: 'Project',
  finance: 'Finance',
};

const kindIcon = {
  task: SquareKanban,
  project: FolderKanban,
  finance: Wallet,
};

const kindDot: Record<Kind, string> = {
  task: 'bg-badge-high-fg',
  project: 'bg-badge-medium-fg',
  finance: 'bg-accent',
};

const parseView = (raw: string | null): CalendarView =>
  VIEWS.includes(raw as CalendarView) ? (raw as CalendarView) : 'month';

const parseDateParam = (raw: string | null, fallback: string): string =>
  raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;

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

const EventRow: React.FC<{
  item: CalendarEvent;
  compact?: boolean;
  onOpen: (href: string) => void;
}> = ({ item, compact, onOpen }) => {
  const Icon = kindIcon[item.kind];
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item.href);
      }}
      className={`w-full text-left ${compact ? 'px-1.5 py-1 rounded-md hover:bg-surface-muted' : `p-3 ${ui.cardHover}`}`}
    >
      {compact ? (
        <span className="flex items-start gap-1.5 min-w-0">
          <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${kindDot[item.kind]}`} />
          <span
            className={`text-[11px] leading-snug truncate font-medium ${
              item.overdue ? 'text-danger-fg' : 'text-fg'
            }`}
          >
            {item.title}
          </span>
        </span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
            <Icon className="w-3 h-3" />
            {kindLabel[item.kind]}
          </span>
          <p className={`mt-1 text-sm font-medium ${item.overdue ? 'text-danger-fg' : 'text-fg'}`}>{item.title}</p>
          {item.meta && <p className="text-[11px] text-muted mt-0.5">{item.meta}</p>}
        </>
      )}
    </button>
  );
};

const MiniMonth: React.FC<{
  monthStart: Date;
  today: string;
  selected: string;
  byDate: Map<string, CalendarEvent[]>;
  letters: string[];
  embedded?: boolean;
  onSelectDay: (iso: string) => void;
  onSelectMonth: (iso: string) => void;
}> = ({ monthStart, today, selected, byDate, letters, embedded, onSelectDay, onSelectMonth }) => {
  const cells = monthCells(monthStart);
  const key = monthKey(monthStart);
  const isSelectedMonth = selected.startsWith(key);
  const label = monthStart.toLocaleDateString(undefined, { month: 'long' });

  return (
    <div
      className={`${embedded ? '' : `${ui.card} p-3`} ${
        !embedded && isSelectedMonth ? 'border-border-strong bg-surface-muted' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onSelectMonth(selected.startsWith(key) ? selected : `${key}-01`)}
        className="text-sm font-medium text-fg px-1 py-0.5 rounded-md hover:bg-surface-muted"
      >
        {label}
      </button>
      <div className="mt-2 grid grid-cols-7 gap-y-0.5">
        {letters.map((letter, index) => (
          <div key={`${letter}-${index}`} className="text-[10px] text-muted text-center">
            {letter}
          </div>
        ))}
        {cells.map((cell) => {
          if (!cell.inMonth) {
            return <div key={cell.iso} />;
          }
          const items = byDate.get(cell.iso) ?? [];
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selected;
          const kinds = [...new Set(items.map((item) => item.kind))].slice(0, 3);
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDay(cell.iso)}
              className="flex flex-col items-center gap-0.5 py-0.5 rounded-md hover:bg-surface"
            >
              <span
                className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-[11px] ${
                  isToday
                    ? 'bg-accent text-accent-fg'
                    : isSelected
                      ? 'bg-surface-muted text-fg ring-1 ring-border-strong'
                      : 'text-fg'
                }`}
              >
                {cell.day}
              </span>
              <span className="h-1 flex items-center gap-0.5">
                {kinds.map((kind) => (
                  <span key={kind} className={`w-1 h-1 rounded-full ${kindDot[kind]}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const selectClass =
  'px-3 py-1.5 pr-8 bg-surface border border-border rounded-md text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shrink-0';

const chipClass = (active: boolean) =>
  `px-3 py-1.5 text-sm font-medium rounded-md border ${
    active
      ? 'bg-accent text-accent-fg border-accent'
      : 'text-muted border-border bg-surface hover:bg-surface-muted hover:text-fg'
  }`;

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = localDateIso();
  const [selected, setSelected] = useState(() => parseDateParam(searchParams.get('date'), today));
  const [view, setView] = useState<CalendarView>(() => parseView(searchParams.get('view')));
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

  useEffect(() => {
    setSearchParams({ view, date: selected }, { replace: true });
  }, [view, selected, setSearchParams]);

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

  const selectedDate = useMemo(() => parseIso(selected), [selected]);
  const monthCursor = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
  const cells = useMemo(() => monthCells(monthCursor), [monthCursor]);
  const week = useMemo(() => weekCells(selectedDate), [selectedDate]);
  const weekdays = useMemo(() => weekdayLabels(), []);
  const letters = useMemo(() => weekdayLetters(), []);
  const months = useMemo(() => monthLabels(), []);
  const yearStarts = useMemo(() => yearMonthStarts(selectedDate.getFullYear()), [selectedDate]);
  const years = useMemo(() => {
    const eventYears = events.map((item) => Number(item.date.slice(0, 4)));
    return yearOptions(selectedDate.getFullYear(), eventYears, new Date().getFullYear());
  }, [events, selectedDate]);

  const overdueItems = useMemo(
    () => visibleEvents.filter((item) => item.overdue).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
    [visibleEvents]
  );

  const agendaDays = useMemo(() => isoRange(selected < today ? today : selected, 28), [selected, today]);

  const jumpTo = useCallback((iso: string) => {
    setSelected(iso);
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (view === 'day') {
        jumpTo(isoFromDate(addDays(selectedDate, delta)));
        return;
      }
      if (view === 'week' || view === 'agenda') {
        jumpTo(isoFromDate(addDays(selectedDate, delta * 7)));
        return;
      }
      if (view === 'year') {
        jumpTo(clampToMonth(selectedDate.getFullYear() + delta, selectedDate.getMonth(), selectedDate.getDate()));
        return;
      }
      const currentDay = selectedDate.getDate();
      const next = addMonths(selectedDate, delta);
      jumpTo(clampToMonth(next.getFullYear(), next.getMonth(), currentDay));
    },
    [jumpTo, selectedDate, view]
  );

  const jumpYears = (delta: number) => {
    const next = addYears(selectedDate, delta);
    jumpTo(clampToMonth(next.getFullYear(), next.getMonth(), selectedDate.getDate()));
  };

  const goToday = () => jumpTo(today);

  const openMonth = (iso: string) => {
    jumpTo(iso);
    setView('month');
  };

  const openDay = (iso: string) => {
    jumpTo(iso);
    setView('day');
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const title =
    view === 'day'
      ? formatDayHeading(selected)
      : view === 'week'
        ? weekTitle(selectedDate)
        : view === 'year'
          ? String(selectedDate.getFullYear())
          : view === 'agenda'
            ? 'Agenda'
            : monthTitle(monthCursor);
  const stepBackLabel =
    view === 'day'
      ? 'Previous day'
      : view === 'week' || view === 'agenda'
        ? 'Previous week'
        : view === 'year'
          ? 'Previous year'
          : 'Previous month';
  const stepForwardLabel =
    view === 'day'
      ? 'Next day'
      : view === 'week' || view === 'agenda'
        ? 'Next week'
        : view === 'year'
          ? 'Next year'
          : 'Next month';

  const showAside = view !== 'agenda';

  const renderDayList = (iso: string, emptyCopy: string, compact = false) => {
    const items = byDate.get(iso) ?? [];
    if (items.length === 0) {
      return compact ? null : (
        <div className="py-8 text-center">
          <CalendarDays className="w-7 h-7 text-subtle mx-auto mb-2" />
          <p className="text-sm text-fg font-medium">Nothing dated this day</p>
          <p className="text-sm text-muted mt-1">{emptyCopy}</p>
        </div>
      );
    }
    return items.map((item) => (
      <EventRow key={item.id} item={item} compact={compact} onOpen={(href) => navigate(href)} />
    ));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className={ui.kicker}>Dated work</p>
              <h1 className={ui.title}>{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {VIEWS.map((value) => (
                <button key={value} type="button" onClick={() => setView(value)} className={chipClass(view === value)}>
                  {VIEW_LABEL[value]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => step(-1)} className={ui.btnSecondary} title={stepBackLabel}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              aria-label="Month"
              value={selectedDate.getMonth()}
              onChange={(event) =>
                jumpTo(clampToMonth(selectedDate.getFullYear(), Number(event.target.value), selectedDate.getDate()))
              }
              className={`${selectClass} w-40`}
            >
              {months.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Year"
              value={selectedDate.getFullYear()}
              onChange={(event) =>
                jumpTo(clampToMonth(Number(event.target.value), selectedDate.getMonth(), selectedDate.getDate()))
              }
              className={`${selectClass} w-24`}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => step(1)} className={ui.btnSecondary} title={stepForwardLabel}>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => jumpYears(-10)} className={ui.btnSecondary} title="Jump back 10 years">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => jumpYears(10)} className={ui.btnSecondary} title="Jump forward 10 years">
              <ChevronsRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={goToday} className={ui.btnSecondary}>
              Today
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 min-h-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'task', 'project', 'finance'] as KindFilter[]).map((value) => (
              <button key={value} type="button" onClick={() => setKindFilter(value)} className={chipClass(kindFilter === value)}>
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
            <div className={`grid gap-5 min-h-0 flex-1 ${showAside ? 'lg:grid-cols-[1fr_20rem]' : ''}`}>
              <div className={`${ui.card} overflow-hidden flex flex-col min-h-0`}>
                {view === 'month' && (
                  <>
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
                          <div
                            key={cell.iso}
                            onClick={() => jumpTo(cell.iso)}
                            onDoubleClick={() => openDay(cell.iso)}
                            className={`min-h-24 p-2 text-left border-b border-r border-border cursor-pointer ${
                              isSelected ? 'bg-surface-muted' : 'bg-surface hover:bg-surface-muted/40'
                            } ${!cell.inMonth ? 'opacity-40' : ''}`}
                          >
                            <button
                              type="button"
                              onClick={() => jumpTo(cell.iso)}
                              onDoubleClick={() => openDay(cell.iso)}
                              className={`inline-flex w-6 h-6 items-center justify-center rounded-md text-xs font-medium ${
                                isToday ? 'bg-accent text-accent-fg' : 'text-fg hover:bg-surface-muted'
                              }`}
                            >
                              {cell.day}
                            </button>
                            <div className="mt-1 space-y-0.5">
                              {preview.map((item) => (
                                <EventRow
                                  key={item.id}
                                  item={item}
                                  compact
                                  onOpen={(href) => navigate(href)}
                                />
                              ))}
                              {extra > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openDay(cell.iso)}
                                  className="text-[11px] text-subtle hover:text-muted px-1.5"
                                >
                                  +{extra} more
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {view === 'week' && (
                  <div className="overflow-x-auto flex-1 min-h-0">
                    <div className="grid grid-cols-7 min-w-[56rem] lg:min-w-0 h-full min-h-[32rem] auto-rows-fr">
                      {week.map((cell, index) => {
                        const isToday = cell.iso === today;
                        const isSelected = cell.iso === selected;
                        const kinds = [...new Set((byDate.get(cell.iso) ?? []).map((item) => item.kind))].slice(0, 3);
                        return (
                          <div
                            key={cell.iso}
                            onClick={() => jumpTo(cell.iso)}
                            onDoubleClick={() => openDay(cell.iso)}
                            className={`flex flex-col min-h-0 border-r border-border last:border-r-0 cursor-pointer ${
                              isSelected ? 'bg-surface-muted' : 'bg-surface hover:bg-surface-muted/40'
                            }`}
                          >
                            <div className="px-3 py-3 text-left border-b border-border">
                              <p className="text-[11px] uppercase tracking-wider text-muted font-medium">
                                {weekdays[index]}
                              </p>
                              <button
                                type="button"
                                aria-label={formatDayHeading(cell.iso)}
                                onClick={() => jumpTo(cell.iso)}
                                className={`mt-1 inline-flex w-7 h-7 items-center justify-center rounded-md text-sm font-medium ${
                                  isToday ? 'bg-accent text-accent-fg' : 'text-fg hover:bg-surface'
                                }`}
                              >
                                {cell.day}
                              </button>
                              <span className="mt-1 flex items-center gap-0.5 min-h-1">
                                {kinds.map((kind) => (
                                  <span key={kind} className={`w-1.5 h-1.5 rounded-full ${kindDot[kind]}`} />
                                ))}
                              </span>
                            </div>
                            <div className="flex-1 p-2 space-y-1 overflow-y-auto min-h-0">
                              {renderDayList(cell.iso, '', true) ?? (
                                <p className="px-1.5 py-2 text-[11px] text-subtle">No items</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === 'day' && (
                  <div className="flex flex-col min-h-0 flex-1">
                    <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
                      {week.map((cell, index) => {
                        const isToday = cell.iso === today;
                        const isSelected = cell.iso === selected;
                        const kinds = [...new Set((byDate.get(cell.iso) ?? []).map((item) => item.kind))].slice(0, 3);
                        return (
                          <button
                            key={cell.iso}
                            type="button"
                            onClick={() => jumpTo(cell.iso)}
                            className={`px-2 py-2 text-center ${isSelected ? 'bg-surface' : 'hover:bg-surface'}`}
                          >
                            <p className="text-[11px] uppercase tracking-wider text-muted font-medium">
                              {weekdays[index]}
                            </p>
                            <span
                              className={`mt-1 inline-flex w-7 h-7 items-center justify-center rounded-md text-sm font-medium ${
                                isToday
                                  ? 'bg-accent text-accent-fg'
                                  : isSelected
                                    ? 'bg-surface text-fg ring-1 ring-border-strong'
                                    : 'text-fg'
                              }`}
                            >
                              {cell.day}
                            </span>
                            <span className="mt-1 flex items-center justify-center gap-0.5 min-h-1">
                              {kinds.map((kind) => (
                                <span key={kind} className={`w-1.5 h-1.5 rounded-full ${kindDot[kind]}`} />
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-4 space-y-2 overflow-y-auto min-h-0 flex-1">
                      {renderDayList(
                        selected,
                        'Task due dates, project due dates, and ledger entries show up here.'
                      )}
                    </div>
                  </div>
                )}

                {view === 'year' && (
                  <div className="p-4 overflow-y-auto min-h-0 flex-1">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {yearStarts.map((monthStart) => (
                        <MiniMonth
                          key={monthKey(monthStart)}
                          monthStart={monthStart}
                          today={today}
                          selected={selected}
                          byDate={byDate}
                          letters={letters}
                          onSelectMonth={jumpTo}
                          onSelectDay={jumpTo}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {view === 'agenda' && (
                  <div className="p-4 space-y-6 overflow-y-auto min-h-[24rem] flex-1">
                    {overdueItems.length > 0 && (
                      <section className="space-y-2">
                        <p className={ui.kicker}>Overdue</p>
                        {overdueItems.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <p className="text-[11px] text-danger-fg">{formatDayHeading(item.date)}</p>
                            <EventRow item={item} onOpen={(href) => navigate(href)} />
                          </div>
                        ))}
                      </section>
                    )}
                    <section className="space-y-4">
                      <p className={ui.kicker}>Coming up</p>
                      {agendaDays.map((iso) => {
                        const items = byDate.get(iso) ?? [];
                        if (items.length === 0) return null;
                        return (
                          <div key={iso} className="space-y-2">
                            <button
                              type="button"
                              onClick={() => openDay(iso)}
                              className="text-sm font-medium text-fg hover:underline"
                            >
                              {formatDayHeading(iso)}
                              {iso === today ? ' · Today' : ''}
                            </button>
                            {items.map((item) => (
                              <EventRow key={item.id} item={item} onOpen={(href) => navigate(href)} />
                            ))}
                          </div>
                        );
                      })}
                      {agendaDays.every((iso) => (byDate.get(iso) ?? []).length === 0) && overdueItems.length === 0 && (
                        <div className="py-8 text-center">
                          <CalendarDays className="w-7 h-7 text-subtle mx-auto mb-2" />
                          <p className="text-sm text-fg font-medium">Nothing coming up</p>
                          <p className="text-sm text-muted mt-1">
                            Dated tasks, projects, and ledger entries for the next four weeks show up here.
                          </p>
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>

              {showAside && (
                <aside className={`${ui.card} p-4 flex flex-col min-h-0`}>
                  {view === 'day' ? (
                    <div className="space-y-4 overflow-y-auto min-h-0">
                      <MiniMonth
                        monthStart={monthCursor}
                        today={today}
                        selected={selected}
                        byDate={byDate}
                        letters={letters}
                        embedded
                        onSelectMonth={jumpTo}
                        onSelectDay={jumpTo}
                      />
                      <button
                        type="button"
                        onClick={() => setView('month')}
                        className={`${ui.btnGhost} w-full text-center`}
                      >
                        Open month view
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={ui.kicker}>{formatDayHeading(selected)}</p>
                      <div className="mt-4 space-y-2 overflow-y-auto min-h-0">
                        {renderDayList(
                          selected,
                          'Task due dates, project due dates, and ledger entries show up here.'
                        )}
                        <button
                          type="button"
                          onClick={() => setView('day')}
                          className={`${ui.btnGhost} w-full text-center`}
                        >
                          Open day view
                        </button>
                        {view === 'year' && (
                          <button
                            type="button"
                            onClick={() => openMonth(selected)}
                            className={`${ui.btnGhost} w-full text-center`}
                          >
                            Open month view
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </aside>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
