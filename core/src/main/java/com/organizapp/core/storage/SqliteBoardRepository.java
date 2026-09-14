package com.organizapp.core.storage;

import com.organizapp.core.domain.Board;
import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.domain.BoardLane;
import com.organizapp.core.domain.BpmnDiagram;
import com.organizapp.core.domain.FinanceTransaction;
import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.Project;
import com.organizapp.core.domain.ProjectStatus;
import com.organizapp.core.domain.Season;
import com.organizapp.core.domain.TaskCard;
import com.organizapp.core.domain.TransactionType;
import com.organizapp.core.port.BoardRepository;
import com.organizapp.core.port.DiagramRepository;
import com.organizapp.core.port.FinanceRepository;
import com.organizapp.core.port.ProjectRepository;
import com.organizapp.core.port.SeasonRepository;

import java.io.File;
import java.sql.*;
import java.time.Instant;
import java.util.*;

public class SqliteBoardRepository implements BoardRepository, ProjectRepository, SeasonRepository, DiagramRepository, FinanceRepository, AutoCloseable {
    private final String jdbcUrl;
    private Connection connection;

    public SqliteBoardRepository() {
        String userHome = System.getProperty("user.home");
        File dir = new File(userHome, ".organizapp");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        File dbFile = new File(dir, "organizapp.db");
        this.jdbcUrl = "jdbc:sqlite:" + dbFile.getAbsolutePath();
        initSchema();
    }

    public SqliteBoardRepository(String jdbcUrl) {
        this.jdbcUrl = jdbcUrl;
        initSchema();
    }

    private synchronized Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            connection = DriverManager.getConnection(jdbcUrl);
            try (Statement stmt = connection.createStatement()) {
                stmt.execute("PRAGMA foreign_keys = ON;");
            }
        }
        return connection;
    }

    private void initSchema() {
        try {
            Connection conn = getConnection();
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS boards (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    );
                """);

                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS board_columns (
                        id TEXT PRIMARY KEY,
                        board_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        position INTEGER NOT NULL,
                        FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
                    );
                """);

                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS board_lanes (
                        id TEXT PRIMARY KEY,
                        board_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        position INTEGER NOT NULL,
                        FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
                    );
                """);

                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS task_cards (
                        id TEXT PRIMARY KEY,
                        column_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT,
                        priority TEXT NOT NULL,
                        position INTEGER NOT NULL,
                        due_date TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY(column_id) REFERENCES board_columns(id) ON DELETE CASCADE
                    );
                """);

                if (!columnExists(conn, "task_cards", "lane_id")) {
                    stmt.execute("ALTER TABLE task_cards ADD COLUMN lane_id TEXT");
                }

                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS seasons (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        notes TEXT,
                        starts_on TEXT NOT NULL,
                        ends_on TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                """);

                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS projects (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        status TEXT NOT NULL,
                        priority TEXT NOT NULL,
                        due_date TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                """);

                if (!columnExists(conn, "projects", "season_id")) {
                    stmt.execute("ALTER TABLE projects ADD COLUMN season_id TEXT");
                }

                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS bpmn_diagrams (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        xml TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                """);

                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS finance_transactions (
                        id TEXT PRIMARY KEY,
                        occurred_on TEXT NOT NULL,
                        description TEXT NOT NULL,
                        amount_cents INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        category TEXT NOT NULL,
                        notes TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                """);
            }

            seedDefaultBoardIfEmpty(conn);
            ensureDefaultLanes(conn);
            seedDefaultProjectIfEmpty(conn);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to initialize SQLite database schema", e);
        }
    }

    private void seedDefaultBoardIfEmpty(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM boards")) {
            if (rs.next() && rs.getInt(1) == 0) {
                String boardId = "default-board";
                String now = Instant.now().toString();

                try (PreparedStatement ps = conn.prepareStatement("INSERT INTO boards (id, name, created_at) VALUES (?, ?, ?)")) {
                    ps.setString(1, boardId);
                    ps.setString(2, "My Personal Board");
                    ps.setString(3, now);
                    ps.executeUpdate();
                }

                String[] columnNames = {"To Do", "In Progress", "Done"};
                String firstColId = null;
                for (int i = 0; i < columnNames.length; i++) {
                    String colId = UUID.randomUUID().toString();
                    if (i == 0) firstColId = colId;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO board_columns (id, board_id, name, position) VALUES (?, ?, ?, ?)")) {
                        ps.setString(1, colId);
                        ps.setString(2, boardId);
                        ps.setString(3, columnNames[i]);
                        ps.setInt(4, i);
                        ps.executeUpdate();
                    }
                }

                if (firstColId != null) {
                    try (PreparedStatement ps = conn.prepareStatement("""
                        INSERT INTO task_cards (id, column_id, title, description, priority, position, due_date, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """)) {
                        ps.setString(1, UUID.randomUUID().toString());
                        ps.setString(2, firstColId);
                        ps.setString(3, "Welcome to OrganizApp! \uD83D\uDE80");
                        ps.setString(4, "This is your personal Kanban board. Drag this card to 'In Progress' or click to edit it.");
                        ps.setString(5, "HIGH");
                        ps.setInt(6, 0);
                        ps.setString(7, null);
                        ps.setString(8, now);
                        ps.setString(9, now);
                        ps.executeUpdate();
                    }
                }
            }
        }
    }

    private boolean columnExists(Connection conn, String table, String column) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("PRAGMA table_info(" + table + ")")) {
            while (rs.next()) {
                if (column.equalsIgnoreCase(rs.getString("name"))) {
                    return true;
                }
            }
        }
        return false;
    }

    private void ensureDefaultLanes(Connection conn) throws SQLException {
        List<String> boardIds = new ArrayList<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id FROM boards")) {
            while (rs.next()) {
                boardIds.add(rs.getString("id"));
            }
        }

        for (String boardId : boardIds) {
            int laneCount = 0;
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM board_lanes WHERE board_id = ?")) {
                ps.setString(1, boardId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        laneCount = rs.getInt(1);
                    }
                }
            }
            if (laneCount > 0) {
                try (PreparedStatement ps = conn.prepareStatement("""
                    UPDATE task_cards
                    SET lane_id = (
                        SELECT id FROM board_lanes WHERE board_id = ? ORDER BY position ASC LIMIT 1
                    )
                    WHERE lane_id IS NULL AND column_id IN (SELECT id FROM board_columns WHERE board_id = ?)
                """)) {
                    ps.setString(1, boardId);
                    ps.setString(2, boardId);
                    ps.executeUpdate();
                }
                continue;
            }

            String laneId = UUID.randomUUID().toString();
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO board_lanes (id, board_id, name, position) VALUES (?, ?, ?, ?)")) {
                ps.setString(1, laneId);
                ps.setString(2, boardId);
                ps.setString(3, "Main");
                ps.setInt(4, 0);
                ps.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement("""
                UPDATE task_cards
                SET lane_id = ?
                WHERE column_id IN (SELECT id FROM board_columns WHERE board_id = ?)
                  AND (lane_id IS NULL OR lane_id = '')
            """)) {
                ps.setString(1, laneId);
                ps.setString(2, boardId);
                ps.executeUpdate();
            }
        }
    }

    @Override
    public synchronized Board getDefaultBoard() {
        try {
            Connection conn = getConnection();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id FROM boards ORDER BY created_at ASC LIMIT 1")) {
                if (rs.next()) {
                    String boardId = rs.getString("id");
                    return getBoard(boardId).orElseThrow();
                }
                throw new IllegalStateException("No default board found");
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching default board", e);
        }
    }

    @Override
    public synchronized Optional<Board> getBoard(String boardId) {
        try {
            Connection conn = getConnection();
            String boardName = null;
            Instant createdAt = null;

            try (PreparedStatement ps = conn.prepareStatement("SELECT name, created_at FROM boards WHERE id = ?")) {
                ps.setString(1, boardId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        boardName = rs.getString("name");
                        createdAt = Instant.parse(rs.getString("created_at"));
                    } else {
                        return Optional.empty();
                    }
                }
            }

            List<BoardColumn> columns = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, name, position FROM board_columns WHERE board_id = ? ORDER BY position ASC")) {
                ps.setString(1, boardId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String colId = rs.getString("id");
                        String colName = rs.getString("name");
                        int pos = rs.getInt("position");

                        List<TaskCard> tasks = getTasksForColumn(conn, colId);
                        columns.add(new BoardColumn(colId, boardId, colName, pos, tasks));
                    }
                }
            }

            List<BoardLane> lanes = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, name, position FROM board_lanes WHERE board_id = ? ORDER BY position ASC")) {
                ps.setString(1, boardId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        lanes.add(new BoardLane(
                            rs.getString("id"),
                            boardId,
                            rs.getString("name"),
                            rs.getInt("position")
                        ));
                    }
                }
            }

            return Optional.of(new Board(boardId, boardName, createdAt, columns, lanes));
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching board " + boardId, e);
        }
    }

    private List<TaskCard> getTasksForColumn(Connection conn, String columnId) throws SQLException {
        List<TaskCard> tasks = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT id, column_id, lane_id, title, description, priority, position, due_date, created_at, updated_at " +
                "FROM task_cards WHERE column_id = ? ORDER BY position ASC")) {
            ps.setString(1, columnId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    tasks.add(mapTask(rs));
                }
            }
        }
        return tasks;
    }

    private TaskCard mapTask(ResultSet rs) throws SQLException {
        return new TaskCard(
            rs.getString("id"),
            rs.getString("column_id"),
            rs.getString("lane_id"),
            rs.getString("title"),
            rs.getString("description"),
            Priority.fromString(rs.getString("priority")),
            rs.getInt("position"),
            rs.getString("due_date"),
            Instant.parse(rs.getString("created_at")),
            Instant.parse(rs.getString("updated_at"))
        );
    }

    @Override
    public synchronized TaskCard createTask(TaskCard task) {
        try {
            Connection conn = getConnection();
            int nextPos = 0;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COALESCE(MAX(position), -1) + 1 FROM task_cards WHERE column_id = ? AND lane_id = ?")) {
                ps.setString(1, task.columnId());
                ps.setString(2, task.laneId());
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        nextPos = rs.getInt(1);
                    }
                }
            }

            TaskCard finalTask = task.withLocation(task.columnId(), task.laneId(), nextPos);
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO task_cards (id, column_id, lane_id, title, description, priority, position, due_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """)) {
                ps.setString(1, finalTask.id());
                ps.setString(2, finalTask.columnId());
                ps.setString(3, finalTask.laneId());
                ps.setString(4, finalTask.title());
                ps.setString(5, finalTask.description());
                ps.setString(6, finalTask.priority().name());
                ps.setInt(7, finalTask.position());
                ps.setString(8, finalTask.dueDate());
                ps.setString(9, finalTask.createdAt().toString());
                ps.setString(10, finalTask.updatedAt().toString());
                ps.executeUpdate();
            }

            return finalTask;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating task", e);
        }
    }

    @Override
    public synchronized Optional<TaskCard> getTask(String taskId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, column_id, lane_id, title, description, priority, position, due_date, created_at, updated_at " +
                    "FROM task_cards WHERE id = ?")) {
                ps.setString(1, taskId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return Optional.of(mapTask(rs));
                    }
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching task " + taskId, e);
        }
    }

    @Override
    public synchronized TaskCard updateTask(TaskCard task) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                 UPDATE task_cards
                 SET title = ?, description = ?, priority = ?, due_date = ?, updated_at = ?
                 WHERE id = ?
             """)) {
                ps.setString(1, task.title());
                ps.setString(2, task.description());
                ps.setString(3, task.priority().name());
                ps.setString(4, task.dueDate());
                ps.setString(5, Instant.now().toString());
                ps.setString(6, task.id());
                ps.executeUpdate();
            }
            return getTask(task.id()).orElse(task);
        } catch (SQLException e) {
            throw new RuntimeException("Error updating task " + task.id(), e);
        }
    }

    @Override
    public synchronized boolean deleteTask(String taskId) {
        try {
            Connection conn = getConnection();
            conn.setAutoCommit(false);
            try {
                Optional<TaskCard> cardOpt = getTask(taskId);
                if (cardOpt.isEmpty()) {
                    conn.rollback();
                    return false;
                }
                TaskCard card = cardOpt.get();

                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM task_cards WHERE id = ?")) {
                    ps.setString(1, taskId);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE task_cards SET position = position - 1 WHERE column_id = ? AND lane_id = ? AND position > ?")) {
                    ps.setString(1, card.columnId());
                    ps.setString(2, card.laneId());
                    ps.setInt(3, card.position());
                    ps.executeUpdate();
                }

                conn.commit();
                return true;
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting task " + taskId, e);
        }
    }

    @Override
    public synchronized void moveTask(String taskId, String targetColumnId, String targetLaneId, int newPosition) {
        try {
            Connection conn = getConnection();
            conn.setAutoCommit(false);
            try {
                Optional<TaskCard> cardOpt = getTask(taskId);
                if (cardOpt.isEmpty()) {
                    conn.rollback();
                    return;
                }
                TaskCard card = cardOpt.get();
                String srcColumnId = card.columnId();
                String srcLaneId = card.laneId();
                int oldPosition = card.position();
                boolean sameCell = srcColumnId.equals(targetColumnId) && Objects.equals(srcLaneId, targetLaneId);

                if (sameCell) {
                    if (oldPosition == newPosition) {
                        conn.rollback();
                        return;
                    }
                    if (oldPosition < newPosition) {
                        try (PreparedStatement ps = conn.prepareStatement(
                                "UPDATE task_cards SET position = position - 1 " +
                                "WHERE column_id = ? AND lane_id = ? AND position > ? AND position <= ?")) {
                            ps.setString(1, srcColumnId);
                            ps.setString(2, srcLaneId);
                            ps.setInt(3, oldPosition);
                            ps.setInt(4, newPosition);
                            ps.executeUpdate();
                        }
                    } else {
                        try (PreparedStatement ps = conn.prepareStatement(
                                "UPDATE task_cards SET position = position + 1 " +
                                "WHERE column_id = ? AND lane_id = ? AND position >= ? AND position < ?")) {
                            ps.setString(1, srcColumnId);
                            ps.setString(2, srcLaneId);
                            ps.setInt(3, newPosition);
                            ps.setInt(4, oldPosition);
                            ps.executeUpdate();
                        }
                    }
                } else {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE task_cards SET position = position - 1 " +
                            "WHERE column_id = ? AND lane_id = ? AND position > ?")) {
                        ps.setString(1, srcColumnId);
                        ps.setString(2, srcLaneId);
                        ps.setInt(3, oldPosition);
                        ps.executeUpdate();
                    }

                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE task_cards SET position = position + 1 " +
                            "WHERE column_id = ? AND lane_id = ? AND position >= ?")) {
                        ps.setString(1, targetColumnId);
                        ps.setString(2, targetLaneId);
                        ps.setInt(3, newPosition);
                        ps.executeUpdate();
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE task_cards SET column_id = ?, lane_id = ?, position = ?, updated_at = ? WHERE id = ?")) {
                    ps.setString(1, targetColumnId);
                    ps.setString(2, targetLaneId);
                    ps.setInt(3, newPosition);
                    ps.setString(4, Instant.now().toString());
                    ps.setString(5, taskId);
                    ps.executeUpdate();
                }

                conn.commit();
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error moving task " + taskId, e);
        }
    }

    @Override
    public synchronized BoardColumn createColumn(String boardId, String name, int position) {
        try {
            Connection conn = getConnection();
            String colId = UUID.randomUUID().toString();
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO board_columns (id, board_id, name, position) VALUES (?, ?, ?, ?)")) {
                ps.setString(1, colId);
                ps.setString(2, boardId);
                ps.setString(3, name);
                ps.setInt(4, position);
                ps.executeUpdate();
            }
            return new BoardColumn(colId, boardId, name, position, Collections.emptyList());
        } catch (SQLException e) {
            throw new RuntimeException("Error creating column", e);
        }
    }

    @Override
    public synchronized boolean deleteColumn(String columnId) {
        try {
            Connection conn = getConnection();
            String boardId = null;
            try (PreparedStatement ps = conn.prepareStatement("SELECT board_id FROM board_columns WHERE id = ?")) {
                ps.setString(1, columnId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        boardId = rs.getString("board_id");
                    }
                }
            }
            if (boardId == null) {
                return false;
            }
            int count = 0;
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM board_columns WHERE board_id = ?")) {
                ps.setString(1, boardId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        count = rs.getInt(1);
                    }
                }
            }
            if (count <= 1) {
                throw new IllegalArgumentException("Cannot delete the last column");
            }
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM board_columns WHERE id = ?")) {
                ps.setString(1, columnId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting column " + columnId, e);
        }
    }

    @Override
    public synchronized BoardColumn renameColumn(String columnId, String name) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("UPDATE board_columns SET name = ? WHERE id = ?")) {
                ps.setString(1, name);
                ps.setString(2, columnId);
                if (ps.executeUpdate() == 0) {
                    throw new IllegalArgumentException("Column not found: " + columnId);
                }
            }
            Board board = getDefaultBoard();
            return board.columns().stream()
                    .filter(c -> c.id().equals(columnId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Column not found: " + columnId));
        } catch (SQLException e) {
            throw new RuntimeException("Error renaming column " + columnId, e);
        }
    }

    @Override
    public synchronized void reorderColumns(String boardId, List<String> orderedIds) {
        reorderNamedItems("board_columns", boardId, orderedIds, "Column");
    }

    @Override
    public synchronized BoardLane createLane(String boardId, String name, int position) {
        try {
            Connection conn = getConnection();
            String laneId = UUID.randomUUID().toString();
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO board_lanes (id, board_id, name, position) VALUES (?, ?, ?, ?)")) {
                ps.setString(1, laneId);
                ps.setString(2, boardId);
                ps.setString(3, name);
                ps.setInt(4, position);
                ps.executeUpdate();
            }
            return new BoardLane(laneId, boardId, name, position);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating lane", e);
        }
    }

    @Override
    public synchronized BoardLane renameLane(String laneId, String name) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("UPDATE board_lanes SET name = ? WHERE id = ?")) {
                ps.setString(1, name);
                ps.setString(2, laneId);
                if (ps.executeUpdate() == 0) {
                    throw new IllegalArgumentException("Lane not found: " + laneId);
                }
            }
            return getDefaultBoard().lanes().stream()
                    .filter(l -> l.id().equals(laneId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Lane not found: " + laneId));
        } catch (SQLException e) {
            throw new RuntimeException("Error renaming lane " + laneId, e);
        }
    }

    @Override
    public synchronized void reorderLanes(String boardId, List<String> orderedIds) {
        reorderNamedItems("board_lanes", boardId, orderedIds, "Lane");
    }

    @Override
    public synchronized boolean deleteLane(String laneId) {
        try {
            Connection conn = getConnection();
            String boardId = null;
            try (PreparedStatement ps = conn.prepareStatement("SELECT board_id FROM board_lanes WHERE id = ?")) {
                ps.setString(1, laneId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        boardId = rs.getString("board_id");
                    }
                }
            }
            if (boardId == null) {
                return false;
            }
            int count = 0;
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM board_lanes WHERE board_id = ?")) {
                ps.setString(1, boardId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        count = rs.getInt(1);
                    }
                }
            }
            if (count <= 1) {
                throw new IllegalArgumentException("Cannot delete the last lane");
            }
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM task_cards WHERE lane_id = ?")) {
                    ps.setString(1, laneId);
                    ps.executeUpdate();
                }
                boolean deleted;
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM board_lanes WHERE id = ?")) {
                    ps.setString(1, laneId);
                    deleted = ps.executeUpdate() > 0;
                }
                conn.commit();
                return deleted;
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting lane " + laneId, e);
        }
    }

    private void reorderNamedItems(String table, String boardId, List<String> orderedIds, String label) {
        try {
            Connection conn = getConnection();
            List<String> existing = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id FROM " + table + " WHERE board_id = ? ORDER BY position ASC")) {
                ps.setString(1, boardId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        existing.add(rs.getString("id"));
                    }
                }
            }
            if (existing.size() != orderedIds.size() || !existing.containsAll(orderedIds)) {
                throw new IllegalArgumentException(label + " order must include every " + label.toLowerCase());
            }
            conn.setAutoCommit(false);
            try {
                for (int i = 0; i < orderedIds.size(); i++) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE " + table + " SET position = ? WHERE id = ? AND board_id = ?")) {
                        ps.setInt(1, i);
                        ps.setString(2, orderedIds.get(i));
                        ps.setString(3, boardId);
                        ps.executeUpdate();
                    }
                }
                conn.commit();
            } catch (SQLException ex) {
                conn.rollback();
                throw ex;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error reordering " + label.toLowerCase() + "s", e);
        }
    }

    private void seedDefaultProjectIfEmpty(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM projects")) {
            if (rs.next() && rs.getInt(1) == 0) {
                String now = Instant.now().toString();
                try (PreparedStatement ps = conn.prepareStatement("""
                    INSERT INTO projects (id, name, description, status, priority, due_date, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """)) {
                    ps.setString(1, UUID.randomUUID().toString());
                    ps.setString(2, "OrganizApp workspace");
                    ps.setString(3, "Personal home, Kanban board, and project list for this first version.");
                    ps.setString(4, ProjectStatus.ACTIVE.name());
                    ps.setString(5, Priority.HIGH.name());
                    ps.setString(6, null);
                    ps.setString(7, now);
                    ps.setString(8, now);
                    ps.executeUpdate();
                }
            }
        }
    }

    @Override
    public synchronized List<Project> listProjects() {
        try {
            Connection conn = getConnection();
            List<Project> projects = new ArrayList<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                         "SELECT id, name, description, status, priority, due_date, season_id, created_at, updated_at " +
                         "FROM projects ORDER BY created_at ASC")) {
                while (rs.next()) {
                    projects.add(mapProject(rs));
                }
            }
            return projects;
        } catch (SQLException e) {
            throw new RuntimeException("Error listing projects", e);
        }
    }

    @Override
    public synchronized Optional<Project> getProject(String projectId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, name, description, status, priority, due_date, season_id, created_at, updated_at " +
                    "FROM projects WHERE id = ?")) {
                ps.setString(1, projectId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return Optional.of(mapProject(rs));
                    }
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching project " + projectId, e);
        }
    }

    @Override
    public synchronized Project createProject(Project project) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO projects (id, name, description, status, priority, due_date, season_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """)) {
                bindProject(ps, project);
                ps.executeUpdate();
            }
            return project;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating project", e);
        }
    }

    @Override
    public synchronized Project updateProject(Project project) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                UPDATE projects
                SET name = ?, description = ?, status = ?, priority = ?, due_date = ?, season_id = ?, updated_at = ?
                WHERE id = ?
            """)) {
                ps.setString(1, project.name());
                ps.setString(2, project.description());
                ps.setString(3, project.status().name());
                ps.setString(4, project.priority().name());
                ps.setString(5, project.dueDate());
                ps.setString(6, project.seasonId());
                ps.setString(7, Instant.now().toString());
                ps.setString(8, project.id());
                ps.executeUpdate();
            }
            return getProject(project.id()).orElse(project);
        } catch (SQLException e) {
            throw new RuntimeException("Error updating project " + project.id(), e);
        }
    }

    @Override
    public synchronized boolean deleteProject(String projectId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM projects WHERE id = ?")) {
                ps.setString(1, projectId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting project " + projectId, e);
        }
    }

    private Project mapProject(ResultSet rs) throws SQLException {
        return new Project(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("description"),
            ProjectStatus.fromString(rs.getString("status")),
            Priority.fromString(rs.getString("priority")),
            rs.getString("due_date"),
            rs.getString("season_id"),
            Instant.parse(rs.getString("created_at")),
            Instant.parse(rs.getString("updated_at"))
        );
    }

    private void bindProject(PreparedStatement ps, Project project) throws SQLException {
        ps.setString(1, project.id());
        ps.setString(2, project.name());
        ps.setString(3, project.description());
        ps.setString(4, project.status().name());
        ps.setString(5, project.priority().name());
        ps.setString(6, project.dueDate());
        ps.setString(7, project.seasonId());
        ps.setString(8, project.createdAt().toString());
        ps.setString(9, project.updatedAt().toString());
    }

    @Override
    public synchronized List<Season> listSeasons() {
        try {
            Connection conn = getConnection();
            List<Season> seasons = new ArrayList<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                         "SELECT id, name, notes, starts_on, ends_on, created_at, updated_at " +
                         "FROM seasons ORDER BY starts_on DESC, name ASC")) {
                while (rs.next()) {
                    seasons.add(mapSeason(rs));
                }
            }
            return seasons;
        } catch (SQLException e) {
            throw new RuntimeException("Error listing seasons", e);
        }
    }

    @Override
    public synchronized Optional<Season> getSeason(String seasonId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, name, notes, starts_on, ends_on, created_at, updated_at " +
                    "FROM seasons WHERE id = ?")) {
                ps.setString(1, seasonId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return Optional.of(mapSeason(rs));
                    }
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching season " + seasonId, e);
        }
    }

    @Override
    public synchronized Season createSeason(Season season) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO seasons (id, name, notes, starts_on, ends_on, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """)) {
                bindSeason(ps, season);
                ps.executeUpdate();
            }
            return season;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating season", e);
        }
    }

    @Override
    public synchronized Season updateSeason(Season season) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                UPDATE seasons
                SET name = ?, notes = ?, starts_on = ?, ends_on = ?, updated_at = ?
                WHERE id = ?
            """)) {
                ps.setString(1, season.name());
                ps.setString(2, season.notes());
                ps.setString(3, season.startsOn());
                ps.setString(4, season.endsOn());
                ps.setString(5, Instant.now().toString());
                ps.setString(6, season.id());
                ps.executeUpdate();
            }
            return getSeason(season.id()).orElse(season);
        } catch (SQLException e) {
            throw new RuntimeException("Error updating season " + season.id(), e);
        }
    }

    @Override
    public synchronized boolean deleteSeason(String seasonId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement unassign = conn.prepareStatement(
                    "UPDATE projects SET season_id = NULL WHERE season_id = ?")) {
                unassign.setString(1, seasonId);
                unassign.executeUpdate();
            }
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM seasons WHERE id = ?")) {
                ps.setString(1, seasonId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting season " + seasonId, e);
        }
    }

    private Season mapSeason(ResultSet rs) throws SQLException {
        return new Season(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("notes") != null ? rs.getString("notes") : "",
            rs.getString("starts_on"),
            rs.getString("ends_on"),
            Instant.parse(rs.getString("created_at")),
            Instant.parse(rs.getString("updated_at"))
        );
    }

    private void bindSeason(PreparedStatement ps, Season season) throws SQLException {
        ps.setString(1, season.id());
        ps.setString(2, season.name());
        ps.setString(3, season.notes());
        ps.setString(4, season.startsOn());
        ps.setString(5, season.endsOn());
        ps.setString(6, season.createdAt().toString());
        ps.setString(7, season.updatedAt().toString());
    }

    @Override
    public synchronized List<BpmnDiagram> listDiagrams() {
        try {
            Connection conn = getConnection();
            List<BpmnDiagram> diagrams = new ArrayList<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                         "SELECT id, name, created_at, updated_at FROM bpmn_diagrams ORDER BY updated_at DESC")) {
                while (rs.next()) {
                    diagrams.add(new BpmnDiagram(
                        rs.getString("id"),
                        rs.getString("name"),
                        "",
                        Instant.parse(rs.getString("created_at")),
                        Instant.parse(rs.getString("updated_at"))
                    ));
                }
            }
            return diagrams;
        } catch (SQLException e) {
            throw new RuntimeException("Error listing diagrams", e);
        }
    }

    @Override
    public synchronized Optional<BpmnDiagram> getDiagram(String diagramId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, name, xml, created_at, updated_at FROM bpmn_diagrams WHERE id = ?")) {
                ps.setString(1, diagramId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return Optional.of(mapDiagram(rs));
                    }
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching diagram " + diagramId, e);
        }
    }

    @Override
    public synchronized BpmnDiagram createDiagram(BpmnDiagram diagram) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO bpmn_diagrams (id, name, xml, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """)) {
                ps.setString(1, diagram.id());
                ps.setString(2, diagram.name());
                ps.setString(3, diagram.xml());
                ps.setString(4, diagram.createdAt().toString());
                ps.setString(5, diagram.updatedAt().toString());
                ps.executeUpdate();
            }
            return diagram;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating diagram", e);
        }
    }

    @Override
    public synchronized BpmnDiagram updateDiagram(BpmnDiagram diagram) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                UPDATE bpmn_diagrams
                SET name = ?, xml = ?, updated_at = ?
                WHERE id = ?
            """)) {
                ps.setString(1, diagram.name());
                ps.setString(2, diagram.xml());
                ps.setString(3, Instant.now().toString());
                ps.setString(4, diagram.id());
                ps.executeUpdate();
            }
            return getDiagram(diagram.id()).orElse(diagram);
        } catch (SQLException e) {
            throw new RuntimeException("Error updating diagram " + diagram.id(), e);
        }
    }

    @Override
    public synchronized boolean deleteDiagram(String diagramId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM bpmn_diagrams WHERE id = ?")) {
                ps.setString(1, diagramId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting diagram " + diagramId, e);
        }
    }

    private BpmnDiagram mapDiagram(ResultSet rs) throws SQLException {
        return new BpmnDiagram(
            rs.getString("id"),
            rs.getString("name"),
            rs.getString("xml"),
            Instant.parse(rs.getString("created_at")),
            Instant.parse(rs.getString("updated_at"))
        );
    }

    @Override
    public synchronized List<FinanceTransaction> listTransactions() {
        try {
            Connection conn = getConnection();
            List<FinanceTransaction> transactions = new ArrayList<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(
                         "SELECT id, occurred_on, description, amount_cents, type, category, notes, created_at, updated_at " +
                         "FROM finance_transactions ORDER BY occurred_on DESC, created_at DESC")) {
                while (rs.next()) {
                    transactions.add(mapTransaction(rs));
                }
            }
            return transactions;
        } catch (SQLException e) {
            throw new RuntimeException("Error listing finance transactions", e);
        }
    }

    @Override
    public synchronized Optional<FinanceTransaction> getTransaction(String transactionId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, occurred_on, description, amount_cents, type, category, notes, created_at, updated_at " +
                    "FROM finance_transactions WHERE id = ?")) {
                ps.setString(1, transactionId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return Optional.of(mapTransaction(rs));
                    }
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching finance transaction " + transactionId, e);
        }
    }

    @Override
    public synchronized FinanceTransaction createTransaction(FinanceTransaction transaction) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO finance_transactions
                    (id, occurred_on, description, amount_cents, type, category, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """)) {
                ps.setString(1, transaction.id());
                ps.setString(2, transaction.occurredOn());
                ps.setString(3, transaction.description());
                ps.setLong(4, transaction.amountCents());
                ps.setString(5, transaction.type().name());
                ps.setString(6, transaction.category());
                ps.setString(7, transaction.notes());
                ps.setString(8, transaction.createdAt().toString());
                ps.setString(9, transaction.updatedAt().toString());
                ps.executeUpdate();
            }
            return transaction;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating finance transaction", e);
        }
    }

    @Override
    public synchronized FinanceTransaction updateTransaction(FinanceTransaction transaction) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("""
                UPDATE finance_transactions
                SET occurred_on = ?, description = ?, amount_cents = ?, type = ?, category = ?, notes = ?, updated_at = ?
                WHERE id = ?
            """)) {
                ps.setString(1, transaction.occurredOn());
                ps.setString(2, transaction.description());
                ps.setLong(3, transaction.amountCents());
                ps.setString(4, transaction.type().name());
                ps.setString(5, transaction.category());
                ps.setString(6, transaction.notes());
                ps.setString(7, Instant.now().toString());
                ps.setString(8, transaction.id());
                ps.executeUpdate();
            }
            return getTransaction(transaction.id()).orElse(transaction);
        } catch (SQLException e) {
            throw new RuntimeException("Error updating finance transaction " + transaction.id(), e);
        }
    }

    @Override
    public synchronized boolean deleteTransaction(String transactionId) {
        try {
            Connection conn = getConnection();
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM finance_transactions WHERE id = ?")) {
                ps.setString(1, transactionId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting finance transaction " + transactionId, e);
        }
    }

    private FinanceTransaction mapTransaction(ResultSet rs) throws SQLException {
        return new FinanceTransaction(
            rs.getString("id"),
            rs.getString("occurred_on"),
            rs.getString("description"),
            rs.getLong("amount_cents"),
            TransactionType.fromString(rs.getString("type")),
            rs.getString("category"),
            rs.getString("notes") != null ? rs.getString("notes") : "",
            Instant.parse(rs.getString("created_at")),
            Instant.parse(rs.getString("updated_at"))
        );
    }

    @Override
    public synchronized void close() {
        if (connection != null) {
            try {
                if (!connection.isClosed()) {
                    connection.close();
                }
            } catch (SQLException ignored) {
            }
        }
    }
}
