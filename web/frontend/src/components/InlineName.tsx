import React, { useEffect, useState } from 'react';
import { ui } from '../theme/ui';

interface Props {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  className?: string;
  title?: string;
}

export const InlineName: React.FC<Props> = ({ value, onSave, className, title }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = async () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === value) {
      setDraft(value);
      return;
    }
    await onSave(next);
  };

  if (!editing) {
    return (
      <button
        type="button"
        title={title ?? 'Click to rename'}
        onClick={() => setEditing(true)}
        className={`text-left truncate ${className ?? ''}`}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void commit();
        }
        if (e.key === 'Escape') {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={`${ui.field} py-1 px-2 text-sm`}
    />
  );
};
