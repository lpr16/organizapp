plugins {
    base
}

allprojects {
    group = "com.organizapp"
    version = "0.1.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }

    tasks.withType<JavaCompile> {
        options.release.set(21)
    }
}
