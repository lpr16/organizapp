import React from 'react';
import { Layers, Plus, Columns, CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import type { Board } from '../types/kanban';

interface Props {
  board: Board | null;
  onNewTask: () => void;
  onNewColumn: () => void;
}

export const Header: React.FC<Props> = ({ board, onNewTask, onNewColumn }) => {
  const totalTasks = board?.columns.reduce((sum, col) => sum + col.tasks.length, 0) || 0;
  
  const inProgressTasks = board?.columns
    .filter((col) => col.name.toLowerCase().includes('progress'))
    .reduce((sum, col) => sum + col.tasks.length, 0) || 0;

  const doneTasks = board?.columns
    .filter((col) => col.name.toLowerCase().includes('done') || col.name.toLowerCase().includes('complete'))
    .reduce((sum, col) => sum + col.tasks.length, 0) || 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand & Board Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                OrganizApp
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                Personal
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {board?.name || 'Loading workspace...'}
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="hidden md:flex items-center gap-5 px-4 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Total: <strong className="text-slate-200">{totalTasks}</strong></span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Active: <strong className="text-sky-300">{inProgressTasks}</strong></span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed: <strong className="text-emerald-300">{doneTasks}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={onNewColumn}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition shadow-sm"
          >
            <Columns className="w-3.5 h-3.5 text-slate-400" />
            Add Column
          </button>
          <button
            onClick={onNewTask}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>
    </header>
  );
};
