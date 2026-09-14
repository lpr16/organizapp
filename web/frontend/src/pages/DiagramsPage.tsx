import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Plus, Trash2, Workflow } from 'lucide-react';
import { diagramApi } from '../api/client';
import type { BpmnDiagram } from '../types/kanban';
import { ui } from '../theme/ui';

const formatWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const DiagramsPage: React.FC = () => {
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<BpmnDiagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDiagrams(await diagramApi.listDiagrams());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load diagrams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const created = await diagramApi.createDiagram({ name: 'Untitled process' });
      navigate(`/diagrams/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create diagram');
      setCreating(false);
    }
  };

  const handleDelete = async (diagram: BpmnDiagram) => {
    if (!confirm(`Delete diagram "${diagram.name}"?`)) return;
    try {
      await diagramApi.deleteDiagram(diagram.id);
      setDiagrams((prev) => prev.filter((item) => item.id !== diagram.id));
    } catch (err) {
      console.error('Failed to delete diagram', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={ui.kicker}>Process modeling</p>
            <h1 className={ui.title}>BPMN diagrams</h1>
          </div>
          <button onClick={handleCreate} disabled={creating} className={`${ui.btnPrimary} self-end sm:self-center`}>
            <Plus className="w-4 h-4" />
            {creating ? 'Creating...' : 'New diagram'}
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Loading diagrams...</p>
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

          {!loading && !error && diagrams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-surface">
              <Workflow className="w-8 h-8 text-subtle mb-3" />
              <p className="text-sm text-fg font-medium">No diagrams yet</p>
              <p className="text-sm text-muted mt-1 mb-4 max-w-sm">
                Sketch a simple process with start, tasks, decisions, and end.
              </p>
              <button onClick={handleCreate} disabled={creating} className="text-sm font-medium text-fg hover:underline">
                + New diagram
              </button>
            </div>
          )}

          {!loading && !error && diagrams.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {diagrams.map((diagram) => (
                <article key={diagram.id} className={`group flex flex-col gap-3 p-4 ${ui.cardHover}`}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/diagrams/${diagram.id}`)}
                      className="text-left min-w-0"
                    >
                      <h2 className="text-sm font-semibold text-fg leading-snug">{diagram.name}</h2>
                      <p className="text-[11px] text-muted mt-1">Updated {formatWhen(diagram.updatedAt)}</p>
                    </button>
                    <button
                      onClick={() => handleDelete(diagram)}
                      className={`${ui.iconBtnDanger} opacity-0 group-hover:opacity-100`}
                      title="Delete diagram"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/diagrams/${diagram.id}`)}
                    className="text-sm font-medium text-fg mt-auto text-left"
                  >
                    Open editor
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
