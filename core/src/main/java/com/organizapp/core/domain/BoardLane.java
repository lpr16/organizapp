package com.organizapp.core.domain;

import java.util.UUID;

public record BoardLane(
    String id,
    String boardId,
    String name,
    int position
) {
    public static BoardLane create(String boardId, String name, int position) {
        return new BoardLane(UUID.randomUUID().toString(), boardId, name, position);
    }

    public BoardLane withName(String name) {
        return new BoardLane(this.id, this.boardId, name, this.position);
    }

    public BoardLane withPosition(int position) {
        return new BoardLane(this.id, this.boardId, this.name, position);
    }
}
