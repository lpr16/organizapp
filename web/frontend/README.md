# Web frontend

React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + `@dnd-kit` + `bpmn-js` + Lucide. This is the version 1 SPA: Home, Kanban (swimlanes), Projects, and a simple BPMN editor.

It is not a Gradle module. The parent overview is [../README.md](../README.md).

## Scripts

```powershell
npm install
npm run dev      # http://localhost:5173 — proxies /api → http://localhost:8080
npm run build    # tsc -b && vite build → dist/
npm run lint     # oxlint
npm run preview  # serve the production build
```

Start `:web:server` before `npm run dev`, or pages show a connection error.

## Layout

| Path | Role |
|---|---|
| `src/App.tsx` | React Router routes inside `AppLayout` |
| `src/layout/AppLayout.tsx` | Top nav + page outlet |
| `src/pages/` | Home, Board, Projects, Diagrams, DiagramEditor |
| `src/api/client.ts` | `kanbanApi`, `projectApi`, `diagramApi` (`fetch` against `/api`) |
| `src/types/kanban.ts` | Mirrors Jackson-serialized `:core` records |
| `src/theme/` | Theme registry, provider, select, UI class tokens |
| `src/bpmn/` | Custom palette and canvas shell CSS |
| `src/components/` | Board chrome, cards, modals, `InlineName` |
| `vite.config.ts` | React + Tailwind plugins, `/api` proxy |

## Themes

`ThemeProvider` writes `data-theme` on `<html>` and stores the choice in `localStorage` (`organizapp.theme`). Palettes: Light, Dark, Dark blue (`navy`), Beige. Components should use tokens from `src/theme/ui.ts`.

## Embedded copy

`npm run build` writes `dist/`. Spring serves a **manually copied** snapshot from `web/server/src/main/resources/static/`. Hashed asset names change every build; replace the previous `assets/` files when you copy.

## Docs

- [User guide](../../docs/user-guide.md) — what the UI does
- [HTTP API](../../docs/api.md) — endpoints this client calls
- [Development](../../docs/development.md) — repo-wide setup
