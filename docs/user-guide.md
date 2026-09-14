# User guide

This guide describes the **version 1** web board: a single personal Kanban workspace stored on your machine.

## Open the app

1. Start the Spring Boot server (`.\gradlew.bat :web:server:bootRun`).
2. Either:
   - open [http://localhost:5173](http://localhost:5173) while Vite is running (`npm run dev` in `web/frontend`), or
   - open [http://localhost:8080](http://localhost:8080) if a built copy of the UI is present under `web/server/src/main/resources/static/`.

If the API is down, the UI shows **Unable to Connect** and a **Retry Connection** button.

## First launch

The first time the database is created, you get:

- Board name: **My Personal Board**
- Columns: **To Do**, **In Progress**, **Done**
- One welcome card in **To Do** (priority High)

That data lives in `~/.organizapp/organizapp.db` (on Windows, `%USERPROFILE%\.organizapp\organizapp.db`). It persists across restarts.

## Board header

The header shows:

- **OrganizApp / Personal** and the board name
- Counts for **Total**, **Active**, and **Completed**
  - Active = tasks in columns whose name contains `progress` (case-insensitive)
  - Completed = tasks in columns whose name contains `done` or `complete`
- **Add Column** and **New Task**

On narrow viewports the stat pills hide; the action buttons remain.

## Tasks

### Create

- **New Task** in the header, or **+** on a column, or **+ Add a new task** in an empty column.
- Required: title and a target column.
- Optional: description, priority (default Medium), due date.
- When you create from the header, the first column is preselected unless you opened the modal from a specific column.

Editing an existing task locks the column dropdown. Change column by dragging the card, not by editing.

### Edit

Hover a card and click the pencil. You can change title, description, priority, and due date.

### Delete

Hover a card and click the trash icon. There is no confirmation dialog for task delete.

### Move and reorder

- Drag using the **grip** handle on the right of the card (visible on hover).
- Drop on another card to insert at that index, or on an empty column body to move there.
- The UI updates immediately. If the server move fails, the board reloads from the API.

A 5-pixel drag threshold avoids accidental moves when you click to edit.

## Columns

### Add

**Add Column** in the header, or the dashed **Add another column** tile at the end of the board. The name cannot be blank. New columns are appended on the right.

### Delete

Trash icon on the column header. You must confirm. Deleting a column **also deletes every task in it** (database foreign key `ON DELETE CASCADE`).

There is no rename or reorder for columns in version 1.

## Priorities

| Value | Meaning in the UI |
|---|---|
| `LOW` | Low (slate) |
| `MEDIUM` | Medium (sky) — default |
| `HIGH` | High (amber) |
| `URGENT` | Urgent (rose) |

Unknown priority strings from the API are treated as Medium.

## What this version does not do

No login, no multiple boards in the UI, no comments, no attachments, no search, no labels, no notifications, and no sync between browsers. See [Version 1 scope](version-1.md).
