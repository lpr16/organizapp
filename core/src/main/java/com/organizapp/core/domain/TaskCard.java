package com.organizapp.core.domain;

import java.time.Instant;
import java.util.UUID;

public record TaskCard(
    String id,
    String columnId,
    String laneId,
    String title,
    String description,
    Priority priority,
    int position,
    String dueDate,
    Instant createdAt,
    Instant updatedAt
) {
    public static TaskCard create(
            String columnId,
            String laneId,
            String title,
            String description,
            Priority priority,
            int position,
            String dueDate) {
        Instant now = Instant.now();
        return new TaskCard(
            UUID.randomUUID().toString(),
            columnId,
            laneId,
            title != null ? title : "",
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
            this.laneId,
            title != null ? title : this.title,
            description != null ? description : this.description,
            priority != null ? priority : this.priority,
            this.position,
            dueDate != null ? dueDate : this.dueDate,
            this.createdAt,
            Instant.now()
        );
    }

    public TaskCard withLocation(String columnId, String laneId, int position) {
        return new TaskCard(
            this.id,
            columnId,
            laneId,
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
