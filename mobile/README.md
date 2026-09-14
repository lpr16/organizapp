# :mobile Module (Android / Kotlin)

This module will contain the native Android mobile app for **OrganizApp** using **Kotlin + Jetpack Compose**.

## Option 1: Direct Core Import (Offline-First)
Import `:core` directly as a JVM library in your Android build:

```kotlin
dependencies {
    implementation(project(":core"))
}
```
All domain models (`Board`, `TaskCard`, `Priority`), validation logic, and services from `:core` can be called natively from Kotlin.

## Option 2: REST Client (Connected)
Alternatively, point Retrofit or Ktor to your Spring Boot web server:
- `GET http://<your-ip>:8080/api/board`
- `POST http://<your-ip>:8080/api/tasks`
