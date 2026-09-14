package com.organizapp.core.service;

import com.organizapp.core.domain.Board;
import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.domain.BoardLane;
import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.TaskCard;
import com.organizapp.core.port.BoardRepository;
import com.organizapp.core.port.ProjectRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class KanbanService {
    private final BoardRepository repository;
    private final ProjectRepository projectRepository;

    public KanbanService(BoardRepository repository, ProjectRepository projectRepository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.projectRepository = Objects.requireNonNull(projectRepository, "projectRepository must not be null");
    }

    public Board getDefaultBoard() {
        return repository.getDefaultBoard();
    }

    public Optional<Board> getBoard(String boardId) {
        if (boardId == null || boardId.isBlank()) {
            return Optional.of(getDefaultBoard());
        }
        return repository.getBoard(boardId);
    }

    public TaskCard createTask(
            String columnId,
            String laneId,
            String title,
            String description,
            Priority priority,
            String dueDate,
            String projectId) {
        if (columnId == null || columnId.isBlank()) {
            throw new IllegalArgumentException("columnId cannot be blank");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Task title cannot be blank");
        }
        String assignedProject = trimToNull(projectId);
        requireProject(assignedProject);
        String resolvedLane = resolveLaneId(laneId);
        TaskCard card = TaskCard.create(
                columnId,
                resolvedLane,
                title.trim(),
                description,
                priority,
                0,
                dueDate,
                assignedProject
        );
        return repository.createTask(card);
    }

    public Optional<TaskCard> getTask(String taskId) {
        return repository.getTask(taskId);
    }

    public TaskCard updateTask(
            String taskId,
            String title,
            String description,
            Priority priority,
            String dueDate,
            String projectId) {
        TaskCard existing = repository.getTask(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id: " + taskId));

        String assignedProject = trimToNull(projectId);
        requireProject(assignedProject);

        TaskCard updated = existing.withUpdates(
                title != null ? title.trim() : existing.title(),
                description != null ? description.trim() : existing.description(),
                priority != null ? priority : existing.priority(),
                dueDate != null ? dueDate.trim() : existing.dueDate(),
                assignedProject
        );
        return repository.updateTask(updated);
    }

    public TaskCard setTaskProject(String taskId, String projectId) {
        TaskCard existing = repository.getTask(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id: " + taskId));
        String assignedProject = trimToNull(projectId);
        requireProject(assignedProject);
        return repository.updateTask(existing.withProject(assignedProject));
    }

    public boolean deleteTask(String taskId) {
        return repository.deleteTask(taskId);
    }

    public void moveTask(String taskId, String targetColumnId, String targetLaneId, int newPosition) {
        if (newPosition < 0) {
            newPosition = 0;
        }
        String resolvedLane = resolveLaneId(targetLaneId);
        repository.moveTask(taskId, targetColumnId, resolvedLane, newPosition);
    }

    public BoardColumn addColumn(String boardId, String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Column name cannot be blank");
        }
        Board board = requireBoard(boardId);
        return repository.createColumn(boardId, name.trim(), board.columns().size());
    }

    public BoardColumn renameColumn(String columnId, String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Column name cannot be blank");
        }
        return repository.renameColumn(columnId, name.trim());
    }

    public void reorderColumns(String boardId, List<String> orderedIds) {
        if (orderedIds == null || orderedIds.isEmpty()) {
            throw new IllegalArgumentException("Column order cannot be empty");
        }
        repository.reorderColumns(boardId, orderedIds);
    }

    public boolean deleteColumn(String columnId) {
        return repository.deleteColumn(columnId);
    }

    public BoardLane addLane(String boardId, String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Lane name cannot be blank");
        }
        Board board = requireBoard(boardId);
        return repository.createLane(boardId, name.trim(), board.lanes().size());
    }

    public BoardLane renameLane(String laneId, String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Lane name cannot be blank");
        }
        return repository.renameLane(laneId, name.trim());
    }

    public void reorderLanes(String boardId, List<String> orderedIds) {
        if (orderedIds == null || orderedIds.isEmpty()) {
            throw new IllegalArgumentException("Lane order cannot be empty");
        }
        repository.reorderLanes(boardId, orderedIds);
    }

    public boolean deleteLane(String laneId) {
        return repository.deleteLane(laneId);
    }

    private Board requireBoard(String boardId) {
        return repository.getBoard(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found: " + boardId));
    }

    private void requireProject(String projectId) {
        if (projectId == null) return;
        if (projectRepository.getProject(projectId).isEmpty()) {
            throw new IllegalArgumentException("Project not found with id: " + projectId);
        }
    }

    private String resolveLaneId(String laneId) {
        if (laneId != null && !laneId.isBlank()) {
            return laneId;
        }
        List<BoardLane> lanes = repository.getDefaultBoard().lanes();
        if (lanes.isEmpty()) {
            throw new IllegalArgumentException("Board has no lanes");
        }
        return lanes.get(0).id();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
