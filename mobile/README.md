# :mobile Module (Android / Kotlin)

This module is reserved for a native Android app for **OrganizApp** using **Kotlin + Jetpack Compose**. It is **not implemented** in version 1.

## Option 1: Direct core import (offline-first)

Import `:core` as a JVM library in the Android build:

```kotlin
dependencies {
    implementation(project(":core"))
}
```

Domain models (`Board`, `TaskCard`, `Project`, `BpmnDiagram`, `Priority`), validation, and `KanbanService` / `ProjectService` / `DiagramService` can be called from Kotlin against the same SQLite file as the web app.

## Option 2: REST client (connected)

Point Retrofit or Ktor at the Spring Boot server. The contract is [docs/api.md](../docs/api.md). Examples:

- `GET http://<your-ip>:8080/api/board`
- `GET http://<your-ip>:8080/api/projects`
- `GET http://<your-ip>:8080/api/diagrams`
- `POST http://<your-ip>:8080/api/tasks`

There is no authentication in version 1. Use a machine-local IP, not `localhost`, from a physical device.
