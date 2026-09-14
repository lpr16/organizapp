import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2 } from 'lucide-react';
import type { BoardColumn, TaskCard } from '../types/kanban';
import { TaskCardComponent } from './TaskCardComponent';

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
    <div className="flex flex-col w-80 shrink-0 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 max-h-[calc(100vh-140px)] shadow-lg backdrop-blur-sm">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-slate-200 tracking-tight">
            {column.name}
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTask(column.id)}
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
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
            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            title="Delete column"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Droppable Task List */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2.5 p-1 rounded-xl transition-colors duration-150 min-h-32 ${
          isOver ? 'bg-indigo-950/20 ring-2 ring-indigo-500/40' : ''
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
          <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500 text-center px-4">
            <span>Drop tasks here or</span>
            <button
              onClick={() => onAddTask(column.id)}
              className="text-indigo-400 hover:underline mt-1 font-medium"
            >
              + Add a new task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
