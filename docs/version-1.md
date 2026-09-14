# Version 1 scope

**Version:** `0.1.0-SNAPSHOT`  
**Shipped surface:** local web Kanban (`:core` + `:web:server` + `web/frontend`)

This document is the contract for what “first version” means so later work does not silently rewrite the product.

## In scope

- Single-user, single default board persisted in SQLite on disk
- Columns: create, delete, seeded To Do / In Progress / Done
- Tasks: create, edit (title, description, priority, due date), delete
- Drag-and-drop reorder and cross-column move, synced with `PATCH /api/tasks/{id}/move`
- REST read of default board and of a board by id
- React SPA with loading, connection-error, and empty-column states
- Automated tests for core Kanban behavior and one board HTTP smoke test
- Gradle multi-module build; npm frontend with Vite proxy

## Out of scope (explicitly not in v1)

| Area | Status |
|---|---|
| Authentication, users, sharing | Not implemented |
| Multiple boards in the UI | API can `GET /api/board/{id}`; UI always loads the default board |
| Create / rename / reorder boards | Not implemented |
| Rename or reorder columns | Not implemented |
| Labels, comments, attachments, checklists, assignees | Not implemented |
| Search, filters, activity log | Not implemented |
| Real-time sync / WebSockets | Not implemented |
| Configurable DB path or server port beyond `application.properties` | Port only |
| Automated frontend → `static/` copy in Gradle | Manual |
| `:desktop` JavaFX app | Folder + README only |
| `:mobile` Android / Compose app | Folder + README only |
| HTTPS, production hardening, rate limits | Local-dev defaults only |

## Known limitations

These are current behaviors, not accidental omissions in the docs:

1. **No exception handler.** Missing task on `PUT` and missing board on `POST /api/columns` return HTTP 500 instead of 404.
2. **Move of an unknown task returns 204.** The repository returns without error.
3. **Invalid `columnId` on create** can 500 (foreign key), not 404.
4. **`BoardControllerTest` uses the real home-directory database**, so it is sensitive to whatever is already on disk.
5. **Deleting a column does not re-pack column positions.**
6. **Header Active/Completed counts** key off column *names* (`progress`, `done`, `complete`), not stable ids.
7. **Task delete has no confirm**; column delete does.
8. **Edit modal cannot change column.** Drag to move.
9. **One JDBC connection, synchronized.** Fine for one local user; not a concurrent multi-client store.
10. **README previously said Java 25.** The build is Java 21. This documentation matches the build files.

## Intended next increments (not scheduled)

These match the architecture, not a commitment:

- Wire Gradle to build and embed the Vite app
- Isolate web tests from the file database
- Map domain errors to 4xx
- Optional: query layer for board state, column rename, multi-board UI
- Optional: PWA or a thin desktop wrapper that reuses the React UI
- Optional: Compose or JavaFX only if a native client is actually needed

## Compatibility

Clients of version 1 should depend on:

- JSON shapes in [api.md](api.md)
- Priority enum names `LOW` | `MEDIUM` | `HIGH` | `URGENT`
- Default seed board id `default-board` **only as a seed artifact** — `GET /api/board` is the supported way to load the workspace
