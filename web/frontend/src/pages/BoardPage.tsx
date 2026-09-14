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
import type { Board, Priority, Project, TaskCard } from '../types/kanban';
import { kanbanApi, projectApi } from '../api/client';
import { Header } from '../components/Header';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { NewColumnModal } from '../components/NewColumnModal';
import { TaskCardComponent } from '../components/TaskCardComponent';
import { Loader2, AlertCircle } from 'lucide-react';
import { ui } from '../theme/ui';

type DragKind = 'Task' | 'Column' | 'Lane';

const cellFromId = (id: string): { columnId: string; laneId: string } | null => {
  if (!id.startsWith('cell:')) return null;
  const parts = id.split(':');
  if (parts.length !== 3) return null;
  return { columnId: parts[1], laneId: parts[2] };
};

export const BoardPage: React.FC = () => {
  const [board, setBoard] = useState<Board | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskCard | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>(undefined);
  const [targetLaneId, setTargetLaneId] = useState<string | undefined>(undefined);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isLaneModalOpen, setIsLaneModalOpen] = useState(false);
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
      const [data, projectData] = await Promise.all([kanbanApi.getBoard(), projectApi.listProjects()]);
      setBoard(data);
      setProjects(projectData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const findTask = (taskId: string): TaskCard | undefined => {
    for (const column of board?.columns ?? []) {
      const task = column.tasks.find((item) => item.id === taskId);
      if (task) return task;
    }
    return undefined;
  };

  const locateOver = (
    overId: string,
    overData?: { type?: string; columnId?: string; laneId?: string; task?: TaskCard }
  ): { columnId: string; laneId: string } | null => {
    if (overData?.type === 'Cell' && overData.columnId && overData.laneId) {
      return { columnId: overData.columnId, laneId: overData.laneId };
    }
    if (overData?.type === 'Task' && overData.task) {
      return { columnId: overData.task.columnId, laneId: overData.task.laneId };
    }
    const cell = cellFromId(overId);
    if (cell) return cell;
    const overTask = findTask(overId);
    if (overTask) return { columnId: overTask.columnId, laneId: overTask.laneId };
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const kind = event.active.data.current?.type as DragKind | undefined;
    if (kind === 'Task') {
      setActiveTask(findTask(event.active.id as string) ?? null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;
    if (active.data.current?.type !== 'Task') return;

    const activeId = active.id as string;
    const activeTaskItem = findTask(activeId);
    if (!activeTaskItem) return;

    const target = locateOver(over.id as string, over.data.current as {
      type?: string;
      columnId?: string;
      laneId?: string;
      task?: TaskCard;
    });
    if (!target) return;
    if (activeTaskItem.columnId === target.columnId && activeTaskItem.laneId === target.laneId) {
      return;
    }

    setBoard((prev) => {
      if (!prev) return null;
      const overTask = findTask(over.id as string);
      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === activeTaskItem.columnId && col.id === target.columnId) {
            const without = col.tasks.filter((t) => t.id !== activeId);
            const moved = { ...activeTaskItem, columnId: target.columnId, laneId: target.laneId };
            const overIndex = without.findIndex((t) => t.id === overTask?.id && t.laneId === target.laneId);
            const insertAt = overIndex >= 0 ? overIndex : without.length;
            const next = [...without];
            next.splice(insertAt, 0, moved);
            return { ...col, tasks: next };
          }
          if (col.id === activeTaskItem.columnId) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
          }
          if (col.id === target.columnId) {
            const moved = { ...activeTaskItem, columnId: target.columnId, laneId: target.laneId };
            const overIndex = col.tasks.findIndex((t) => t.id === overTask?.id);
            const insertAt = overIndex >= 0 ? overIndex : col.tasks.length;
            const next = [...col.tasks];
            next.splice(insertAt, 0, moved);
            return { ...col, tasks: next };
          }
          return col;
        }),
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !board) return;

    const kind = active.data.current?.type as DragKind | undefined;
    const activeId = active.id as string;
    const overId = over.id as string;

    if (kind === 'Column') {
      const oldIndex = board.columns.findIndex((c) => c.id === activeId);
      const newIndex = board.columns.findIndex((c) => c.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const next = arrayMove(board.columns, oldIndex, newIndex);
      setBoard({ ...board, columns: next });
      try {
        await kanbanApi.reorderColumns(
          board.id,
          next.map((c) => c.id)
        );
      } catch (err) {
        console.error('Failed to reorder columns', err);
        loadBoard();
      }
      return;
    }

    if (kind === 'Lane') {
      const oldIndex = board.lanes.findIndex((l) => l.id === activeId);
      const newIndex = board.lanes.findIndex((l) => l.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const next = arrayMove(board.lanes, oldIndex, newIndex);
      setBoard({ ...board, lanes: next });
      try {
        await kanbanApi.reorderLanes(
          board.id,
          next.map((l) => l.id)
        );
      } catch (err) {
        console.error('Failed to reorder lanes', err);
        loadBoard();
      }
      return;
    }

    const task = findTask(activeId);
    if (!task) return;
    const target = locateOver(overId, over.data.current as {
      type?: string;
      columnId?: string;
      laneId?: string;
      task?: TaskCard;
    }) ?? { columnId: task.columnId, laneId: task.laneId };

    const column = board.columns.find((c) => c.id === target.columnId);
    if (!column) return;
    const cellTasks = column.tasks.filter((t) => t.laneId === target.laneId);
    const oldIndex = cellTasks.findIndex((t) => t.id === activeId);
    let newIndex = cellTasks.findIndex((t) => t.id === overId);
    if (newIndex < 0) {
      newIndex = oldIndex >= 0 ? oldIndex : cellTasks.length - 1;
    }

    if (oldIndex >= 0 && oldIndex !== newIndex && task.columnId === target.columnId && task.laneId === target.laneId) {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id !== target.columnId) return col;
            const others = col.tasks.filter((t) => t.laneId !== target.laneId);
            const inCell = col.tasks.filter((t) => t.laneId === target.laneId);
            return { ...col, tasks: [...others, ...arrayMove(inCell, oldIndex, newIndex)] };
          }),
        };
      });
    }

    try {
      await kanbanApi.moveTask(activeId, target.columnId, target.laneId, Math.max(0, newIndex));
    } catch (err) {
      console.error('Failed to sync move with server, reverting...', err);
      loadBoard();
    }
  };

  const handleSaveTask = async (data: {
    id?: string;
    columnId: string;
    laneId: string;
    title: string;
    description: string;
    priority: Priority;
    dueDate?: string;
    projectId?: string | null;
  }) => {
    if (data.id) {
      const updated = await kanbanApi.updateTask(data.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        projectId: data.projectId,
      });
      const existing = findTask(data.id);
      if (existing && (existing.columnId !== data.columnId || existing.laneId !== data.laneId)) {
        await kanbanApi.moveTask(data.id, data.columnId, data.laneId, 0);
        loadBoard();
        return;
      }
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) => (t.id === updated.id ? { ...updated, laneId: t.laneId } : t)),
          })),
        };
      });
    } else {
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
      return { ...prev, columns: [...prev.columns, { ...newCol, tasks: [] }] };
    });
  };

  const handleRenameColumn = async (columnId: string, name: string) => {
    const updated = await kanbanApi.renameColumn(columnId, name);
    setBoard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        columns: prev.columns.map((col) => (col.id === columnId ? { ...col, name: updated.name } : col)),
      };
    });
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await kanbanApi.deleteColumn(columnId);
      setBoard((prev) => {
        if (!prev) return null;
        return { ...prev, columns: prev.columns.filter((c) => c.id !== columnId) };
      });
    } catch (err) {
      console.error('Failed to delete column', err);
    }
  };

  const handleAddLane = async (name: string) => {
    if (!board) return;
    const created = await kanbanApi.createLane(board.id, name);
    setBoard((prev) => {
      if (!prev) return null;
      return { ...prev, lanes: [...prev.lanes, created] };
    });
  };

  const handleRenameLane = async (laneId: string, name: string) => {
    const updated = await kanbanApi.renameLane(laneId, name);
    setBoard((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lanes: prev.lanes.map((lane) => (lane.id === laneId ? updated : lane)),
      };
    });
  };

  const handleDeleteLane = async (laneId: string) => {
    try {
      await kanbanApi.deleteLane(laneId);
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lanes: prev.lanes.filter((lane) => lane.id !== laneId),
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((task) => task.laneId !== laneId),
          })),
        };
      });
    } catch (err) {
      console.error('Failed to delete lane', err);
    }
  };

  const openNewTaskModal = (colId?: string, laneId?: string) => {
    setEditingTask(null);
    setTargetColumnId(colId || board?.columns[0]?.id);
    setTargetLaneId(laneId || board?.lanes[0]?.id);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: TaskCard) => {
    setEditingTask(task);
    setTargetColumnId(task.columnId);
    setTargetLaneId(task.laneId);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        board={board}
        onNewTask={() => openNewTaskModal()}
        onNewColumn={() => setIsColumnModalOpen(true)}
        onNewLane={() => setIsLaneModalOpen(true)}
      />

      <main className="flex-1 overflow-auto p-6 flex flex-col">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm font-medium">Loading your Kanban workspace...</p>
          </div>
        )}

        {error && (
          <div className={`max-w-md mx-auto my-auto p-6 text-center space-y-3 ${ui.card}`}>
            <div className="w-10 h-10 mx-auto rounded-md bg-danger-bg flex items-center justify-center text-danger-fg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-fg">Unable to Connect</h3>
            <p className="text-sm text-muted leading-relaxed">{error}</p>
            <button onClick={loadBoard} className={ui.btnPrimary}>
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
            <KanbanBoard
              board={board}
              projectNames={Object.fromEntries(projects.map((project) => [project.id, project.name]))}
              onAddColumn={() => setIsColumnModalOpen(true)}
              onAddLane={() => setIsLaneModalOpen(true)}
              onRenameColumn={handleRenameColumn}
              onRenameLane={handleRenameLane}
              onDeleteColumn={handleDeleteColumn}
              onDeleteLane={handleDeleteLane}
              onAddTask={openNewTaskModal}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
            />

            <DragOverlay>
              {activeTask ? (
                <div className="w-72 shadow-2xl opacity-90">
                  <TaskCardComponent
                    task={activeTask}
                    projectName={
                      activeTask.projectId
                        ? projects.find((project) => project.id === activeTask.projectId)?.name
                        : null
                    }
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
        lanes={board?.lanes || []}
        projects={projects}
        defaultColumnId={targetColumnId}
        defaultLaneId={targetLaneId}
      />

      <NewColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onAdd={handleAddColumn}
        heading="Add column"
        label="Column title"
        placeholder="e.g., Review, Waiting"
        submitLabel="Add Column"
      />

      <NewColumnModal
        isOpen={isLaneModalOpen}
        onClose={() => setIsLaneModalOpen(false)}
        onAdd={handleAddLane}
        heading="Add lane"
        label="Lane title"
        placeholder="e.g., Research, Writing, Personal"
        submitLabel="Add Lane"
      />
    </div>
  );
};
