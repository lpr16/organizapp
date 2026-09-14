# Version 1 scope

**Version:** `0.1.0-SNAPSHOT`  
**Shipped surface:** local web workspace (`:core` + `:web:server` + `web/frontend`)

This document is the contract for what “first version” means so later work does not silently rewrite the product.

## In scope

- Single-user workspace persisted in SQLite on disk
- Home dashboard with board, project, and diagram summaries
- One default Kanban board with seeded To Do / In Progress / Done and a **Main** swimlane
- Tasks: create, edit (title, description, priority, due date, column, lane), delete
- Drag-and-drop cards across columns **and** lanes, synced with `PATCH /api/tasks/{id}/move`
- Columns and lanes: create, inline rename, drag reorder, delete (not the last one)
- Projects: create, edit, delete, filter by status
- Simple BPMN diagrams: list, create, bpmn-js editor (start / task / decision / parallel / end), save, autosave, download `.bpmn`
- Color themes: Light, Dark, Dark blue, Beige (stored in `localStorage`)
- REST read of default board and of a board by id
- React SPA with loading, connection-error, empty, and delete-confirm states
- Automated tests for core Kanban, project, and diagram behavior, plus one board HTTP smoke test
- Gradle multi-module build; npm frontend with Vite proxy

## Out of scope (explicitly not in v1)

| Area | Status |
|---|---|
| Authentication, users, sharing | Not implemented |
| Multiple boards in the UI | API can `GET /api/board/{id}`; UI always loads the default board |
| Create / rename / reorder boards | Not implemented |
| Labels, comments, attachments, checklists, assignees | Not implemented |
| Linking Kanban cards to projects | Not implemented |
| BPMN execution, collaboration, or the full bpmn-js palette | Not implemented |
| Search, activity log, notifications | Not implemented (projects have a status filter only) |
| Real-time sync / WebSockets | Not implemented |
| Configurable DB path in the UI | Optional `organizapp.db.url` for the Spring bean / tests only |
| Automated frontend → `static/` copy in Gradle | Manual |
| `:desktop` JavaFX app | Folder + README only |
| `:mobile` Android / Compose app | Folder + README only |
| HTTPS, production hardening, rate limits | Local-dev defaults only |

## Known limitations

These are current behaviors, not accidental omissions in the docs:

1. **No exception handler.** Missing entities on many `PUT`s, last-column/last-lane delete, and missing board on create column/lane return HTTP 500 instead of 4xx.
2. **Move of an unknown task returns 204.** The repository returns without error.
3. **Invalid `columnId` on create** can 500 (foreign key), not 404.
4. **Deleting a column or lane does not re-pack sibling positions.**
5. **Header and Home Active/Completed counts** key off column *names* (`progress`, `done`, `complete`), not stable ids.
6. **Task delete has no confirm**; column, lane, project, and diagram delete do.
7. **Board name is display-only.** There is no rename API.
8. **List diagrams omits XML** (`xml` is `""`); the editor loads XML via `GET /api/diagrams/{id}`.
9. **One JDBC connection, synchronized.** Fine for one local user; not a concurrent multi-client store.
10. **Projects and diagrams are independent** of Kanban cards. There is no join table.
11. **Embedded UI on 8080 can be stale.** Develop against Vite on 5173; Java changes need a `bootRun` restart.

## Intended next increments (not scheduled)

These match the architecture, not a commitment:

- Wire Gradle to build and embed the Vite app
- HTTP tests for projects, diagrams, lanes, and column rename/reorder
- Map domain errors to 4xx
- Optional: link cards to projects, then an agenda view
- Optional: column/lane position compaction on delete
- Optional: PWA or a thin desktop wrapper that reuses the React UI
- Optional: Compose or JavaFX only if a native client is actually needed

## Compatibility

Clients of version 1 should depend on:

- JSON shapes in [api.md](api.md)
- Priority enum names `LOW` | `MEDIUM` | `HIGH` | `URGENT`
- Project status names `PLANNING` | `ACTIVE` | `ON_HOLD` | `COMPLETED`
- Board payloads that include `lanes` and task `laneId`
- Diagram list payloads that omit XML
- Default seed board id `default-board` **only as a seed artifact** — `GET /api/board` is the supported way to load the Kanban workspace
