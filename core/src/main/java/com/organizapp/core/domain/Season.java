package com.organizapp.core.domain;

import java.time.Instant;
import java.util.UUID;

public record Season(
    String id,
    String name,
    String notes,
    String startsOn,
    String endsOn,
    Instant createdAt,
    Instant updatedAt
) {
    public static Season create(String name, String notes, String startsOn, String endsOn) {
        Instant now = Instant.now();
        return new Season(
            UUID.randomUUID().toString(),
            name,
            notes != null ? notes : "",
            startsOn,
            endsOn,
            now,
            now
        );
    }

    public Season withUpdates(String name, String notes, String startsOn, String endsOn) {
        return new Season(
            this.id,
            name != null ? name : this.name,
            notes != null ? notes : this.notes,
            startsOn != null ? startsOn : this.startsOn,
            endsOn,
            this.createdAt,
            Instant.now()
        );
    }
}
