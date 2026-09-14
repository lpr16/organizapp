package com.organizapp.core.port;

import com.organizapp.core.domain.Board;
import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.domain.TaskCard;

import java.util.Optional;

public interface BoardRepository {
    Board getDefaultBoard();
    Optional<Board> getBoard(String boardId);

    TaskCard createTask(TaskCard task);
    Optional<TaskCard> getTask(String taskId);
    TaskCard updateTask(TaskCard task);
    boolean deleteTask(String taskId);
    void moveTask(String taskId, String targetColumnId, int newPosition);

    BoardColumn createColumn(String boardId, String name, int position);
    boolean deleteColumn(String columnId);
}
