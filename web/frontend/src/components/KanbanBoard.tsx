import React from 'react';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Board, BoardColumn, BoardLane, TaskCard } from '../types/kanban';
import { KanbanColumnHeader } from './KanbanColumnHeader';
import { KanbanLaneHeader } from './KanbanLaneHeader';
import { KanbanCell } from './KanbanCell';
import { ui } from '../theme/ui';

interface Props {
  board: Board;
  onAddColumn: () => void;
  onAddLane: () => void;
  onRenameColumn: (columnId: string, name: string) => Promise<void>;
  onRenameLane: (laneId: string, name: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => void;
  onDeleteLane: (laneId: string) => void;
  projectNames?: Record<string, string>;
  onAddTask: (columnId: string, laneId: string) => void;
  onEditTask: (task: TaskCard) => void;
  onDeleteTask: (id: string) => void;
}

const tasksIn = (column: BoardColumn, lane: BoardLane): TaskCard[] =>
  column.tasks.filter((task) => task.laneId === lane.id);

export const KanbanBoard: React.FC<Props> = ({
  board,
  onAddColumn,
  onAddLane,
  onRenameColumn,
  onRenameLane,
  onDeleteColumn,
  onDeleteLane,
  projectNames = {},
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const columnCount = board.columns.length;
  const canDeleteColumn = columnCount > 1;
  const canDeleteLane = board.lanes.length > 1;

  return (
    <div className="w-full pb-8">
      <div className="border border-border rounded-lg bg-surface overflow-hidden min-w-max w-full">
        <div className="flex border-b border-border bg-surface-muted/60">
          <div className="w-44 shrink-0 border-r border-border px-3 py-3 text-[11px] uppercase tracking-wider text-muted font-medium">
            Lanes
          </div>
          <SortableContext items={board.columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {board.columns.map((column, index) => (
              <div
                key={column.id}
                className={`min-w-72 flex-1 ${index > 0 ? 'border-l border-border' : ''}`}
              >
                <KanbanColumnHeader
                  column={column}
                  taskCount={column.tasks.length}
                  canDelete={canDeleteColumn}
                  onRename={(name) => onRenameColumn(column.id, name)}
                  onAddTask={() => onAddTask(column.id, board.lanes[0]?.id ?? '')}
                  onDelete={() => {
                    if (confirm(`Delete column "${column.name}" and all its tasks?`)) {
                      onDeleteColumn(column.id);
                    }
                  }}
                />
              </div>
            ))}
          </SortableContext>
          <div className="w-16 shrink-0 border-l border-border flex items-center justify-center">
            <button type="button" onClick={onAddColumn} className={ui.iconBtn} title="Add column">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <SortableContext items={board.lanes.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {board.lanes.map((lane, laneIndex) => (
            <div
              key={lane.id}
              className={`flex ${laneIndex > 0 ? 'border-t border-border' : ''}`}
            >
              <div className="w-44 shrink-0 border-r border-border bg-surface-muted/40">
                <KanbanLaneHeader
                  lane={lane}
                  canDelete={canDeleteLane}
                  onRename={(name) => onRenameLane(lane.id, name)}
                  onDelete={() => {
                    if (confirm(`Delete lane "${lane.name}" and all cards in it?`)) {
                      onDeleteLane(lane.id);
                    }
                  }}
                />
              </div>
              {board.columns.map((column, index) => (
                <div
                  key={`${lane.id}-${column.id}`}
                  className={`min-w-72 flex-1 ${index > 0 ? 'border-l border-border' : ''}`}
                >
                  <KanbanCell
                    column={column}
                    lane={lane}
                    tasks={tasksIn(column, lane)}
                    projectNames={projectNames}
                    onAddTask={onAddTask}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                  />
                </div>
              ))}
              <div className="w-16 shrink-0 border-l border-border" />
            </div>
          ))}
        </SortableContext>

        <div className="flex border-t border-border">
          <div className="w-44 shrink-0 border-r border-border p-2">
            <button type="button" onClick={onAddLane} className="w-full text-sm text-muted hover:text-fg py-2">
              + Add lane
            </button>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
};
