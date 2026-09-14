import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Edit3, Loader2, Plus, Trash2, Wallet } from 'lucide-react';
import { financeApi } from '../api/client';
import { TransactionModal } from '../components/TransactionModal';
import { formatCents, localMonthIso } from '../finance/money';
import type { FinanceTransaction, TransactionType } from '../types/kanban';
import { ui } from '../theme/ui';

type TypeFilter = 'ALL' | TransactionType;

export const FinancePage: React.FC = () => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(localMonthIso());
  const [allMonths, setAllMonths] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTransactions(await financeApi.listTransactions());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    transactions.forEach((item) => names.add(item.category));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const visible = useMemo(() => {
    return transactions.filter((item) => {
      if (!allMonths && !item.occurredOn.startsWith(month)) return false;
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      return true;
    });
  }, [transactions, allMonths, month, typeFilter, categoryFilter]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    visible.forEach((item) => {
      if (item.type === 'INCOME') income += item.amountCents;
      else expense += item.amountCents;
    });
    return { income, expense, net: income - expense };
  }, [visible]);

  const handleSave = async (data: {
    id?: string;
    occurredOn: string;
    description: string;
    amountCents: number;
    type: TransactionType;
    category: string;
    notes: string;
  }) => {
    if (data.id) {
      const updated = await financeApi.updateTransaction(data.id, data);
      setTransactions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } else {
      const created = await financeApi.createTransaction(data);
      setTransactions((prev) =>
        [...prev, created].sort((a, b) => {
          const byDate = b.occurredOn.localeCompare(a.occurredOn);
          return byDate !== 0 ? byDate : b.createdAt.localeCompare(a.createdAt);
        })
      );
    }
  };

  const handleDelete = async (transaction: FinanceTransaction) => {
    if (!confirm(`Delete "${transaction.description}"?`)) return;
    try {
      await financeApi.deleteTransaction(transaction.id);
      setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={ui.kicker}>Money in and out</p>
            <h1 className={ui.title}>Finance</h1>
          </div>
          <button onClick={openCreate} className={`${ui.btnPrimary} self-end sm:self-center`}>
            <Plus className="w-4 h-4" />
            New transaction
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-muted">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setAllMonths(false);
              }}
              disabled={allMonths}
              className="px-3 py-2 bg-surface border border-border rounded-md text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setAllMonths((prev) => !prev)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                allMonths
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'text-muted border-border bg-surface hover:bg-surface-muted hover:text-fg'
              }`}
            >
              All months
            </button>
            <span className="w-px h-6 bg-border mx-1 hidden sm:inline-block" />
            {(['ALL', 'INCOME', 'EXPENSE'] as TypeFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  typeFilter === value
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'text-muted border-border bg-surface hover:bg-surface-muted hover:text-fg'
                }`}
              >
                {value === 'ALL' ? 'All types' : value === 'INCOME' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                  categoryFilter === 'ALL'
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'text-muted border-border bg-surface hover:bg-surface-muted hover:text-fg'
                }`}
              >
                All categories
              </button>
              {categories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategoryFilter(name)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                    categoryFilter === name
                      ? 'bg-accent text-accent-fg border-accent'
                      : 'text-muted border-border bg-surface hover:bg-surface-muted hover:text-fg'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Loading transactions...</p>
            </div>
          )}

          {error && (
            <div className={`max-w-md mx-auto p-6 text-center space-y-3 ${ui.card}`}>
              <div className="w-10 h-10 mx-auto rounded-md bg-danger-bg flex items-center justify-center text-danger-fg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-fg">Unable to Connect</h3>
              <p className="text-sm text-muted">{error}</p>
              <button onClick={load} className={ui.btnPrimary}>
                Retry Connection
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryCard label="Income" value={summary.income} tone="in" />
                <SummaryCard label="Expenses" value={summary.expense} tone="out" />
                <SummaryCard label="Net" value={summary.net} tone="net" />
              </div>

              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-surface">
                  <Wallet className="w-8 h-8 text-subtle mb-3" />
                  <p className="text-sm text-fg font-medium">No transactions in this view</p>
                  <p className="text-sm text-muted mt-1 mb-4 max-w-sm">
                    Record income and expenses by category to see a monthly picture.
                  </p>
                  <button onClick={openCreate} className="text-sm font-medium text-fg hover:underline">
                    + New transaction
                  </button>
                </div>
              ) : (
                <div className={`overflow-hidden ${ui.card}`}>
                  <table className="w-full text-sm">
                    <thead className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border bg-surface-muted">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        <th className="px-4 py-2.5 font-medium">Description</th>
                        <th className="px-4 py-2.5 font-medium hidden md:table-cell">Category</th>
                        <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                        <th className="px-4 py-2.5 font-medium w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((item) => (
                        <tr key={item.id} className="group border-b border-border last:border-b-0">
                          <td className="px-4 py-3 text-muted whitespace-nowrap">{item.occurredOn}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-fg">{item.description}</p>
                            <p className="text-[11px] text-muted md:hidden">{item.category}</p>
                            {item.notes && (
                              <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{item.notes}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted hidden md:table-cell">{item.category}</td>
                          <td
                            className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                              item.type === 'INCOME' ? 'text-status-done-fg' : 'text-fg'
                            }`}
                          >
                            {item.type === 'INCOME' ? '+' : '−'}
                            {formatCents(item.amountCents)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(item);
                                  setIsModalOpen(true);
                                }}
                                className={ui.iconBtn}
                                title="Edit transaction"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className={ui.iconBtnDanger}
                                title="Delete transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialTransaction={editing}
      />
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: number; tone: 'in' | 'out' | 'net' }> = ({
  label,
  value,
  tone,
}) => {
  const color =
    tone === 'in' ? 'text-status-done-fg' : tone === 'out' ? 'text-fg' : value < 0 ? 'text-danger-fg' : 'text-fg';
  const sign = tone === 'net' ? (value < 0 ? '−' : value > 0 ? '+' : '') : '';
  return (
    <div className={`px-4 py-3 ${ui.card}`}>
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${color}`}>
        {sign}
        {formatCents(Math.abs(value))}
      </p>
    </div>
  );
};
