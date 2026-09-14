import React, { useEffect, useState } from 'react';
import { AlertCircle, Wallet, X } from 'lucide-react';
import type { FinanceTransaction, TransactionType } from '../types/kanban';
import { FINANCE_CATEGORIES } from '../types/kanban';
import { centsToInput, localDateIso, parseAmountToCents } from '../finance/money';
import { ui } from '../theme/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    occurredOn: string;
    description: string;
    amountCents: number;
    type: TransactionType;
    category: string;
    notes: string;
  }) => Promise<void>;
  initialTransaction?: FinanceTransaction | null;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
}) => {
  const [occurredOn, setOccurredOn] = useState(localDateIso());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState('Other');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTransaction) {
      setOccurredOn(initialTransaction.occurredOn);
      setDescription(initialTransaction.description);
      setAmount(centsToInput(initialTransaction.amountCents));
      setType(initialTransaction.type);
      setCategory(initialTransaction.category || 'Other');
      setNotes(initialTransaction.notes || '');
    } else {
      setOccurredOn(localDateIso());
      setDescription('');
      setAmount('');
      setType('EXPENSE');
      setCategory('Other');
      setNotes('');
    }
    setError('');
  }, [initialTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    const amountCents = parseAmountToCents(amount);
    if (amountCents == null) {
      setError('Enter an amount greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        id: initialTransaction?.id,
        occurredOn,
        description: description.trim(),
        amountCents,
        type,
        category: category.trim() || 'Other',
        notes: notes.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ui.overlay}>
      <div className={`w-full max-w-lg max-h-[90vh] ${ui.modal}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-muted" />
            <h3 className="font-semibold text-fg">
              {initialTransaction ? 'Edit transaction' : 'New transaction'}
            </h3>
          </div>
          <button onClick={onClose} className={ui.iconBtn} type="button">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">
                Date <span className="text-danger-fg">*</span>
              </label>
              <input
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className={ui.field}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">
                Amount <span className="text-danger-fg">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={ui.field}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">
              Description <span className="text-danger-fg">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Groceries, stipend, rent"
              className={ui.field}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className={ui.field}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-fg mb-1.5">Category</label>
              <input
                list="finance-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={ui.field}
              />
              <datalist id="finance-categories">
                {FINANCE_CATEGORIES.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional context"
              className={`${ui.field} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className={ui.btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={ui.btnPrimary}>
              {isSubmitting ? 'Saving...' : initialTransaction ? 'Save changes' : 'Add transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
