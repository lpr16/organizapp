# User guide

This guide describes the **version 1** web app: a personal workspace stored on your machine. It has a home screen, a Kanban board with swimlanes, a project list, and a simple BPMN editor.

## Open the app

1. Start the Spring Boot server (`.\gradlew.bat :web:server:bootRun`).
2. Either:
   - open [http://localhost:5173](http://localhost:5173) while Vite is running (`npm run dev` in `web/frontend`), or
   - open [http://localhost:8080](http://localhost:8080) if a built copy of the UI is present under `web/server/src/main/resources/static/`.

Prefer **5173** while developing. Port 8080 only shows the last frontend copy that was built and copied into `static/`.

If the API is down, pages show a connection error and a retry button.

## First launch

The first time the database is created, you get:

- Board **My Personal Board** with columns **To Do**, **In Progress**, **Done**
- One swimlane named **Main**
- One welcome card in **To Do** / **Main** (priority High)
- One project named **OrganizApp workspace** (status Active, priority High)
- No BPMN diagrams until you create one

That data lives in `~/.organizapp/organizapp.db` (on Windows, `%USERPROFILE%\.organizapp\organizapp.db`). It persists across restarts.

## Navigation and theme

The top bar is always visible:

| Item | Where it goes |
|---|---|
| OrganizApp | Home |
| Home | `/` |
| Kanban | `/board` |
| Projects | `/projects` |
| BPMN | `/diagrams` |

The **Color theme** control on the right stores your choice in the browser (`organizapp.theme` in `localStorage`):

| Theme | Appearance |
|---|---|
| Light | Light (default for a new browser) |
| Dark | Dark |
| Dark blue | Dark navy canvas |
| Beige | Warm light |

Theme does not change your data. It only restyles the UI.

## Home

Home asks where you want to work. It loads the board, projects, and diagrams together and shows:

- **Board tasks** — all cards on the board
- **In progress** — cards in columns whose name contains `progress`
- **Done** — cards in columns whose name contains `done` or `complete`
- **Active projects** — projects with status Active

Three cards open Kanban, Projects, and BPMN. Those in-progress / done counts follow column *names*, so renaming **In Progress** or **Done** changes the stats.

## Kanban

The board is a **matrix**: columns across the top, swimlanes down the side. Each cell holds the cards for that column and lane.

The board header shows the board name (**My Personal Board** — display only; there is no rename), **Total** / **Active** / **Completed** counts (same name heuristics as Home), and **Add Lane**, **Add Column**, and **New Task**. On narrow viewports the stat pills hide; the action buttons remain.

### Tasks

**Create**

- **New Task** in the header, **+** on a column, or **Add card** in a cell.
- Required: title.
- Optional: description, priority (default Medium), due date, column, and lane.
- Column **+** puts the new card in the **first lane**.
- Cell **Add card** targets that column and lane.

**Edit**

Hover a card and click the pencil. You can change title, description, priority, due date, **column**, and **lane**. Saving a different column or lane moves the card.

**Delete**

Hover a card and click the trash icon. There is no confirmation dialog for task delete.

**Move and reorder**

- Drag using the **grip** handle on the card (visible on hover).
- Drop on another card in the same or another cell, or on an empty cell.
- The UI updates immediately. If the server move fails, the board reloads from the API.

A 5-pixel drag threshold avoids accidental moves when you click to edit.

### Columns

**Add**

**Add Column** in the header, or the **+** tile at the end of the column row. The name cannot be blank. New columns are appended on the right.

**Rename**

Click the column name and type. Enter or blur saves.

**Reorder**

Drag the vertical grip on the column header.

**Delete**

Trash icon on the column header. You must confirm. Deleting a column **also deletes every task in it**. You cannot delete the last remaining column.

### Swimlanes

Lanes are horizontal bands (for example Research vs Weekly). Every column is split by the same set of lanes.

**Add**

**Add Lane** in the header, or **+ Add lane** under the board. New lanes are appended at the bottom.

**Rename**

Click the lane name.

**Reorder**

Drag the horizontal grip on the lane header.

**Delete**

Trash on the lane header. You must confirm. Deleting a lane **also deletes every task in that lane**. You cannot delete the last remaining lane. A board that has never had lanes gets a **Main** lane automatically.

## Projects

**Projects** is a separate list, not linked to Kanban cards in this version.

**Create**

**New Project**. Required: name. Optional: description, status, priority, due date.

**Filter**

Chips for All, Planning, Active, On Hold, Completed.

**Edit**

Pencil on a card (visible on hover). You can change every field including status.

**Delete**

Trash on a card. You must confirm. This does not delete Kanban tasks.

### Project status

| Value | Meaning |
|---|---|
| `PLANNING` | Planning |
| `ACTIVE` | Active |
| `ON_HOLD` | On Hold |
| `COMPLETED` | Completed |

New projects default to Planning unless you pick another status. The seed project is Active.

## BPMN diagrams

**BPMN** lists saved processes. There is no seed diagram.

**Create**

**New diagram** creates **Untitled process** and opens the editor with a start event on the canvas.

**Open**

Click the name or **Open editor**.

**Delete**

Trash on a list card. You must confirm.

### Editor

The editor is a simple [bpmn-js](https://bpmn.io/) modeler, not a full BPMN suite.

**Palette (left)**

| Tool | What it does |
|---|---|
| Hand | Move the canvas |
| Lasso | Select |
| Connect | Draw a sequence flow between shapes |
| Start | Start event |
| End | End event |
| Task | Rounded rectangle activity |
| Decision | Exclusive gateway (XOR) |
| Parallel | Parallel gateway |

Click a shape tool, then click the canvas to place it. Use **Connect**, or the context pad on a selected shape, to join start → task → end.

**Name**

Click the title next to the back arrow to rename. That save is immediate.

**Save**

- **Save** in the header
- **Ctrl+S** / **Cmd+S**
- Autosave about 1.5 seconds after you change the diagram

The status text shows Saved, Unsaved, or Saving.

**Download**

**BPMN** in the header downloads `{name}.bpmn` (spaces become hyphens). That file is BPMN 2.0 XML. It is not executed anywhere in this version.

Reload the editor (or leave and come back) to confirm persistence.

## Priorities

Used on both Kanban cards and projects.

| Value | Meaning in the UI |
|---|---|
| `LOW` | Low |
| `MEDIUM` | Medium — default |
| `HIGH` | High |
| `URGENT` | Urgent |

Unknown priority strings from the API are treated as Medium.

## What this version does not do

No login, no sharing, no second board in the UI, no comments, attachments, labels, search, notifications, or live sync. Kanban cards are not linked to projects. BPMN diagrams are drawings only — they are not executed. See [Version 1 scope](version-1.md).
