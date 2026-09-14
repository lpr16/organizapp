# :web Module

The shipping client for OrganizApp version 1: a Spring Boot API and a React SPA that share the Kanban rules in `:core`.

```
web/
├── server/      Gradle module `:web:server` — REST API on port 8080
└── frontend/    Vite app — board UI (dev server on port 5173)
```

`:web:server` depends on `:core`. The frontend is an npm project, not a Gradle subproject. It talks to the API over HTTP (`/api`).

## How it connects to :core

`AppConfig` wires `SqliteBoardRepository` and `KanbanService` as Spring beans. Controllers call the service and return domain records as JSON. The same SQLite file (`~/.organizapp/organizapp.db`) is what a future desktop client would open in-process.

## Run

API:

```powershell
.\gradlew.bat :web:server:bootRun
```

UI with hot reload (API must already be up):

```powershell
cd web/frontend
npm install
npm run dev
```

- Board (development): [http://localhost:5173](http://localhost:5173) — Vite proxies `/api` to port 8080
- API and optional embedded UI: [http://localhost:8080](http://localhost:8080)

Gradle does not build or copy the frontend. To refresh files under `server/src/main/resources/static/`, run `npm run build` in `frontend/` and copy `dist/*` there.

## Docs

Product-wide reference lives in `/docs`, not in this folder:

- [Architecture](../docs/architecture.md)
- [HTTP API](../docs/api.md)
- [Development](../docs/development.md)
- [User guide](../docs/user-guide.md)

Frontend-specific notes: [frontend/README.md](frontend/README.md).
