# Data model

Version 1 stores one default board (columns, lanes, and cards), a project list, and BPMN diagrams in a single SQLite file.

## Domain types

### `Board`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID, or `default-board` for the seed) | Primary key |
| `name` | string | Display name |
| `createdAt` | `Instant` | Set at creation |
| `columns` | list of `BoardColumn` | Ordered by `position` ascending |
| `lanes` | list of `BoardLane` | Ordered by `position` ascending |

### `BoardColumn`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `boardId` | string | Parent board |
| `name` | string | Display name; not unique |
| `position` | int | 0-based order left to right |
| `tasks` | list of `TaskCard` | All cards in this column (every lane), ordered by `position` |

### `BoardLane`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `boardId` | string | Parent board |
| `name` | string | Display name; not unique |
| `position` | int | 0-based order top to bottom |

Lanes have no nested task list. Cards point at a lane via `TaskCard.laneId`. The UI groups cards into cells by `(columnId, laneId)`.

### `TaskCard`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `columnId` | string | Current column |
| `laneId` | string | Current lane |
| `title` | string | Required, trimmed on write |
| `description` | string | Empty string if omitted on create |
| `priority` | `Priority` | Default `MEDIUM` |
| `position` | int | 0-based order inside the **cell** `(columnId, laneId)` |
| `dueDate` | string or null | UI uses `YYYY-MM-DD`; not parsed as a date in core |
| `createdAt` | `Instant` | Set on create |
| `updatedAt` | `Instant` | Set on create, update, and move |

### `Priority`

| Name | Label | Level |
|---|---|---|
| `LOW` | Low | 1 |
| `MEDIUM` | Medium | 2 |
| `HIGH` | High | 3 |
| `URGENT` | Urgent | 4 |

`fromString` uppercases the input. Null or illegal values become `MEDIUM`.

### `Project`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `name` | string | Required, trimmed |
| `description` | string | Empty string if omitted |
| `status` | `ProjectStatus` | Default `PLANNING` on create |
| `priority` | `Priority` | Default `MEDIUM` |
| `dueDate` | string or null | Opaque `YYYY-MM-DD` |
| `createdAt` | `Instant` | Set on create |
| `updatedAt` | `Instant` | Set on create and update |

Projects are **not** foreign-keyed to boards or tasks.

### `ProjectStatus`

| Name | UI label |
|---|---|
| `PLANNING` | Planning |
| `ACTIVE` | Active |
| `ON_HOLD` | On Hold |
| `COMPLETED` | Completed |

`fromString` maps null or unknown values to `PLANNING`.

### `BpmnDiagram`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `name` | string | Required, trimmed |
| `xml` | string | BPMN 2.0 XML; list responses set this to `""` |
| `createdAt` | `Instant` | Set on create |
| `updatedAt` | `Instant` | Set on create and update |

`BpmnDiagram.EMPTY_XML` is a minimal definitions document with one start event (`StartEvent_1`, name `Start`) at bounds `(180, 150, 36, 36)`. `create` uses that XML when the caller passes null or blank XML.

`withoutXml()` is how list rows hide the document body.

## SQLite schema

Created by `SqliteBoardRepository.initSchema()` on first connection (`CREATE TABLE IF NOT EXISTS`). Foreign keys are enabled with `PRAGMA foreign_keys = ON`.

Existing databases created before swimlanes get `lane_id` via `ALTER TABLE task_cards ADD COLUMN lane_id TEXT` when the column is missing. `ensureDefaultLanes` then inserts a **Main** lane and backfills `lane_id` on existing cards.

```sql
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS board_columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS board_lanes (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_cards (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL,
    position INTEGER NOT NULL,
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(column_id) REFERENCES board_columns(id) ON DELETE CASCADE
);
-- lane_id TEXT is added with ALTER TABLE on existing files

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bpmn_diagrams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    xml TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

Timestamps are stored as ISO-8601 text (`Instant.toString()`). Priority and project status are stored as enum names (`HIGH`, `ACTIVE`), not labels.

`lane_id` is not declared as a foreign key on the original `CREATE TABLE` (the column is added later). Deleting a lane deletes matching `task_cards` rows in application code, then deletes the lane row.

## File location

| Constructor | Database |
|---|---|
| `new SqliteBoardRepository()` | `{user.home}/.organizapp/organizapp.db` |
| `new SqliteBoardRepository(jdbcUrl)` | Whatever the URL points at (tests use in-memory) |

The production Spring bean uses the file constructor unless `organizapp.db.url` is set. The directory is created if missing.

## Seed

If `boards` is empty:

1. Insert board `id = default-board`, name `My Personal Board`.
2. Insert three columns: **To Do** (0), **In Progress** (1), **Done** (2), each with a new UUID.
3. Insert one task in To Do: title `Welcome to OrganizApp! 🚀`, priority `HIGH`, no due date.
4. `ensureDefaultLanes` inserts lane **Main** and sets `lane_id` on that task.

If a board already exists but has no lanes, **Main** is still inserted and existing tasks are backfilled. The seed board itself runs only when `boards` is empty.

If `projects` is empty, insert **OrganizApp workspace**, status `ACTIVE`, priority `HIGH`.

`bpmn_diagrams` is not seeded.

`getDefaultBoard()` is **not** “the row named default-board”. It is `SELECT id FROM boards ORDER BY created_at ASC LIMIT 1`.

## Position maintenance

- **Create task:** `position = MAX(position) + 1` in that `(column_id, lane_id)` cell (or `0` if empty). The service passes `0`; the repository overwrites it.
- **Delete task:** remaining cards with a higher position in that cell decrement by 1.
- **Move within a cell:** neighbor positions shift to close the gap and open the destination slot, then the card’s position is set.
- **Move across cells:** source neighbors decrement; destination neighbors at `>= newPosition` increment; then the card’s `column_id`, `lane_id`, and `position` update.
- **Reorder columns / lanes:** `position` is rewritten to match the submitted id order.
- **Delete column:** the column row is deleted; tasks go with it via cascade. Sibling column `position` values are **not** compacted.
- **Delete lane:** tasks with that `lane_id` are deleted in code; then the lane row is deleted. Sibling lane positions are **not** compacted.

Moves and task deletes run in a transaction (`setAutoCommit(false)`).

## TypeScript mirror

`web/frontend/src/types/kanban.ts` uses the same field names (`Board`, `BoardColumn`, `BoardLane`, `TaskCard`, `Project`, `BpmnDiagram`, `Priority`, `ProjectStatus`). Dates arrive as strings from JSON. `dueDate` is typed `string | null`.
