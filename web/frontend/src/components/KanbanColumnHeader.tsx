import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { BoardColumn } from '../types/kanban';
import { InlineName } from './InlineName';
import { ui } from '../theme/ui';

interface Props {
  column: BoardColumn;
  taskCount: number;
  canDelete: boolean;
  onRename: (name: string) => Promise<void>;
  onAddTask: () => void;
  onDelete: () => void;
}

export const KanbanColumnHeader: React.FC<Props> = ({
  column,
  taskCount,
  canDelete,
  onRename,
  onAddTask,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 px-2 py-2 min-h-[3rem] ${isDragging ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        className="p-0.5 text-subtle hover:text-fg cursor-grab active:cursor-grabbing"
        title="Drag to reorder column"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <InlineName
        value={column.name}
        onSave={onRename}
        className="font-semibold text-sm text-fg min-w-0 flex-1"
      />
      <span className="text-[11px] font-medium text-muted tabular-nums">{taskCount}</span>
      <button type="button" onClick={onAddTask} className={ui.iconBtn} title="Add task">
        <Plus className="w-3.5 h-3.5" />
      </button>
      {canDelete && (
        <button type="button" onClick={onDelete} className={ui.iconBtnDanger} title="Delete column">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
