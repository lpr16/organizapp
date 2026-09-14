import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Trash2, Edit3, GripVertical, AlertCircle, AlertTriangle, ArrowDown, Flame } from 'lucide-react';
import type { Priority, TaskCard } from '../types/kanban';

interface Props {
  task: TaskCard;
  onEdit: (task: TaskCard) => void;
  onDelete: (id: string) => void;
}

const priorityConfig: Record<Priority, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  URGENT: {
    label: 'Urgent',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    icon: <Flame className="w-3 h-3 mr-1" />,
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: <AlertTriangle className="w-3 h-3 mr-1" />,
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
    icon: <AlertCircle className="w-3 h-3 mr-1" />,
  },
  LOW: {
    label: 'Low',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    icon: <ArrowDown className="w-3 h-3 mr-1" />,
  },
};

export const TaskCardComponent: React.FC<Props> = ({ task, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 shadow-sm hover:border-slate-700/80 hover:shadow-md transition-all duration-150 ${
        isDragging ? 'opacity-40 ring-2 ring-indigo-500 rotate-1 scale-102 z-50 shadow-2xl' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md border ${priority.bg} ${priority.text} ${priority.border}`}
          >
            {priority.icon}
            {priority.label}
          </span>
          {task.dueDate && (
            <span className="inline-flex items-center text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              {task.dueDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
            title="Edit task"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div
            {...attributes}
            {...listeners}
            className="p-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing rounded"
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <h4 className="mt-2 text-sm font-medium text-slate-100 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}
    </div>
  );
};
