import React, { useEffect, useState } from 'react';
import { X, AlertCircle, FolderKanban } from 'lucide-react';
import type { Priority, Project, ProjectStatus } from '../types/kanban';
import { ui } from '../theme/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    dueDate?: string;
  }) => Promise<void>;
  initialProject?: Project | null;
}

export const ProjectModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialProject }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || '');
      setStatus(initialProject.status);
      setPriority(initialProject.priority);
      setDueDate(initialProject.dueDate || '');
    } else {
      setName('');
      setDescription('');
      setStatus('PLANNING');
      setPriority('MEDIUM');
      setDueDate('');
    }
    setError('');
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        id: initialProject?.id,
        name: name.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate ? dueDate : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ui.overlay}>
      <div className={`w-full max-w-lg max-h-[90vh] ${ui.modal}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-muted" />
            <h3 className="font-semibold text-fg">
              {initialProject ? 'Edit Project' : 'New Project'}
            </h3>
          </div>
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
              Project name <span className="text-danger-fg">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Desktop client, Research notes"
              className={ui.field}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={ui.field}
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={ui.field}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Goal, scope, or notes..."
              className={`${ui.field} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className={ui.btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={ui.btnPrimary}>
              {isSubmitting ? 'Saving...' : initialProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
