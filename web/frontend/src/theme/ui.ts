/**
 * Shared chrome classes bound to CSS tokens in index.css.
 * Change look-and-feel here; change palettes in [data-theme] blocks.
 */
export const ui = {
  canvas: 'bg-canvas text-fg',
  pageHeader: 'bg-surface border-b border-border px-6 py-4',
  kicker: 'text-[11px] uppercase tracking-wider text-muted font-medium',
  title: 'text-lg font-semibold text-fg tracking-tight',
  card: 'bg-surface border border-border rounded-lg',
  cardHover: 'bg-surface border border-border rounded-lg hover:border-border-strong hover:bg-surface-muted',
  field:
    'w-full px-3 py-2 bg-surface border border-border rounded-md text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-50',
  btnPrimary:
    'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-accent-fg bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50',
  btnSecondary:
    'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-fg bg-surface hover:bg-surface-muted border border-border rounded-md',
  btnGhost: 'px-4 py-2 text-sm font-medium text-muted hover:text-fg hover:bg-surface-muted rounded-md',
  btnDashed:
    'border border-dashed border-border hover:border-border-strong hover:bg-surface rounded-lg text-sm font-medium text-muted hover:text-fg bg-surface-muted',
  iconBtn: 'p-1 text-subtle hover:text-fg hover:bg-surface-muted rounded',
  iconBtnDanger: 'p-1 text-subtle hover:text-danger-fg hover:bg-danger-bg rounded',
  overlay: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay',
  modal: 'bg-surface border border-border rounded-lg shadow-lg overflow-hidden flex flex-col',
  errorBox: 'flex items-center gap-2 p-3 text-sm text-danger-fg bg-danger-bg rounded-md',
  navActive: 'bg-surface-muted text-fg',
  navIdle: 'text-muted hover:text-fg hover:bg-surface-muted',
} as const;
