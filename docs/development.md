# Development

How to build, run, and extend OrganizApp version 1.

## Prerequisites

| Tool | Version used in this repo |
|---|---|
| JDK | 21 (`sourceCompatibility` / `targetCompatibility` / `--release 21`) |
| Gradle | 9.6.0 via `gradlew` / `gradlew.bat` |
| Node.js | 20+ recommended (Vite 8) |
| npm | Comes with Node |

You do not need a global Gradle install. You do not need a separate database server.

## First-time setup

```powershell
# from the repository root
.\gradlew.bat test

cd web\frontend
npm install
```

## Run

### API only

```powershell
.\gradlew.bat :web:server:bootRun
```

- Process: `OrganizappApplication`
- Port: **8080** (`web/server/src/main/resources/application.properties`)
- SQLite: `%USERPROFILE%\.organizapp\organizapp.db` on Windows (`~/.organizapp/organizapp.db` elsewhere)

Restart `bootRun` after Java changes. The JVM does not pick up `:core` or controller edits while it is running.

### UI with hot module replacement

Keep the API running, then:

```powershell
cd web\frontend
npm run dev
```

- UI: [http://localhost:5173](http://localhost:5173)
- `/api` is proxied to `http://localhost:8080` (`web/frontend/vite.config.ts`)

This is the supported way to develop Home, Kanban, Projects, and BPMN.

### Embedded UI on port 8080

Spring serves `web/server/src/main/resources/static/`. There is **no** Gradle task that runs `npm run build` or copies `web/frontend/dist`. To refresh the embedded UI:

```powershell
cd web\frontend
npm run build
# copy dist/* into web/server/src/main/resources/static/
```

Hashed asset filenames change every build. Replace the previous `assets/` files.

Deep links on 8080 (`/board`, `/projects`, `/diagrams`, `/diagrams/{id}`) are forwarded to `index.html` by `SpaRedirectConfig`.

## Scripts and tasks

| Command | What it does |
|---|---|
| `.\gradlew.bat test` | `:core` unit tests + `:web:server` MockMvc test |
| `.\gradlew.bat :core:test` | Kanban, project, and diagram tests against in-memory SQLite |
| `.\gradlew.bat :web:server:bootRun` | Start the API |
| `.\gradlew.bat :web:server:bootJar` | Fat JAR under `web/server/build/libs/` |
| `npm run dev` | Vite HMR (from `web/frontend`) |
| `npm run build` | `tsc -b && vite build` → `web/frontend/dist/` |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview the production Vite build |

## Tests

Core tests build `SqliteBoardRepository` with a unique in-memory URL:

```text
jdbc:sqlite:file:memdb_<uuid>?mode=memory&cache=shared
```

| Class | Coverage |
|---|---|
| `KanbanServiceTest` | Seed board (3 columns, **Main** lane, welcome card); create/update/delete/move task; add/rename/reorder columns and lanes; blank title rejection |
| `ProjectServiceTest` | Seed project; create; blank name; update; delete |
| `DiagramServiceTest` | Empty list; create with default XML; update; delete; blank name rejection |

### `:web:server` — `BoardControllerTest`

`@SpringBootTest` + `MockMvc` hits `GET /api/board` and asserts name `My Personal Board`, first column `To Do`, and first lane `Main`.

`web/server/src/test/resources/application.properties` sets `organizapp.db.url` to an in-memory SQLite URL, so this test does **not** use the personal file database.

There are no HTTP tests yet for projects, diagrams, column rename, or lanes.

## Project conventions

- Group: `com.organizapp`, version `0.1.0-SNAPSHOT` (`build.gradle.kts`).
- Domain objects are Java records. Do not put Spring annotations in `:core`.
- New HTTP operations: DTO with Jakarta validation → controller → the matching service (`KanbanService`, `ProjectService`, or `DiagramService`) → port.
- New persistence operations: add a method on the relevant port (`BoardRepository`, `ProjectRepository`, `DiagramRepository`) and implement it in `SqliteBoardRepository` (keep position updates transactional).
- Frontend types in `src/types/kanban.ts` must stay aligned with Jackson’s record serialization.
- Keep API paths under `/api`. CORS only lists local Vite/CRA origins.
- UI pages belong under `src/pages/`. Shared chrome is `AppLayout` + `AppNav`. Theme tokens live in `src/theme/`; do not hard-code zinc/indigo in new components.
- After adding a client-side route, add a matching `SpaRedirectConfig` forward if the embedded 8080 UI should deep-link.

## Package layout

```
core/src/main/java/com/organizapp/core/
  domain/          Board, BoardColumn, BoardLane, TaskCard, Priority,
                   Project, ProjectStatus, BpmnDiagram
  service/         KanbanService, ProjectService, DiagramService
  port/            BoardRepository, ProjectRepository, DiagramRepository
  storage/         SqliteBoardRepository

web/server/src/main/java/com/organizapp/web/
  OrganizappApplication.java
  config/          AppConfig, WebCorsConfig, SpaRedirectConfig
  controller/      Board, Task, Column, Lane, Project, Diagram
  dto/             Create/Update/Move/Reorder request records

web/frontend/src/
  main.tsx, App.tsx, index.css
  layout/AppLayout.tsx
  api/client.ts
  types/kanban.ts
  theme/           themes, ThemeProvider, ThemeSelect, ui tokens
  bpmn/            simplePalette.ts, bpmn-shell.css
  pages/           HomePage, BoardPage, ProjectsPage,
                   DiagramsPage, DiagramEditorPage
  components/      AppNav, Header, KanbanBoard, KanbanCell,
                   KanbanColumnHeader, KanbanLaneHeader,
                   TaskCardComponent, TaskModal, NewColumnModal,
                   ProjectModal, InlineName
```

## Configuration knobs (v1)

Port is `8080`. Database path is hard-coded to `user.home/.organizapp/organizapp.db` unless `organizapp.db.url` is set (Spring property; empty default). Web tests set that property to in-memory SQLite.

## Reset local data

Stop the server, delete the SQLite file (and `-wal` / `-shm` siblings if present), start again. The seed board, **Main** lane, welcome card, and seed project are recreated. BPMN diagrams are not.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| UI: Unable to connect | API not on 8080, or Vite started without the proxy target up |
| CORS error from a non-listed origin | Add the origin in `WebCorsConfig` |
| Port 8080 in use | Another `bootRun` still alive |
| `/api/diagrams` 404 while the UI shows BPMN | Old JVM without the new controller; restart `bootRun` |
| Empty or unexpected workspace | You are looking at an already-seeded home DB, not a fresh file |
| 8080 shows no board / old UI | `static/` is missing or stale; use Vite on 5173 while developing |
| BPMN canvas looks empty / palette clipped | Container height; the editor canvas is `absolute inset-0` inside a `flex-1 min-h-0` shell |
| Theme did not stick | `localStorage` blocked; default is Light |

## Adding a second client later

Desktop or Android can:

1. Depend on `:core` and use `KanbanService`, `ProjectService`, and `DiagramService` in-process (same DB file), or
2. Call this REST API (same contract as [api.md](api.md)).

Do not duplicate domain rules in the UI if they already belong in a `:core` service.
