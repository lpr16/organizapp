import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Trash2, Edit3, GripVertical, AlertCircle, AlertTriangle, ArrowDown, Flame } from 'lucide-react';
import type { Priority, TaskCard } from '../types/kanban';
import { ui } from '../theme/ui';

interface Props {
  task: TaskCard;
  onEdit: (task: TaskCard) => void;
  onDelete: (id: string) => void;
}

const priorityConfig: Record<Priority, { label: string; tone: string; icon: React.ReactNode }> = {
  URGENT: {
    label: 'Urgent',
    tone: 'bg-badge-urgent text-badge-urgent-fg',
    icon: <Flame className="w-3 h-3 mr-1" />,
  },
  HIGH: {
    label: 'High',
    tone: 'bg-badge-high text-badge-high-fg',
    icon: <AlertTriangle className="w-3 h-3 mr-1" />,
  },
  MEDIUM: {
    label: 'Medium',
    tone: 'bg-badge-medium text-badge-medium-fg',
    icon: <AlertCircle className="w-3 h-3 mr-1" />,
  },
  LOW: {
    label: 'Low',
    tone: 'bg-badge-low text-badge-low-fg',
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
      className={`group relative p-3 ${ui.cardHover} ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${priority.tone}`}
          >
            {priority.icon}
            {priority.label}
          </span>
          {task.dueDate && (
            <span className="inline-flex items-center text-xs text-muted bg-surface-muted px-2 py-0.5 rounded border border-border">
              <Calendar className="w-3 h-3 mr-1" />
              {task.dueDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className={ui.iconBtn}
            title="Edit task"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className={ui.iconBtnDanger}
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div
            {...attributes}
            {...listeners}
            className="p-1 text-subtle hover:text-fg cursor-grab active:cursor-grabbing rounded"
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <h4 className="mt-2 text-sm font-medium text-fg leading-snug line-clamp-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}
    </div>
  );
};
