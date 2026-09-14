package com.organizapp.core.storage;

import com.organizapp.core.domain.Board;
import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.domain.BoardLane;
import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.Project;
import com.organizapp.core.domain.ProjectStatus;
import com.organizapp.core.domain.TaskCard;
import com.organizapp.core.port.BoardRepository;
import com.organizapp.core.port.ProjectRepository;

import java.io.File;
import java.sql.*;
import java.time.Instant;
import java.util.*;

public class SqliteBoardRepository implements BoardRepository, ProjectRepository, AutoCloseable {
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
                         "SELECT id, name, description, status, priority, due_date, created_at, updated_at " +
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
                    "SELECT id, name, description, status, priority, due_date, created_at, updated_at " +
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
                INSERT INTO projects (id, name, description, status, priority, due_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                SET name = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = ?
                WHERE id = ?
            """)) {
                ps.setString(1, project.name());
                ps.setString(2, project.description());
                ps.setString(3, project.status().name());
                ps.setString(4, project.priority().name());
                ps.setString(5, project.dueDate());
                ps.setString(6, Instant.now().toString());
                ps.setString(7, project.id());
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
        ps.setString(7, project.createdAt().toString());
        ps.setString(8, project.updatedAt().toString());
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
