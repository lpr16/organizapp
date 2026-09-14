# :web Module

The shipping client for OrganizApp version 1: a Spring Boot API and a React SPA that share Kanban, project, and diagram rules in `:core`.

```
web/
├── server/      Gradle module `:web:server` — REST API on port 8080
└── frontend/    Vite app — Home, Kanban, Projects, BPMN (dev server on port 5173)
```

`:web:server` depends on `:core`. The frontend is an npm project, not a Gradle subproject. It talks to the API over HTTP (`/api`).

## How it connects to :core

`AppConfig` wires `SqliteBoardRepository` plus `KanbanService`, `ProjectService`, and `DiagramService` as Spring beans. Controllers call those services and return domain records as JSON. The same SQLite file (`~/.organizapp/organizapp.db`) is what a future desktop client would open in-process.

Optional `organizapp.db.url` overrides the JDBC URL (web tests use in-memory SQLite).

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

- App (development): [http://localhost:5173](http://localhost:5173) — Vite proxies `/api` to port 8080
- API and optional embedded UI: [http://localhost:8080](http://localhost:8080)

Gradle does not build or copy the frontend. To refresh files under `server/src/main/resources/static/`, run `npm run build` in `frontend/` and copy `dist/*` there. `SpaRedirectConfig` forwards `/board`, `/projects`, `/diagrams`, and `/diagrams/{id}` to `index.html`.

## Docs

Product-wide reference lives in `/docs`, not in this folder:

- [User guide](../docs/user-guide.md)
- [Architecture](../docs/architecture.md)
- [HTTP API](../docs/api.md)
- [Development](../docs/development.md)

Frontend-specific notes: [frontend/README.md](frontend/README.md).
