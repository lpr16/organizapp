# :desktop Module (JavaFX)

This module will contain the native desktop UI for **OrganizApp** using **JavaFX 21+** and **AtlantaFX** (modern styling).

## How it connects to :core:
In `desktop/build.gradle.kts`, you import `:core`:

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

## Sharing Database State:
The desktop app can instantiate `new SqliteBoardRepository()` and `new KanbanService(repository)` directly, connecting to the exact same SQLite database file (`~/.organizapp/organizapp.db`) used by the web leg!
