import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2 } from 'lucide-react';
import type { BoardColumn, TaskCard } from '../types/kanban';
import { TaskCardComponent } from './TaskCardComponent';
import { ui } from '../theme/ui';

interface Props {
  column: BoardColumn;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: TaskCard) => void;
  onDeleteTask: (id: string) => void;
  onDeleteColumn: (id: string) => void;
}

export const KanbanColumnComponent: React.FC<Props> = ({
  column,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDeleteColumn,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div className="flex flex-col w-80 shrink-0 bg-surface-muted border border-border rounded-lg p-3 max-h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between px-1 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-fg">
            {column.name}
          </h3>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-surface text-muted border border-border">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTask(column.id)}
            className={ui.iconBtn}
            title="Add task to this column"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete column "${column.name}" and all its tasks?`)) {
                onDeleteColumn(column.id);
              }
            }}
            className={ui.iconBtnDanger}
            title="Delete column"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2 p-1 rounded-md min-h-32 ${
          isOver ? 'bg-border' : ''
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCardComponent
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-28 border border-dashed border-border rounded-md text-xs text-muted text-center px-4 bg-surface">
            <span>Drop tasks here or</span>
            <button
              onClick={() => onAddTask(column.id)}
              className="text-fg hover:underline mt-1 font-medium"
            >
              + Add a new task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
