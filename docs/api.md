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

**200** — the oldest board by `created_at`, including nested columns and tasks.

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
  ]
}
```

The version 1 UI uses only this endpoint to load the workspace.

### Get a board by id

```http
GET /api/board/{id}
```

| Status | When |
|---|---|
| **200** | Board exists |
| **404** | Unknown id |

A blank path segment is not useful in practice; the service treats a blank/null id as the default board, but Spring will not route an empty `{id}`.

## Tasks

### Create a task

```http
POST /api/tasks
```

```json
{
  "columnId": "a1b2c3d4-....",
  "title": "Write API docs",
  "description": "Cover every endpoint",
  "priority": "HIGH",
  "dueDate": "2026-09-20"
}
```

| Field | Required | Notes |
|---|---|---|
| `columnId` | yes | Must not be blank (`@NotBlank`) |
| `title` | yes | Must not be blank |
| `description` | no | Stored as `""` if omitted at the domain layer |
| `priority` | no | Parsed with `Priority.fromString`; default `MEDIUM` |
| `dueDate` | no | Opaque string (UI sends `YYYY-MM-DD`) |

**201** — created `TaskCard`. Position is the next index in that column.

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

`title` is required. This endpoint does **not** change column or position. Use [Move a task](#move-a-task).

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
  "newPosition": 0
}
```

| Field | Required |
|---|---|
| `targetColumnId` | yes |
| `newPosition` | yes (integer; negative values are clamped to `0`) |

**204** — no body. If the task id does not exist, the repository no-ops and the controller still returns 204.

Used by the UI after drag-and-drop.

### Delete a task

```http
DELETE /api/tasks/{id}
```

| Status | When |
|---|---|
| **204** | Deleted (neighbor positions compacted) |
| **404** | Unknown id |

The version 1 UI does not currently call `GET` for a single task. `KanbanService.getTask` exists in core but has no HTTP mapping.

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

### Delete a column

```http
DELETE /api/columns/{id}
```

| Status | When |
|---|---|
| **204** | Column and its tasks deleted |
| **404** | Unknown id |

## Status code summary

| Code | Typical cause |
|---|---|
| 200 | GET/PUT success |
| 201 | POST create |
| 204 | PATCH move, DELETE success |
| 400 | Jakarta `@Valid` on the request body |
| 404 | Missing board (GET by id), task, or column on delete |
| 500 | Service `IllegalArgumentException`, FK violation, or other uncaught errors |

There is no problem-details wrapper and no dedicated exception handler in version 1.

## Frontend mapping

| UI action | Request |
|---|---|
| Load workspace | `GET /api/board` |
| New task | `POST /api/tasks` |
| Save task edits | `PUT /api/tasks/{id}` |
| Drag card | `PATCH /api/tasks/{id}/move` |
| Delete card | `DELETE /api/tasks/{id}` |
| Add column | `POST /api/columns` |
| Delete column | `DELETE /api/columns/{id}` |
