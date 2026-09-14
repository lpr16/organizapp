# Architecture

OrganizApp version 1 follows a small Clean Architecture split: **domain and application logic** in `:core`, **HTTP adapters** in `:web:server`, **UI adapter** in `web/frontend`. Desktop and mobile are reserved clients of the same core; they are not wired yet.

## Goals

- Keep Kanban rules and persistence independent of Spring and React.
- Let a future JavaFX or Compose app call `KanbanService` and `SqliteBoardRepository` directly, or talk to the same REST API.
- Store everything locally in one SQLite file.

## Module map

```
                    ┌─────────────────────────────────────┐
                    │           web/frontend              │
                    │  React 19 + Vite + Tailwind + dnd   │
                    └─────────────────┬───────────────────┘
                                      │ HTTP /api
                    ┌─────────────────▼───────────────────┐
                    │           :web:server               │
                    │  Spring Boot controllers + DTOs     │
                    └─────────────────┬───────────────────┘
                                      │ KanbanService
                    ┌─────────────────▼───────────────────┐
                    │              :core                  │
                    │  domain records → service → port    │
                    │           SqliteBoardRepository     │
                    └─────────────────┬───────────────────┘
                                      │ JDBC
                                      ▼
                           ~/.organizapp/organizapp.db
```

Gradle includes only `:core` and `:web:server`. The frontend is a separate npm project; it is not a Gradle subproject.

| Module | Role in v1 |
|---|---|
| `:core` | Java 21 library. Records (`Board`, `BoardColumn`, `TaskCard`, `Priority`), `KanbanService`, `BoardRepository` port, `SqliteBoardRepository`. |
| `:web:server` | Spring Boot 3.4 app. REST controllers, Jakarta validation DTOs, CORS, bean wiring. |
| `web/frontend` | SPA. Fetches `/api`, owns drag-and-drop and modals. |
| `desktop/`, `mobile/` | README-only placeholders. |

## Dependency rule

`:web:server` depends on `:core`. `:core` depends only on the SQLite JDBC driver (and JUnit/AssertJ in tests). The frontend does not import Java; it mirrors types in TypeScript (`web/frontend/src/types/kanban.ts`).

## Core layers

### Domain

Immutable Java records. Factory methods (`Board.create`, `TaskCard.create`) assign UUIDs and timestamps. `withUpdates` / `withLocation` / `withColumns` return new instances.

`Priority` is an enum with display labels and numeric levels 1–4. `Priority.fromString` is lenient: null or unknown values become `MEDIUM`.

### Application service

`KanbanService` is the only use-case API. It validates inputs (blank title, blank column name, missing task/board) and delegates persistence to `BoardRepository`.

| Method | Responsibility |
|---|---|
| `getDefaultBoard()` | Oldest board by `created_at` (the seeded board). |
| `getBoard(id)` | Lookup; blank/null id falls back to the default board. |
| `createTask` | Rejects blank `columnId` or title; trims title. Position is assigned by the repository. |
| `updateTask` | Loads existing card or throws; trims title/description/due date. |
| `deleteTask` | Returns whether a row was removed. |
| `moveTask` | Clamps negative positions to `0`; repository reindexes neighbors. |
| `addColumn` | Appends at `board.columns().size()`. |
| `deleteColumn` | Returns whether a column row was removed. |

### Persistence port

`BoardRepository` is the outbound interface. Version 1 has one implementation: `SqliteBoardRepository`.

The production bean is constructed with the no-arg constructor (file DB). Tests pass an in-memory JDBC URL (`jdbc:sqlite:file:memdb_<uuid>?mode=memory&cache=shared`).

`SqliteBoardRepository` is `AutoCloseable`. Spring destroys the bean with `close()`.

## Web adapter

```
HTTP request
  → BoardController / TaskController / ColumnController
  → KanbanService
  → BoardRepository
  → JSON (Jackson serializes Java records)
```

Controllers return domain records directly. Jackson names match the TypeScript interfaces (`id`, `columnId`, `createdAt`, `dueDate`, …). `Instant` fields are ISO-8601 strings. `Priority` is the enum name.

Configuration:

- `AppConfig` registers `SqliteBoardRepository` and `KanbanService`.
- `WebCorsConfig` allows Vite (`localhost:5173`, `127.0.0.1:5173`) and `localhost:3000` for `/api/**`.
- `server.port=8080`.

There is no `ControllerAdvice`. Bean-validation failures become Spring’s default 400 body. Uncaught `IllegalArgumentException` from the service becomes 500.

Static files under `web/server/src/main/resources/static/` are served by Spring at `/`. Gradle does **not** build or copy the Vite app automatically.

## Frontend adapter

`App.tsx` holds board state. On mount it calls `GET /api/board`. Mutations update local state first when possible, then call the API.

| Concern | Implementation |
|---|---|
| HTTP | `kanbanApi` in `src/api/client.ts` — `fetch` against `/api` |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Collision | `closestCorners` |
| Sensors | Pointer (5px activation) and keyboard (`sortableKeyboardCoordinates`) |
| Overlay | `DragOverlay` shows the active card while dragging |
| Failed move | `loadBoard()` reloads from the server |

Vite (`vite.config.ts`) proxies `/api` → `http://localhost:8080` so the browser stays same-origin during development.

Header “Active” / “Completed” counts are **name heuristics**, not column IDs. Renaming columns can change those stats.

## Data flow: drag a card

1. Pointer moves past 5px → `onDragStart` stores the active task for the overlay.
2. `onDragOver` moving into another column updates React state immediately (optimistic).
3. `onDragEnd` may `arrayMove` within the column, then `PATCH /api/tasks/{id}/move`.
4. On HTTP error, the full board is refetched.

The repository move is transactional: it shifts neighbor `position` values, then writes the card’s `column_id` and `position`.

## Threading and process model

Version 1 is a single-user local server. `SqliteBoardRepository` methods are `synchronized` on one JDBC connection. That is enough for one browser tab talking to one JVM. It is not a multi-tenant or multi-process design.

## Future clients (not in v1)

The intended reuse paths, documented in the module READMEs:

- **Desktop:** instantiate `SqliteBoardRepository` + `KanbanService` in-process (same DB file).
- **Mobile:** either depend on `:core` (offline) or call this REST API.
