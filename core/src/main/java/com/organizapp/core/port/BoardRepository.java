package com.organizapp.core.port;

import com.organizapp.core.domain.Board;
import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.domain.BoardLane;
import com.organizapp.core.domain.TaskCard;

import java.util.List;
import java.util.Optional;

public interface BoardRepository {
    Board getDefaultBoard();
    Optional<Board> getBoard(String boardId);

    TaskCard createTask(TaskCard task);
    Optional<TaskCard> getTask(String taskId);
    TaskCard updateTask(TaskCard task);
    boolean deleteTask(String taskId);
    void moveTask(String taskId, String targetColumnId, String targetLaneId, int newPosition);

    BoardColumn createColumn(String boardId, String name, int position);
    BoardColumn renameColumn(String columnId, String name);
    void reorderColumns(String boardId, List<String> orderedIds);
    boolean deleteColumn(String columnId);

    BoardLane createLane(String boardId, String name, int position);
    BoardLane renameLane(String laneId, String name);
    void reorderLanes(String boardId, List<String> orderedIds);
    boolean deleteLane(String laneId);
}
