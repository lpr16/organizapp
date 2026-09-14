import React from 'react';
import { Plus, Columns, CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import type { Board } from '../types/kanban';
import { ui } from '../theme/ui';

interface Props {
  board: Board | null;
  onNewTask: () => void;
  onNewColumn: () => void;
  onNewLane: () => void;
}

export const Header: React.FC<Props> = ({ board, onNewTask, onNewColumn, onNewLane }) => {
  const totalTasks = board?.columns.reduce((sum, col) => sum + col.tasks.length, 0) || 0;

  const inProgressTasks = board?.columns
    .filter((col) => col.name.toLowerCase().includes('progress'))
    .reduce((sum, col) => sum + col.tasks.length, 0) || 0;

  const doneTasks = board?.columns
    .filter((col) => col.name.toLowerCase().includes('done') || col.name.toLowerCase().includes('complete'))
    .reduce((sum, col) => sum + col.tasks.length, 0) || 0;

  return (
    <header className={ui.pageHeader}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <p className={ui.kicker}>Kanban board</p>
          <h1 className={ui.title}>
            {board?.name || 'Loading workspace...'}
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-5 px-3 py-1.5 bg-surface-muted border border-border rounded-md text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-subtle" />
            <span>Total: <strong className="text-fg font-medium">{totalTasks}</strong></span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-subtle" />
            <span>Active: <strong className="text-fg font-medium">{inProgressTasks}</strong></span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-subtle" />
            <span>Completed: <strong className="text-fg font-medium">{doneTasks}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button onClick={onNewLane} className={ui.btnSecondary}>
            Add Lane
          </button>
          <button onClick={onNewColumn} className={ui.btnSecondary}>
            <Columns className="w-3.5 h-3.5 text-muted" />
            Add Column
          </button>
          <button onClick={onNewTask} className={ui.btnPrimary}>
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>
    </header>
  );
};
