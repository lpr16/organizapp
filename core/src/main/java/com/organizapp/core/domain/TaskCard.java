package com.organizapp.core.domain;

import java.time.Instant;
import java.util.UUID;

public record TaskCard(
    String id,
    String columnId,
    String title,
    String description,
    Priority priority,
    int position,
    String dueDate,
    Instant createdAt,
    Instant updatedAt
) {
    public static TaskCard create(String columnId, String title, String description, Priority priority, int position, String dueDate) {
        Instant now = Instant.now();
        return new TaskCard(
            UUID.randomUUID().toString(),
            columnId,
            title,
            description != null ? description : "",
            priority != null ? priority : Priority.MEDIUM,
            position,
            dueDate,
            now,
            now
        );
    }

    public TaskCard withUpdates(String title, String description, Priority priority, String dueDate) {
        return new TaskCard(
            this.id,
            this.columnId,
            title != null ? title : this.title,
            description != null ? description : this.description,
            priority != null ? priority : this.priority,
            this.position,
            dueDate != null ? dueDate : this.dueDate,
            this.createdAt,
            Instant.now()
        );
    }

    public TaskCard withLocation(String columnId, int position) {
        return new TaskCard(
            this.id,
            columnId,
            this.title,
            this.description,
            this.priority,
            position,
            this.dueDate,
            this.createdAt,
            Instant.now()
        );
    }
}
