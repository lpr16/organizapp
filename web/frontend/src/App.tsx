import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { Board, BoardColumn, Priority, TaskCard } from './types/kanban';
import { kanbanApi } from './api/client';
import { Header } from './components/Header';
import { KanbanColumnComponent } from './components/KanbanColumnComponent';
import { TaskModal } from './components/TaskModal';
import { NewColumnModal } from './components/NewColumnModal';
import { TaskCardComponent } from './components/TaskCardComponent';
import { Loader2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskCard | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>(undefined);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Drag overlay active task
  const [activeTask, setActiveTask] = useState<TaskCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kanbanApi.getBoard();
      setBoard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const findColumnOfTask = (taskId: string): BoardColumn | undefined => {
    return board?.columns.find((c) => c.tasks.some((t) => t.id === taskId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findColumnOfTask(active.id as string)?.tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumnOfTask(activeId);
    let targetCol = findColumnOfTask(overId);

    // If hovering directly over an empty column
    if (!targetCol) {
      targetCol = board.columns.find((c) => c.id === overId);
    }

    if (!sourceCol || !targetCol || sourceCol.id === targetCol.id) {
      return;
    }

    // Move task across columns in local state
    setBoard((prev) => {
      if (!prev) return null;

      const activeTaskItem = sourceCol.tasks.find((t) => t.id === activeId);
      if (!activeTaskItem) return prev;

      const newColumns = prev.columns.map((col) => {
        if (col.id === sourceCol.id) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== activeId),
          };
        }
        if (col.id === targetCol!.id) {
          const overIndex = col.tasks.findIndex((t) => t.id === overId);
          const newIndex = overIndex >= 0 ? overIndex : col.tasks.length;
          const movedTask = { ...activeTaskItem, columnId: targetCol!.id };
          const updatedTasks = [...col.tasks];
          updatedTasks.splice(newIndex, 0, movedTask);
          return {
            ...col,
            tasks: updatedTasks,
          };
        }
        return col;
      });

      return { ...prev, columns: newColumns };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let targetCol = findColumnOfTask(activeId);
    if (!targetCol) return;

    const oldIndex = targetCol.tasks.findIndex((t) => t.id === activeId);
    let newIndex = targetCol.tasks.findIndex((t) => t.id === overId);

    if (newIndex < 0) {
      // Over the column container itself
      newIndex = oldIndex >= 0 ? oldIndex : targetCol.tasks.length - 1;
    }

    if (oldIndex !== newIndex) {
      setBoard((prev) => {
        if (!prev) return null;
        const newColumns = prev.columns.map((col) => {
          if (col.id === targetCol!.id) {
            return {
              ...col,
              tasks: arrayMove(col.tasks, oldIndex, newIndex),
            };
          }
          return col;
        });
        return { ...prev, columns: newColumns };
      });
    }

    try {
      await kanbanApi.moveTask(activeId, targetCol.id, Math.max(0, newIndex));
    } catch (err) {
      console.error('Failed to sync move with server, reverting...', err);
      loadBoard();
    }
  };

  const handleSaveTask = async (data: {
    id?: string;
    columnId: string;
    title: string;
    description: string;
    priority: Priority;
    dueDate?: string;
  }) => {
    if (data.id) {
      // Update
      const updated = await kanbanApi.updateTask(data.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
      });
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t)),
          })),
        };
      });
    } else {
      // Create
      const created = await kanbanApi.createTask(data);
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === data.columnId) {
              return { ...col, tasks: [...col.tasks, created] };
            }
            return col;
          }),
        };
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await kanbanApi.deleteTask(taskId);
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleAddColumn = async (name: string) => {
    if (!board) return;
    const newCol = await kanbanApi.createColumn(board.id, name);
    setBoard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        columns: [...prev.columns, { ...newCol, tasks: [] }],
      };
    });
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await kanbanApi.deleteColumn(columnId);
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
        };
      });
    } catch (err) {
      console.error('Failed to delete column', err);
    }
  };

  const openNewTaskModal = (colId?: string) => {
    setEditingTask(null);
    setTargetColumnId(colId || (board?.columns[0]?.id));
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: TaskCard) => {
    setEditingTask(task);
    setTargetColumnId(task.columnId);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        board={board}
        onNewTask={() => openNewTaskModal()}
        onNewColumn={() => setIsColumnModalOpen(true)}
      />

      <main className="flex-1 overflow-x-auto p-6 flex flex-col">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Loading your Kanban workspace...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto my-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-100">Unable to Connect</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            <button
              onClick={loadBoard}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/20"
            >
              Retry Connection
            </button>
          </div>
        )}

        {!loading && !error && board && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5 pb-6 items-start">
              {board.columns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  onAddTask={openNewTaskModal}
                  onEditTask={openEditTaskModal}
                  onDeleteTask={handleDeleteTask}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}

              <button
                onClick={() => setIsColumnModalOpen(true)}
                className="w-80 shrink-0 h-32 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/30 rounded-2xl text-xs font-medium text-slate-400 hover:text-indigo-400 transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 group-hover:bg-indigo-600/20 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition">
                  +
                </div>
                <span>Add another column</span>
              </button>
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="w-80 shadow-2xl opacity-90 scale-102">
                  <TaskCardComponent
                    task={activeTask}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        columns={board?.columns || []}
        defaultColumnId={targetColumnId}
      />

      <NewColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onAdd={handleAddColumn}
      />
    </div>
  );
};

export default App;
