package com.organizapp.core;

import com.organizapp.core.domain.Board;
import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.TaskCard;
import com.organizapp.core.service.KanbanService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KanbanServiceTest {

    private KanbanService service;

    @BeforeEach
    void setUp() {
        // Use a unique in-memory database for each test
        String uniqueDb = "jdbc:sqlite:file:memdb_" + UUID.randomUUID() + "?mode=memory&cache=shared";
        SqliteBoardRepository repository = new SqliteBoardRepository(uniqueDb);
        service = new KanbanService(repository);
    }

    @Test
    void shouldSeedDefaultBoardWithColumnsAndWelcomeCard() {
        Board board = service.getDefaultBoard();
        assertThat(board).isNotNull();
        assertThat(board.name()).isEqualTo("My Personal Board");
        assertThat(board.columns()).hasSize(3);

        BoardColumn todoCol = board.columns().get(0);
        assertThat(todoCol.name()).isEqualTo("To Do");
        assertThat(todoCol.tasks()).isNotEmpty();
        assertThat(todoCol.tasks().get(0).title()).contains("Welcome to OrganizApp");
    }

    @Test
    void shouldCreateTaskInColumn() {
        Board board = service.getDefaultBoard();
        String todoColId = board.columns().get(0).id();

        TaskCard created = service.createTask(
                todoColId,
                "Implement Drag and Drop",
                "Use @dnd-kit on React frontend",
                Priority.URGENT,
                "2026-09-20"
        );

        assertThat(created.id()).isNotBlank();
        assertThat(created.title()).isEqualTo("Implement Drag and Drop");
        assertThat(created.priority()).isEqualTo(Priority.URGENT);
        assertThat(created.position()).isEqualTo(1); // after the seeded task

        Board updatedBoard = service.getDefaultBoard();
        assertThat(updatedBoard.columns().get(0).tasks()).hasSize(2);
    }

    @Test
    void shouldRejectBlankTitle() {
        Board board = service.getDefaultBoard();
        String todoColId = board.columns().get(0).id();

        assertThatThrownBy(() -> service.createTask(todoColId, "   ", "", Priority.LOW, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be blank");
    }

    @Test
    void shouldUpdateTask() {
        Board board = service.getDefaultBoard();
        TaskCard initialTask = board.columns().get(0).tasks().get(0);

        TaskCard updated = service.updateTask(
                initialTask.id(),
                "Updated Welcome Title",
                "New description text",
                Priority.LOW,
                "2026-10-01"
        );

        assertThat(updated.title()).isEqualTo("Updated Welcome Title");
        assertThat(updated.description()).isEqualTo("New description text");
        assertThat(updated.priority()).isEqualTo(Priority.LOW);
        assertThat(updated.dueDate()).isEqualTo("2026-10-01");
    }

    @Test
    void shouldMoveTaskBetweenColumns() {
        Board board = service.getDefaultBoard();
        String todoColId = board.columns().get(0).id();
        String inProgressColId = board.columns().get(1).id();
        TaskCard initialTask = board.columns().get(0).tasks().get(0);

        // Move task from To Do to In Progress
        service.moveTask(initialTask.id(), inProgressColId, 0);

        Board updatedBoard = service.getDefaultBoard();
        BoardColumn todoCol = updatedBoard.columns().stream().filter(c -> c.id().equals(todoColId)).findFirst().orElseThrow();
        BoardColumn inProgCol = updatedBoard.columns().stream().filter(c -> c.id().equals(inProgressColId)).findFirst().orElseThrow();

        assertThat(todoCol.tasks()).isEmpty();
        assertThat(inProgCol.tasks()).hasSize(1);
        assertThat(inProgCol.tasks().get(0).id()).isEqualTo(initialTask.id());
    }

    @Test
    void shouldDeleteTask() {
        Board board = service.getDefaultBoard();
        TaskCard task = board.columns().get(0).tasks().get(0);

        boolean deleted = service.deleteTask(task.id());
        assertThat(deleted).isTrue();

        Board updatedBoard = service.getDefaultBoard();
        assertThat(updatedBoard.columns().get(0).tasks()).isEmpty();
    }

    @Test
    void shouldAddNewColumn() {
        Board board = service.getDefaultBoard();
        BoardColumn newCol = service.addColumn(board.id(), "Review / QA");

        assertThat(newCol.name()).isEqualTo("Review / QA");
        assertThat(newCol.position()).isEqualTo(3);

        Board updatedBoard = service.getDefaultBoard();
        assertThat(updatedBoard.columns()).hasSize(4);
        assertThat(updatedBoard.columns().get(3).name()).isEqualTo("Review / QA");
    }
}
