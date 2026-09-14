package com.organizapp.core.domain;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record Board(
    String id,
    String name,
    Instant createdAt,
    List<BoardColumn> columns,
    List<BoardLane> lanes
) {
    public static Board create(String name) {
        return new Board(UUID.randomUUID().toString(), name, Instant.now(), Collections.emptyList(), Collections.emptyList());
    }

    public Board withColumns(List<BoardColumn> columns) {
        return new Board(this.id, this.name, this.createdAt, List.copyOf(columns), this.lanes);
    }

    public Board withLanes(List<BoardLane> lanes) {
        return new Board(this.id, this.name, this.createdAt, this.columns, List.copyOf(lanes));
    }
}
