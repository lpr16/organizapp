# HTTP API

Base URL: `http://localhost:8080`

All JSON request bodies use `Content-Type: application/json`. Domain records are returned as-is (camelCase field names).

CORS is enabled for `/api/**` from `http://localhost:5173`, `http://127.0.0.1:5173`, and `http://localhost:3000`.

There is no authentication in version 1.

## Boards

### Get the default board

```http
GET /api/board
```

**200** — the oldest board by `created_at`, including nested columns, lanes, and tasks.

```json
{
  "id": "default-board",
  "name": "My Personal Board",
  "createdAt": "2026-09-14T05:32:00Z",
  "columns": [
    {
      "id": "a1b2c3d4-...",
      "boardId": "default-board",
      "name": "To Do",
      "position": 0,
      "tasks": [
        {
          "id": "e5f6...",
          "columnId": "a1b2c3d4-...",
          "laneId": "f7a8...",
          "title": "Welcome to OrganizApp! 🚀",
          "description": "This is your personal Kanban board. Drag this card to 'In Progress' or click to edit it.",
          "priority": "HIGH",
          "position": 0,
          "dueDate": null,
          "createdAt": "2026-09-14T05:32:00Z",
          "updatedAt": "2026-09-14T05:32:00Z"
        }
      ]
    }
  ],
  "lanes": [
    {
      "id": "f7a8...",
      "boardId": "default-board",
      "name": "Main",
      "position": 0
    }
  ]
}
```

The UI uses this endpoint to load the Kanban workspace. Home also calls it for task counts.

### Get a board by id

```http
GET /api/board/{id}
```

| Status | When |
|---|---|
| **200** | Board exists |
| **404** | Unknown id |

A blank path segment is not useful in practice; the service treats a blank/null id as the default board, but Spring will not route an empty `{id}`.

The version 1 UI always loads the default board via `GET /api/board`.

## Tasks

### Create a task

```http
POST /api/tasks
```

```json
{
  "columnId": "a1b2c3d4-....",
  "laneId": "f7a8-....",
  "title": "Write API docs",
  "description": "Cover every endpoint",
  "priority": "HIGH",
  "dueDate": "2026-09-20"
}
```

| Field | Required | Notes |
|---|---|---|
| `columnId` | yes | Must not be blank (`@NotBlank`) |
| `laneId` | no | Blank/omitted uses the board’s first lane |
| `title` | yes | Must not be blank |
| `description` | no | Stored as `""` if omitted at the domain layer |
| `priority` | no | Parsed with `Priority.fromString`; default `MEDIUM` |
| `dueDate` | no | Opaque string (UI sends `YYYY-MM-DD`) |

**201** — created `TaskCard`. Position is the next index in that `(columnId, laneId)` cell.

**400** — validation failure (missing title or columnId). Spring’s default error JSON.

If `columnId` does not exist, SQLite foreign-key enforcement surfaces as a **500**.

### Update a task

```http
PUT /api/tasks/{id}
```

```json
{
  "title": "Updated title",
  "description": "New notes",
  "priority": "LOW",
  "dueDate": "2026-10-01"
}
```

`title` is required. This endpoint does **not** change column, lane, or position. Use [Move a task](#move-a-task). The UI may call both: `PUT` for fields, then `PATCH .../move` if the modal changed column or lane.

| Status | When |
|---|---|
| **200** | Updated card |
| **400** | Blank title |
| **500** | Unknown id (`IllegalArgumentException`: `Task not found with id: …`) |

### Move a task

```http
PATCH /api/tasks/{id}/move
```

```json
{
  "targetColumnId": "col-in-progress-id",
  "targetLaneId": "lane-main-id",
  "newPosition": 0
}
```

| Field | Required |
|---|---|
| `targetColumnId` | yes |
| `targetLaneId` | no (blank uses the first lane) |
| `newPosition` | yes (integer; negative values are clamped to `0`) |

**204** — no body. If the task id does not exist, the repository no-ops and the controller still returns 204.

Used by the UI after drag-and-drop and after changing column/lane in the task modal.

### Delete a task

```http
DELETE /api/tasks/{id}
```

| Status | When |
|---|---|
| **204** | Deleted (neighbor positions compacted in that cell) |
| **404** | Unknown id |

`KanbanService.getTask` exists in core but has no HTTP mapping. The UI does not fetch a single task.

## Columns

### Create a column

```http
POST /api/columns
```

```json
{
  "boardId": "default-board",
  "name": "Review / QA"
}
```

Both fields are required and non-blank.

**201** — `BoardColumn` with `tasks: []` and `position` equal to the current column count.

**400** — validation failure.

**500** — unknown `boardId` (`Board not found: …`).

### Rename a column

```http
PUT /api/columns/{id}
```

```json
{
  "name": "Backlog"
}
```

`name` is required and non-blank.

| Status | When |
|---|---|
| **200** | Updated `BoardColumn` |
| **400** | Blank name |
| **500** | Unknown id |

### Reorder columns

```http
PATCH /api/columns/reorder
```

```json
{
  "boardId": "default-board",
  "columnIds": ["col-b", "col-a", "col-c"]
}
```

`boardId` and a non-empty `columnIds` list are required. Positions are rewritten to `0..n-1` in list order.

**204** — no body.

**500** — unknown board or invalid reorder.

### Delete a column

```http
DELETE /api/columns/{id}
```

| Status | When |
|---|---|
| **204** | Column and its tasks deleted |
| **404** | Unknown id |
| **500** | Attempt to delete the last remaining column |

## Lanes

### Create a lane

```http
POST /api/lanes
```

```json
{
  "boardId": "default-board",
  "name": "Research"
}
```

Both fields are required and non-blank.

**201** — `BoardLane` with `position` equal to the current lane count.

**400** — validation failure.

**500** — unknown `boardId`.

### Rename a lane

```http
PUT /api/lanes/{id}
```

```json
{
  "name": "Weekly"
}
```

| Status | When |
|---|---|
| **200** | Updated `BoardLane` |
| **400** | Blank name |
| **500** | Unknown id |

### Reorder lanes

```http
PATCH /api/lanes/reorder
```

```json
{
  "boardId": "default-board",
  "laneIds": ["lane-b", "lane-a"]
}
```

**204** — no body.

**500** — unknown board or invalid reorder.

### Delete a lane

```http
DELETE /api/lanes/{id}
```

| Status | When |
|---|---|
| **204** | Lane and its tasks deleted |
| **404** | Unknown id |
| **500** | Attempt to delete the last remaining lane |

## Projects

### List projects

```http
GET /api/projects
```

**200** — array of `Project`, oldest first (`ORDER BY created_at ASC`).

### Get a project

```http
GET /api/projects/{id}
```

| Status | When |
|---|---|
| **200** | Project exists |
| **404** | Unknown id |

The version 1 UI does not call this endpoint; it uses the list.

### Create a project

```http
POST /api/projects
```

```json
{
  "name": "Literature review",
  "description": "Papers for the next milestone",
  "status": "ACTIVE",
  "priority": "HIGH",
  "dueDate": "2026-10-01"
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Non-blank |
| `description` | no | Stored as `""` if omitted |
| `status` | no | `ProjectStatus.fromString`; default `PLANNING` |
| `priority` | no | `Priority.fromString`; default `MEDIUM` |
| `dueDate` | no | Opaque string |

**201** — created `Project`.

**400** — missing name.

### Update a project

```http
PUT /api/projects/{id}
```

Same body as create. `name` is required.

| Status | When |
|---|---|
| **200** | Updated project |
| **400** | Blank name |
| **500** | Unknown id |

### Delete a project

```http
DELETE /api/projects/{id}
```

| Status | When |
|---|---|
| **204** | Deleted |
| **404** | Unknown id |

Does not affect Kanban tasks.

## Diagrams

### List diagrams

```http
GET /api/diagrams
```

**200** — array of `BpmnDiagram`, most recently updated first. Each row has `xml: ""`. Use get-by-id for the document.

### Get a diagram

```http
GET /api/diagrams/{id}
```

| Status | When |
|---|---|
| **200** | Full record including XML |
| **404** | Unknown id |

### Create a diagram

```http
POST /api/diagrams
```

```json
{
  "name": "Untitled process",
  "xml": null
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Non-blank |
| `xml` | no | Blank/omitted stores `BpmnDiagram.EMPTY_XML` |

**201** — created diagram with XML.

**400** — missing name.

### Update a diagram

```http
PUT /api/diagrams/{id}
```

```json
{
  "name": "Intake process",
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
}
```

Either field may be omitted. `null` XML keeps the stored document. A name that is present but blank is rejected.

| Status | When |
|---|---|
| **200** | Updated diagram (includes XML) |
| **500** | Unknown id, or blank name when a name was sent |

### Delete a diagram

```http
DELETE /api/diagrams/{id}
```

| Status | When |
|---|---|
| **204** | Deleted |
| **404** | Unknown id |

## Status code summary

| Code | Typical cause |
|---|---|
| 200 | GET/PUT success |
| 201 | POST create |
| 204 | PATCH move/reorder, DELETE success |
| 400 | Jakarta `@Valid` on the request body |
| 404 | Missing board/project/diagram (GET by id), or DELETE when nothing was removed |
| 500 | Service `IllegalArgumentException` (including last column/lane, missing entity on PUT), FK violation, or other uncaught errors |

There is no problem-details wrapper and no dedicated exception handler in version 1.

## Frontend mapping

| UI action | Request |
|---|---|
| Home dashboard | `GET /api/board`, `GET /api/projects`, `GET /api/diagrams` |
| Load Kanban | `GET /api/board` |
| New task | `POST /api/tasks` |
| Save task fields | `PUT /api/tasks/{id}` |
| Drag card or change column/lane in the modal | `PATCH /api/tasks/{id}/move` |
| Delete card | `DELETE /api/tasks/{id}` |
| Add / rename / reorder / delete column | `POST /api/columns`, `PUT /api/columns/{id}`, `PATCH /api/columns/reorder`, `DELETE /api/columns/{id}` |
| Add / rename / reorder / delete lane | `POST /api/lanes`, `PUT /api/lanes/{id}`, `PATCH /api/lanes/reorder`, `DELETE /api/lanes/{id}` |
| List / create / edit / delete project | `GET /api/projects`, `POST /api/projects`, `PUT /api/projects/{id}`, `DELETE /api/projects/{id}` |
| List / create diagrams | `GET /api/diagrams`, `POST /api/diagrams` |
| Open / save / rename / delete diagram | `GET /api/diagrams/{id}`, `PUT /api/diagrams/{id}`, `DELETE /api/diagrams/{id}` |
