import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { AlertCircle, ArrowLeft, Download, Loader2, Save } from 'lucide-react';
import { diagramApi } from '../api/client';
import { InlineName } from '../components/InlineName';
import SimplePaletteProvider from '../bpmn/simplePalette';
import { ui } from '../theme/ui';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import '../bpmn/bpmn-shell.css';

type Modeler = {
  importXML: (xml: string) => Promise<unknown>;
  saveXML: (options?: { format?: boolean }) => Promise<{ xml?: string }>;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  get: (name: string) => { resized?: () => void; zoom?: (mode: string) => void };
  destroy: () => void;
};

export const DiagramEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<Modeler | null>(null);

  const [name, setName] = useState('Untitled process');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Saved');

  const save = useCallback(async () => {
    if (!id || !modelerRef.current) return;
    try {
      setSaving(true);
      const { xml } = await modelerRef.current.saveXML({ format: true });
      if (!xml) throw new Error('Could not export diagram');
      await diagramApi.updateDiagram(id, { name, xml });
      setDirty(false);
      setStatus('Saved');
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [id, name]);

  useEffect(() => {
    if (!id || !canvasRef.current) return;
    let cancelled = false;
    const modeler = new BpmnModeler({
      container: canvasRef.current,
      additionalModules: [
        {
          __init__: ['paletteProvider'],
          paletteProvider: ['type', SimplePaletteProvider],
        },
      ],
    }) as unknown as Modeler;
    modelerRef.current = modeler;

    const readyRef = { current: false };
    const markDirty = () => {
      if (!readyRef.current) return;
      setDirty(true);
      setStatus('Unsaved');
    };
    modeler.on('commandStack.changed', markDirty);

    const observer = new ResizeObserver(() => {
      modeler.get('canvas').resized?.();
    });
    observer.observe(canvasRef.current);

    const load = async () => {
      try {
        const diagram = await diagramApi.getDiagram(id);
        if (cancelled) return;
        setName(diagram.name);
        await modeler.importXML(diagram.xml);
        const canvas = modeler.get('canvas');
        canvas.resized?.();
        canvas.zoom?.('fit-viewport');
        readyRef.current = true;
        setDirty(false);
        setStatus('Saved');
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load diagram');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();

    return () => {
      cancelled = true;
      observer.disconnect();
      modeler.off('commandStack.changed', markDirty);
      modeler.destroy();
      modelerRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      void save();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [dirty, save]);

  const handleRename = async (next: string) => {
    if (!id) return;
    setName(next);
    await diagramApi.updateDiagram(id, { name: next });
  };

  const handleDownload = async () => {
    if (!modelerRef.current) return;
    const { xml } = await modelerRef.current.saveXML({ format: true });
    if (!xml) return;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase() || 'diagram'}.bpmn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className={`max-w-md p-6 text-center space-y-3 ${ui.card}`}>
          <div className="w-10 h-10 mx-auto rounded-md bg-danger-bg flex items-center justify-center text-danger-fg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-fg">Unable to open diagram</h3>
          <p className="text-sm text-muted">{error}</p>
          <button onClick={() => navigate('/diagrams')} className={ui.btnPrimary}>
            Back to diagrams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={ui.pageHeader}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/diagrams" className={`${ui.iconBtn} shrink-0`} title="Back to diagrams">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <p className={ui.kicker}>BPMN</p>
              <InlineName value={name} onSave={handleRename} className={ui.title} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-xs text-muted">{saving ? 'Saving...' : status}</span>
            <button onClick={handleDownload} className={ui.btnSecondary} type="button">
              <Download className="w-3.5 h-3.5" />
              BPMN
            </button>
            <button onClick={() => void save()} disabled={saving} className={ui.btnPrimary} type="button">
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex-1 min-h-0 bpmn-shell">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-canvas/80 text-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Opening diagram...</span>
          </div>
        )}
        <div ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};
