import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { BoardColumn, BoardLane, TaskCard } from '../types/kanban';
import { TaskCardComponent } from './TaskCardComponent';

interface Props {
  column: BoardColumn;
  lane: BoardLane;
  tasks: TaskCard[];
  onAddTask: (columnId: string, laneId: string) => void;
  onEditTask: (task: TaskCard) => void;
  onDeleteTask: (id: string) => void;
}

export const cellId = (columnId: string, laneId: string) => `cell:${columnId}:${laneId}`;

export const KanbanCell: React.FC<Props> = ({
  column,
  lane,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: cellId(column.id, lane.id),
    data: { type: 'Cell', columnId: column.id, laneId: lane.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[9rem] h-full p-2 space-y-2 ${isOver ? 'bg-surface-muted' : ''}`}
    >
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <TaskCardComponent
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
      </SortableContext>

      {tasks.length === 0 && (
        <button
          type="button"
          onClick={() => onAddTask(column.id, lane.id)}
          className="w-full min-h-20 text-xs text-muted hover:text-fg"
        >
          Drop a card or add one
        </button>
      )}

      {tasks.length > 0 && (
        <button
          type="button"
          onClick={() => onAddTask(column.id, lane.id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg px-1 py-1"
        >
          <Plus className="w-3 h-3" />
          Add card
        </button>
      )}
    </div>
  );
};
