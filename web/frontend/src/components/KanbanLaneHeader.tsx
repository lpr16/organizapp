import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Trash2 } from 'lucide-react';
import type { BoardLane } from '../types/kanban';
import { InlineName } from './InlineName';
import { ui } from '../theme/ui';

interface Props {
  lane: BoardLane;
  canDelete: boolean;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
}

export const KanbanLaneHeader: React.FC<Props> = ({ lane, canDelete, onRename, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lane.id,
    data: { type: 'Lane', lane },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col justify-center gap-2 px-3 py-3 h-full ${isDragging ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="p-0.5 mt-0.5 text-subtle hover:text-fg cursor-grab active:cursor-grabbing"
          title="Drag to reorder lane"
          {...attributes}
          {...listeners}
        >
          <GripHorizontal className="w-3.5 h-3.5" />
        </button>
        <InlineName
          value={lane.name}
          onSave={onRename}
          className="font-semibold text-sm text-fg leading-snug"
        />
      </div>
      {canDelete && (
        <button type="button" onClick={onDelete} className={`${ui.iconBtnDanger} self-start`} title="Delete lane">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
