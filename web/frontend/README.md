# Web frontend

React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + `@dnd-kit` + Lucide. This is the version 1 Kanban UI.

It is not a Gradle module. The parent overview is [../README.md](../README.md).

## Scripts

```powershell
npm install
npm run dev      # http://localhost:5173 — proxies /api → http://localhost:8080
npm run build    # tsc -b && vite build → dist/
npm run lint     # oxlint
npm run preview  # serve the production build
```

Start `:web:server` before `npm run dev`, or the board shows **Unable to Connect**.

## Layout

| Path | Role |
|---|---|
| `src/App.tsx` | Board state, drag handlers, API sync |
| `src/api/client.ts` | `fetch` wrappers for `/api` |
| `src/types/kanban.ts` | Mirrors Jackson-serialized `:core` records |
| `src/components/` | Header, columns, cards, task/column modals |
| `vite.config.ts` | React + Tailwind plugins, `/api` proxy |

## Embedded copy

`npm run build` writes `dist/`. Spring serves a **manually copied** snapshot from `web/server/src/main/resources/static/`. Hashed asset names change every build; replace the previous `assets/` files when you copy.

## Docs

- [User guide](../../docs/user-guide.md) — what the UI does
- [HTTP API](../../docs/api.md) — endpoints this client calls
- [Development](../../docs/development.md) — repo-wide setup
