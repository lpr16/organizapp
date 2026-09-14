# OrganizApp 🚀

A modular, personal organization and project management system built with **Clean Architecture**.

- **`:core`**: Pure Java 25 domain logic, entities, services, and **SQLite** embedded persistence.
- **`:web:server`**: Spring Boot 3 REST API exposing the `:core` Kanban service.
- **`web/frontend`**: Modern Web UI built with **React 19 + TypeScript + Tailwind CSS + @dnd-kit**.
- **`:desktop` & `:mobile`**: Reserved connection points ready to plug into `:core`.

---

## ⚡ Quick Start

### 1. Run the Entire Web App (Spring Boot + Built Frontend)
To run the server with the embedded React UI on `http://localhost:8080`:

```powershell
.\gradlew.bat :web:server:bootRun
```
Then open your browser to **http://localhost:8080**.

### 2. Frontend Development Mode (Instant Hot-Reload)
When developing the React UI with instant Hot Module Replacement:

1. In terminal 1, start the Spring Boot API:
   ```powershell
   .\gradlew.bat :web:server:bootRun
   ```
2. In terminal 2, start the Vite dev server:
   ```powershell
   cd web/frontend
   npm run dev
   ```
   Open **http://localhost:5173**. Vite proxies `/api` calls directly to Spring Boot at `http://localhost:8080`.

---

## 🧪 Running Automated Tests

Run unit tests for `:core` and integration tests for `:web:server`:

```powershell
.\gradlew.bat test
```

---

## 📁 Database

OrganizApp uses **SQLite** stored automatically at:
- Windows: `C:\Users\<User>\.organizapp\organizapp.db`

The database auto-creates tables and seeds an initial Kanban board with *"To Do"*, *"In Progress"*, and *"Done"* columns.
