# Data model

Version 1 stores one default board, its columns, and its cards in a single SQLite file.

## Domain types

### `Board`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID, or `default-board` for the seed) | Primary key |
| `name` | string | Display name |
| `createdAt` | `Instant` | Set at creation |
| `columns` | list of `BoardColumn` | Ordered by `position` ascending |

### `BoardColumn`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `boardId` | string | Parent board |
| `name` | string | Display name; not unique |
| `position` | int | 0-based order on the board |
| `tasks` | list of `TaskCard` | Ordered by `position` ascending |

### `TaskCard`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `columnId` | string | Current column |
| `title` | string | Required, trimmed on write |
| `description` | string | Empty string if omitted on create |
| `priority` | `Priority` | Default `MEDIUM` |
| `position` | int | 0-based order inside the column |
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

## SQLite schema

Created by `SqliteBoardRepository.initSchema()` on first connection (`CREATE TABLE IF NOT EXISTS`). Foreign keys are enabled with `PRAGMA foreign_keys = ON`.

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
```

Timestamps are stored as ISO-8601 text (`Instant.toString()`). Priority is stored as the enum name (`HIGH`, not the label).

## File location

| Constructor | Database |
|---|---|
| `new SqliteBoardRepository()` | `{user.home}/.organizapp/organizapp.db` |
| `new SqliteBoardRepository(jdbcUrl)` | Whatever the URL points at (tests use in-memory) |

The production Spring bean uses the file constructor. The directory is created if missing.

## Seed

If `boards` is empty:

1. Insert board `id = default-board`, name `My Personal Board`.
2. Insert three columns: **To Do** (0), **In Progress** (1), **Done** (2), each with a new UUID.
3. Insert one task in To Do: title `Welcome to OrganizApp! 🚀`, priority `HIGH`, no due date.

The seed runs once. Later starts load existing rows.

`getDefaultBoard()` is **not** “the row named default-board”. It is `SELECT id FROM boards ORDER BY created_at ASC LIMIT 1`.

## Position maintenance

- **Create task:** `position = MAX(position) + 1` in that column (or `0` if empty). The service passes `0`; the repository overwrites it.
- **Delete task:** remaining cards with a higher position in that column decrement by 1.
- **Move within a column:** neighbor positions shift to close the gap and open the destination slot, then the card’s position is set.
- **Move across columns:** source neighbors decrement; destination neighbors at `>= newPosition` increment; then the card’s `column_id` and `position` update.
- **Delete column:** the column row is deleted; tasks go with it via cascade. Sibling column `position` values are **not** compacted.

Moves and task deletes run in a transaction (`setAutoCommit(false)`).

## TypeScript mirror

`web/frontend/src/types/kanban.ts` uses the same field names. Dates arrive as strings from JSON. `dueDate` is typed `string | null`.
