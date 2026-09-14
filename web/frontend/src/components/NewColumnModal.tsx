import React, { useState } from 'react';
import { X, Columns } from 'lucide-react';
import { ui } from '../theme/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  heading?: string;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
}

export const NewColumnModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAdd,
  heading = 'Add New Column',
  label = 'Column Title',
  placeholder = 'e.g., Code Review, Backlog, Ideas',
  submitLabel = 'Add Column',
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(`${label} cannot be blank`);
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await onAdd(name.trim());
      setName('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ui.overlay}>
      <div className={`w-full max-w-sm p-5 ${ui.modal}`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4 text-muted" />
            <h3 className="font-semibold text-sm text-fg">{heading}</h3>
          </div>
          <button onClick={onClose} className={ui.iconBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className={ui.errorBox}>{error}</p>}

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">{label}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className={ui.field}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={ui.btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={ui.btnPrimary}>
              {isSubmitting ? 'Adding...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
