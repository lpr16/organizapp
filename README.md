# OrganizApp

Version **0.1.0-SNAPSHOT** — a personal Kanban board for a single local user.

OrganizApp is a modular Java project with a React web UI. Domain rules and SQLite persistence live in `:core`. The first shipping surface is a Spring Boot REST API plus a Vite/React board. Desktop and Android folders exist as reserved connection points; they are not implemented in this version.

## What version 1 can do

- One personal board, seeded on first launch as **My Personal Board**
- Default columns: **To Do**, **In Progress**, **Done**
- Create, edit, delete, and drag-and-drop tasks (within a column or across columns)
- Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and optional due date
- Add and delete columns
- Local SQLite file under your home directory — no account, no cloud

## Documentation

| Document | Audience |
|---|---|
| [User guide](docs/user-guide.md) | Using the board in the browser |
| [Architecture](docs/architecture.md) | How modules, ports, and the UI fit together |
| [Data model](docs/data-model.md) | Entities, SQLite schema, and seed data |
| [HTTP API](docs/api.md) | REST endpoints, request bodies, and status codes |
| [Development](docs/development.md) | Prerequisites, run/test/build, and conventions |
| [Version 1 scope](docs/version-1.md) | What is in, what is out, and known limits |

## Quick start

**Prerequisites:** JDK 21+, Node.js 20+ (only for frontend development), and the Gradle wrapper in this repo.

### Run the API (and any copied static UI)

```powershell
.\gradlew.bat :web:server:bootRun
```

Open [http://localhost:8080](http://localhost:8080). If `web/server/src/main/resources/static/` contains a built frontend, the board loads there. The API is always at `/api/*`.

### Develop the UI with hot reload

Terminal 1:

```powershell
.\gradlew.bat :web:server:bootRun
```

Terminal 2:

```powershell
cd web/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to `http://localhost:8080`.

### Tests

```powershell
.\gradlew.bat test
```

## Repository layout

```
organizapp/
├── core/                 Java domain, KanbanService, SQLite repository
├── web/                  Web leg — see web/README.md
│   ├── server/           Spring Boot 3 REST API (`:web:server`)
│   └── frontend/         React 19 + TypeScript + Tailwind 4 + @dnd-kit
├── desktop/              Reserved (JavaFX) — not in v1
├── mobile/               Reserved (Kotlin / Compose) — not in v1
├── docs/                 Version 1 documentation
└── gradle/wrapper/       Gradle 9.6 wrapper
```

## Persistence

SQLite is created automatically:

| OS | Path |
|---|---|
| Windows | `%USERPROFILE%\.organizapp\organizapp.db` |
| macOS / Linux | `~/.organizapp/organizapp.db` |

Deleting that file resets the board to the seeded welcome state on next start.
