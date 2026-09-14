import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { BoardColumn, BoardLane, Priority, TaskCard } from '../types/kanban';
import { ui } from '../theme/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    id?: string;
    columnId: string;
    laneId: string;
    title: string;
    description: string;
    priority: Priority;
    dueDate?: string;
  }) => Promise<void>;
  initialTask?: TaskCard | null;
  columns: BoardColumn[];
  lanes: BoardLane[];
  defaultColumnId?: string;
  defaultLaneId?: string;
}

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  columns,
  lanes,
  defaultColumnId,
  defaultLaneId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [columnId, setColumnId] = useState('');
  const [laneId, setLaneId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setColumnId(initialTask.columnId);
      setLaneId(initialTask.laneId);
      setDueDate(initialTask.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setColumnId(defaultColumnId || (columns.length > 0 ? columns[0].id : ''));
      setLaneId(defaultLaneId || (lanes.length > 0 ? lanes[0].id : ''));
      setDueDate('');
    }
    setError('');
  }, [initialTask, defaultColumnId, defaultLaneId, columns, lanes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!columnId) {
      setError('Please select a column');
      return;
    }
    if (!laneId) {
      setError('Please select a lane');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        id: initialTask?.id,
        columnId,
        laneId,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate ? dueDate : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ui.overlay}>
      <div className={`w-full max-w-lg max-h-[90vh] ${ui.modal}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-fg">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button onClick={onClose} className={ui.iconBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className={ui.errorBox}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">
              Task Title <span className="text-danger-fg">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Set up JavaFX desktop app"
              className={ui.field}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Column</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className={ui.field}
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Lane</label>
              <select
                value={laneId}
                onChange={(e) => setLaneId(e.target.value)}
                className={ui.field}
              >
                {lanes.map((lane) => (
                  <option key={lane.id} value={lane.id}>
                    {lane.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={ui.field}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={ui.field}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add details, notes, or checklist items..."
              className={`${ui.field} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className={ui.btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={ui.btnPrimary}>
              {isSubmitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
