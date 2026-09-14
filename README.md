# OrganizApp

Version **0.1.0-SNAPSHOT** — a personal workspace for one local user: Kanban, projects, and simple BPMN diagrams.

OrganizApp is a modular Java project with a React web UI. Domain rules and SQLite persistence live in `:core`. The shipping surface is a Spring Boot REST API plus a Vite/React SPA. Desktop and Android folders exist as reserved connection points; they are not implemented in this version.

## What this version can do

- **Home** dashboard with board, project, and diagram counts
- **Kanban** board with columns × swimlanes, drag-and-drop cards, inline column/lane rename and reorder
- **Projects** list with status, priority, and due date
- **BPMN** list and editor (start, task, decision, parallel, end) persisted as XML
- Four color themes (Light, Dark, Dark blue, Beige)
- Local SQLite file under your home directory — no account, no cloud

## Documentation

| Document | Audience |
|---|---|
| [User guide](docs/user-guide.md) | Using Home, Kanban, Projects, and BPMN in the browser |
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

Open [http://localhost:8080](http://localhost:8080). If `web/server/src/main/resources/static/` contains a built frontend, the SPA loads there. The API is always at `/api/*`.

While developing, use Vite on port 5173. The copy served on 8080 is only as fresh as the last manual `npm run build` + copy into `static/`.

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
├── core/                 Java domain, services, SQLite repository
├── web/                  Web leg — see web/README.md
│   ├── server/           Spring Boot 3 REST API (`:web:server`)
│   └── frontend/         React 19 + TypeScript + Tailwind 4 + bpmn-js
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

Deleting that file resets the workspace to the seeded welcome state on next start (board, default project). BPMN diagrams are not seeded.

Do not commit that database file. It is personal local data.
