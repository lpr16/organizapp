# Architecture

OrganizApp version 1 follows a small Clean Architecture split: **domain and application logic** in `:core`, **HTTP adapters** in `:web:server`, **UI adapter** in `web/frontend`. Desktop and mobile are reserved clients of the same core; they are not wired yet.

## Goals

- Keep workspace rules and persistence independent of Spring and React.
- Let a future JavaFX or Compose app call `KanbanService`, `ProjectService`, `DiagramService`, and `SqliteBoardRepository` directly, or talk to the same REST API.
- Store everything locally in one SQLite file.

## Module map

```
                    ┌─────────────────────────────────────┐
                    │           web/frontend              │
                    │  React 19 + Vite + Tailwind         │
                    │  dnd-kit + bpmn-js + themes         │
                    └─────────────────┬───────────────────┘
                                      │ HTTP /api
                    ┌─────────────────▼───────────────────┐
                    │           :web:server               │
                    │  Spring Boot controllers + DTOs     │
                    └─────────────────┬───────────────────┘
                                      │ KanbanService
                                      │ ProjectService
                                      │ DiagramService
                    ┌─────────────────▼───────────────────┐
                    │              :core                  │
                    │  domain records → services → ports  │
                    │           SqliteBoardRepository     │
                    └─────────────────┬───────────────────┘
                                      │ JDBC
                                      ▼
                           ~/.organizapp/organizapp.db
```

Gradle includes only `:core` and `:web:server`. The frontend is a separate npm project; it is not a Gradle subproject.

| Module | Role in v1 |
|---|---|
| `:core` | Java 21 library. Domain records, `KanbanService`, `ProjectService`, `DiagramService`, ports, `SqliteBoardRepository`. |
| `:web:server` | Spring Boot 3.4 app. REST controllers, Jakarta validation DTOs, CORS, SPA forwards, bean wiring. |
| `web/frontend` | SPA. React Router pages for Home, Kanban, Projects, BPMN. Owns drag-and-drop, modals, and the bpmn-js canvas. |
| `desktop/`, `mobile/` | README-only placeholders. |

## Dependency rule

`:web:server` depends on `:core`. `:core` depends only on the SQLite JDBC driver (and JUnit/AssertJ in tests). The frontend does not import Java; it mirrors types in TypeScript (`web/frontend/src/types/kanban.ts`).

## Core layers

### Domain

Immutable Java records. Factory methods (`Board.create`, `TaskCard.create`, `Project.create`, `BpmnDiagram.create`) assign UUIDs and timestamps. `withUpdates` / `withLocation` / `withColumns` / `withLanes` return new instances.

`Priority` is an enum with display labels and numeric levels 1–4. `Priority.fromString` is lenient: null or unknown values become `MEDIUM`.

`ProjectStatus` is `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`. `fromString` maps null or unknown values to `PLANNING`.

### Application services

Three use-case APIs. Each validates inputs and delegates to a port.

**`KanbanService`** — board, columns, lanes, tasks.

| Method | Responsibility |
|---|---|
| `getDefaultBoard()` | Oldest board by `created_at` (the seeded board). |
| `getBoard(id)` | Lookup; blank/null id falls back to the default board. |
| `createTask` | Rejects blank `columnId` or title; blank `laneId` uses the first lane. Position is assigned by the repository per cell. |
| `updateTask` | Loads existing card or throws; trims title/description/due date. |
| `deleteTask` | Returns whether a row was removed. |
| `moveTask` | Clamps negative positions to `0`; blank lane uses the first lane; repository reindexes neighbors in the source and destination cells. |
| `addColumn` / `addLane` | Appends at the current list size. |
| `renameColumn` / `renameLane` | Rejects blank names. |
| `reorderColumns` / `reorderLanes` | Writes `position` 0..n-1 from the given id list. |
| `deleteColumn` / `deleteLane` | Refuses the last remaining column or lane; otherwise deletes the row (and its tasks). |

**`ProjectService`** — independent project records.

| Method | Responsibility |
|---|---|
| `listProjects` / `getProject` | Read |
| `createProject` | Rejects blank name; default status `PLANNING`, priority `MEDIUM` |
| `updateProject` | Missing id throws; blank name rejected |
| `deleteProject` | Returns whether a row was removed |

**`DiagramService`** — BPMN XML documents.

| Method | Responsibility |
|---|---|
| `listDiagrams` | Metadata only (`xml` is empty in list rows) |
| `getDiagram` | Full XML |
| `createDiagram` | Rejects blank name; blank XML becomes `BpmnDiagram.EMPTY_XML` (one start event) |
| `updateDiagram` | Missing id throws; `null` XML keeps the stored document; blank name rejected if a name is sent |
| `deleteDiagram` | Returns whether a row was removed |

Projects and diagrams are **not** linked to Kanban cards in this version.

### Persistence ports

| Port | Implementation |
|---|---|
| `BoardRepository` | `SqliteBoardRepository` |
| `ProjectRepository` | same class |
| `DiagramRepository` | same class |

The production bean is constructed with the no-arg constructor (file DB) unless `organizapp.db.url` is set. Tests pass an in-memory JDBC URL (`jdbc:sqlite:file:memdb_<uuid>?mode=memory&cache=shared`).

`SqliteBoardRepository` is `AutoCloseable`. Spring destroys the bean with `close()`.

## Web adapter

```
HTTP request
  → Board / Task / Column / Lane / Project / Diagram controllers
  → KanbanService | ProjectService | DiagramService
  → BoardRepository | ProjectRepository | DiagramRepository
  → JSON (Jackson serializes Java records)
```

Controllers return domain records directly. Jackson names match the TypeScript interfaces (`id`, `columnId`, `laneId`, `createdAt`, `dueDate`, …). `Instant` fields are ISO-8601 strings. Enums are the enum name.

Configuration:

- `AppConfig` registers `SqliteBoardRepository` and the three services (plus the three port beans that alias the same repository).
- `WebCorsConfig` allows Vite (`localhost:5173`, `127.0.0.1:5173`) and `localhost:3000` for `/api/**`.
- `SpaRedirectConfig` forwards `/board`, `/projects`, `/diagrams`, and `/diagrams/{id}` to `index.html` so a copied SPA can deep-link on port 8080.
- `server.port=8080`.
- Optional `organizapp.db.url` overrides the SQLite JDBC URL (used by web tests for an in-memory database).

There is no `ControllerAdvice`. Bean-validation failures become Spring’s default 400 body. Uncaught `IllegalArgumentException` from a service becomes 500.

Static files under `web/server/src/main/resources/static/` are served by Spring at `/`. Gradle does **not** build or copy the Vite app automatically.

## Frontend adapter

`App.tsx` is routing only (`react-router-dom`). `AppLayout` renders `AppNav` and an `<Outlet />`. Each page owns its own fetch and local state.

| Route | Page |
|---|---|
| `/` | `HomePage` |
| `/board` | `BoardPage` |
| `/projects` | `ProjectsPage` |
| `/diagrams` | `DiagramsPage` |
| `/diagrams/:id` | `DiagramEditorPage` |

| Concern | Implementation |
|---|---|
| HTTP | `kanbanApi`, `projectApi`, `diagramApi` in `src/api/client.ts` — `fetch` against `/api` |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` on the board (cards, columns, lanes) |
| BPMN canvas | `bpmn-js` Modeler with `simplePalette.ts` |
| Theme | `ThemeProvider` + `data-theme` on `<html>`; tokens in `src/theme/ui.ts` |
| Collision | `closestCorners` |
| Sensors | Pointer (5px activation) and keyboard (`sortableKeyboardCoordinates`) |
| Overlay | `DragOverlay` shows the active card while dragging |
| Failed move | `loadBoard()` reloads from the server |

Vite (`vite.config.ts`) proxies `/api` → `http://localhost:8080` so the browser stays same-origin during development.

Header and Home “in progress” / “done” counts are **name heuristics**, not column IDs. Renaming columns can change those stats.

## Data flow: drag a card

1. Pointer moves past 5px → `onDragStart` stores the active task for the overlay.
2. `onDragOver` moving into another **cell** (column × lane) updates React state immediately (optimistic).
3. `onDragEnd` may `arrayMove` within the cell, then `PATCH /api/tasks/{id}/move` with `targetColumnId`, `targetLaneId`, and `newPosition`.
4. On HTTP error, the full board is refetched.

The repository move is transactional: it shifts neighbor `position` values in the source and destination cells, then writes the card’s `column_id`, `lane_id`, and `position`.

## Data flow: edit a BPMN diagram

1. `GET /api/diagrams/{id}` loads name + XML.
2. bpmn-js `importXML` fills the canvas. Dirty tracking is ignored until import finishes.
3. Palette / connect / context pad mutate the model (`commandStack.changed`).
4. After 1.5s of idle dirty state, or on Save / Ctrl+S, `saveXML` is sent as `PUT /api/diagrams/{id}` with `{ name, xml }`.
5. Rename via `InlineName` sends `PUT` with `{ name }` only; the server keeps existing XML.

## Threading and process model

Version 1 is a single-user local server. `SqliteBoardRepository` methods are `synchronized` on one JDBC connection. That is enough for one browser tab talking to one JVM. It is not a multi-tenant or multi-process design.

## Future clients (not in v1)

The intended reuse paths, documented in the module READMEs:

- **Desktop:** instantiate `SqliteBoardRepository` plus the three services in-process (same DB file).
- **Mobile:** either depend on `:core` (offline) or call this REST API.
