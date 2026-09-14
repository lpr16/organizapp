import React, { useEffect, useState } from 'react';
import { AlertCircle, Leaf, X } from 'lucide-react';
import type { Season } from '../types/kanban';
import { localDateIso } from '../finance/money';
import { ui } from '../theme/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    notes: string;
    startsOn: string;
    endsOn?: string;
  }) => Promise<void>;
  initialSeason?: Season | null;
}

export const SeasonModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialSeason }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [startsOn, setStartsOn] = useState(localDateIso());
  const [endsOn, setEndsOn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSeason) {
      setName(initialSeason.name);
      setNotes(initialSeason.notes || '');
      setStartsOn(initialSeason.startsOn);
      setEndsOn(initialSeason.endsOn || '');
    } else {
      setName('');
      setNotes('');
      setStartsOn(localDateIso());
      setEndsOn('');
    }
    setError('');
  }, [initialSeason, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Season name is required');
      return;
    }
    if (!startsOn) {
      setError('Start date is required');
      return;
    }
    if (endsOn && endsOn < startsOn) {
      setError('End date must be on or after the start');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        id: initialSeason?.id,
        name: name.trim(),
        notes: notes.trim(),
        startsOn,
        endsOn,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save season');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ui.overlay}>
      <div className={`w-full max-w-lg max-h-[90vh] ${ui.modal}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-muted" />
            <h3 className="font-semibold text-fg">{initialSeason ? 'Edit season' : 'New season'}</h3>
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
              Name <span className="text-danger-fg">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Spring 2026, Thesis year"
              className={ui.field}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">
                Starts <span className="text-danger-fg">*</span>
              </label>
              <input
                type="date"
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className={ui.field}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Ends</label>
              <input
                type="date"
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className={ui.field}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="What this stretch of work is for..."
              className={`${ui.field} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className={ui.btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={ui.btnPrimary}>
              {isSubmitting ? 'Saving...' : initialSeason ? 'Save changes' : 'Create season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
