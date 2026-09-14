package com.organizapp.core.domain;

import java.time.Instant;
import java.util.UUID;

public record Project(
    String id,
    String name,
    String description,
    ProjectStatus status,
    Priority priority,
    String dueDate,
    String seasonId,
    Instant createdAt,
    Instant updatedAt
) {
    public static Project create(
            String name,
            String description,
            ProjectStatus status,
            Priority priority,
            String dueDate,
            String seasonId) {
        Instant now = Instant.now();
        return new Project(
            UUID.randomUUID().toString(),
            name,
            description != null ? description : "",
            status != null ? status : ProjectStatus.PLANNING,
            priority != null ? priority : Priority.MEDIUM,
            dueDate,
            seasonId,
            now,
            now
        );
    }

    public Project withUpdates(
            String name,
            String description,
            ProjectStatus status,
            Priority priority,
            String dueDate,
            String seasonId) {
        return new Project(
            this.id,
            name != null ? name : this.name,
            description != null ? description : this.description,
            status != null ? status : this.status,
            priority != null ? priority : this.priority,
            dueDate,
            seasonId,
            this.createdAt,
            Instant.now()
        );
    }

    public Project withSeason(String seasonId) {
        return new Project(
            this.id,
            this.name,
            this.description,
            this.status,
            this.priority,
            this.dueDate,
            seasonId,
            this.createdAt,
            Instant.now()
        );
    }
}
