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
- SQLite: `%USERPROFILE%\.organizapp\organizapp.db` on Windows

### UI with hot module replacement

Keep the API running, then:

```powershell
cd web\frontend
npm run dev
```

- UI: [http://localhost:5173](http://localhost:5173)
- `/api` is proxied to `http://localhost:8080` (`web/frontend/vite.config.ts`)

### Embedded UI on port 8080

Spring serves `web/server/src/main/resources/static/`. There is **no** Gradle task that runs `npm run build` or copies `web/frontend/dist`. To refresh the embedded UI:

```powershell
cd web\frontend
npm run build
# copy dist/* into web/server/src/main/resources/static/
```

Hashed asset filenames change every build. Replace the previous `assets/` files.

## Scripts and tasks

| Command | What it does |
|---|---|
| `.\gradlew.bat test` | `:core` unit tests + `:web:server` MockMvc test |
| `.\gradlew.bat :core:test` | Kanban + SQLite tests only |
| `.\gradlew.bat :web:server:bootRun` | Start the API |
| `.\gradlew.bat :web:server:bootJar` | Fat JAR under `web/server/build/libs/` |
| `npm run dev` | Vite HMR (from `web/frontend`) |
| `npm run build` | `tsc -b && vite build` → `web/frontend/dist/` |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview the production Vite build |

## Tests

### `:core` — `KanbanServiceTest`

Each test builds `SqliteBoardRepository` with a unique in-memory URL:

```text
jdbc:sqlite:file:memdb_<uuid>?mode=memory&cache=shared
```

Coverage includes seed data, create/update/delete/move, blank-title rejection, and adding a column.

### `:web:server` — `BoardControllerTest`

`@SpringBootTest` + `MockMvc` hits `GET /api/board` and asserts name `My Personal Board` and first column `To Do`.

This test uses the **production** `SqliteBoardRepository` bean, so it talks to the real file database in your home directory. It is not isolated the way core tests are.

## Project conventions

- Group: `com.organizapp`, version `0.1.0-SNAPSHOT` (`build.gradle.kts`).
- Domain objects are Java records. Do not put Spring annotations in `:core`.
- New HTTP operations: DTO with Jakarta validation → controller → `KanbanService` → port.
- New persistence operations: add a method on `BoardRepository` and implement it in `SqliteBoardRepository` (keep position updates transactional).
- Frontend types in `src/types/kanban.ts` must stay aligned with Jackson’s record serialization.
- Keep API paths under `/api`. CORS only lists local Vite/CRA origins.

## Package layout

```
core/src/main/java/com/organizapp/core/
  domain/          Board, BoardColumn, TaskCard, Priority
  service/         KanbanService
  port/            BoardRepository
  storage/         SqliteBoardRepository

web/server/src/main/java/com/organizapp/web/
  OrganizappApplication.java
  config/          AppConfig, WebCorsConfig
  controller/      BoardController, TaskController, ColumnController
  dto/             Create/Update/Move request records

web/frontend/src/
  main.tsx, App.tsx, index.css
  api/client.ts
  types/kanban.ts
  components/      Header, KanbanColumnComponent, TaskCardComponent,
                   TaskModal, NewColumnModal
```

## Configuration knobs (v1)

Almost none. Port is `8080`. Database path is hard-coded to `user.home/.organizapp/organizapp.db`. To point tests or experiments at another file, construct `SqliteBoardRepository` with a JDBC URL (the Spring bean does not read a property for this yet).

## Reset local data

Stop the server, delete the SQLite file (and `-wal` / `-shm` siblings if present), start again. The seed board is recreated.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| UI: Unable to Connect | API not on 8080, or Vite started without the proxy target up |
| CORS error from a non-listed origin | Add the origin in `WebCorsConfig` |
| Port 8080 in use | Another `bootRun` still alive |
| Empty or unexpected board | You are looking at an already-seeded home DB, not a fresh file |
| 8080 shows no board / old UI | `static/` is missing or stale; use Vite on 5173 while developing |

## Adding a second client later

Desktop or Android can:

1. Depend on `:core` and use `KanbanService` in-process (same DB file), or
2. Call this REST API (same contract as [api.md](api.md)).

Do not duplicate Kanban rules in the UI if they already belong in `KanbanService`.
