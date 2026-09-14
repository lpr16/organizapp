package com.organizapp.core.domain;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record BoardColumn(
    String id,
    String boardId,
    String name,
    int position,
    List<TaskCard> tasks
) {
    public static BoardColumn create(String boardId, String name, int position) {
        return new BoardColumn(UUID.randomUUID().toString(), boardId, name, position, Collections.emptyList());
    }

    public BoardColumn withTasks(List<TaskCard> tasks) {
        return new BoardColumn(this.id, this.boardId, this.name, this.position, List.copyOf(tasks));
    }

    public BoardColumn withName(String name) {
        return new BoardColumn(this.id, this.boardId, name, this.position, this.tasks);
    }
}
