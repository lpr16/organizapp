# :desktop Module (JavaFX)

This module is reserved for a native desktop UI for **OrganizApp** using **JavaFX 21+** and **AtlantaFX**. It is **not implemented** in version 1.

## How it would connect to :core

In `desktop/build.gradle.kts`, import `:core`:

```kotlin
plugins {
    application
    id("org.openjfx.javafxplugin") version "0.1.0"
}

javafx {
    version = "21"
    modules = listOf("javafx.controls", "javafx.fxml")
}

dependencies {
    implementation(project(":core"))
    implementation("io.github.mkpaz:atlantafx-base:2.0.1") // Modern themes (Primer, Dracula, Nord)
}

application {
    mainClass.set("com.organizapp.desktop.DesktopApp")
}
```

## Sharing database state

The desktop app can instantiate `new SqliteBoardRepository()` plus `KanbanService`, `ProjectService`, and `DiagramService` on that repository, connecting to the same SQLite file (`~/.organizapp/organizapp.db`) used by the web leg.

Do not duplicate domain rules in JavaFX if they already live in those services. See [architecture](../docs/architecture.md) and [data model](../docs/data-model.md).
