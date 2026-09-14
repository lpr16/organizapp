package com.organizapp.core.storage;

import com.organizapp.core.domain.Board;
import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.TaskCard;
import com.organizapp.core.port.BoardRepository;

import java.io.File;
import java.sql.*;
import java.time.Instant;
import java.util.*;

public class SqliteBoardRepository implements BoardRepository, AutoCloseable {
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
            }

            seedDefaultBoardIfEmpty(conn);
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

            return Optional.of(new Board(boardId, boardName, createdAt, columns));
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching board " + boardId, e);
        }
    }

    private List<TaskCard> getTasksForColumn(Connection conn, String columnId) throws SQLException {
        List<TaskCard> tasks = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT id, column_id, title, description, priority, position, due_date, created_at, updated_at " +
                "FROM task_cards WHERE column_id = ? ORDER BY position ASC")) {
            ps.setString(1, columnId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    tasks.add(new TaskCard(
                        rs.getString("id"),
                        rs.getString("column_id"),
                        rs.getString("title"),
                        rs.getString("description"),
                        Priority.fromString(rs.getString("priority")),
                        rs.getInt("position"),
                        rs.getString("due_date"),
                        Instant.parse(rs.getString("created_at")),
                        Instant.parse(rs.getString("updated_at"))
                    ));
                }
            }
        }
        return tasks;
    }

    @Override
    public synchronized TaskCard createTask(TaskCard task) {
        try {
            Connection conn = getConnection();
            int nextPos = 0;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COALESCE(MAX(position), -1) + 1 FROM task_cards WHERE column_id = ?")) {
                ps.setString(1, task.columnId());
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        nextPos = rs.getInt(1);
                    }
                }
            }

            TaskCard finalTask = task.withLocation(task.columnId(), nextPos);
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO task_cards (id, column_id, title, description, priority, position, due_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """)) {
                ps.setString(1, finalTask.id());
                ps.setString(2, finalTask.columnId());
                ps.setString(3, finalTask.title());
                ps.setString(4, finalTask.description());
                ps.setString(5, finalTask.priority().name());
                ps.setInt(6, finalTask.position());
                ps.setString(7, finalTask.dueDate());
                ps.setString(8, finalTask.createdAt().toString());
                ps.setString(9, finalTask.updatedAt().toString());
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
                    "SELECT id, column_id, title, description, priority, position, due_date, created_at, updated_at " +
                    "FROM task_cards WHERE id = ?")) {
                ps.setString(1, taskId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        return Optional.of(new TaskCard(
                            rs.getString("id"),
                            rs.getString("column_id"),
                            rs.getString("title"),
                            rs.getString("description"),
                            Priority.fromString(rs.getString("priority")),
                            rs.getInt("position"),
                            rs.getString("due_date"),
                            Instant.parse(rs.getString("created_at")),
                            Instant.parse(rs.getString("updated_at"))
                        ));
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
                        "UPDATE task_cards SET position = position - 1 WHERE column_id = ? AND position > ?")) {
                    ps.setString(1, card.columnId());
                    ps.setInt(2, card.position());
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
    public synchronized void moveTask(String taskId, String targetColumnId, int newPosition) {
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
                int oldPosition = card.position();

                if (srcColumnId.equals(targetColumnId)) {
                    if (oldPosition == newPosition) {
                        conn.rollback();
                        return;
                    }
                    if (oldPosition < newPosition) {
                        try (PreparedStatement ps = conn.prepareStatement(
                                "UPDATE task_cards SET position = position - 1 " +
                                "WHERE column_id = ? AND position > ? AND position <= ?")) {
                            ps.setString(1, srcColumnId);
                            ps.setInt(2, oldPosition);
                            ps.setInt(3, newPosition);
                            ps.executeUpdate();
                        }
                    } else {
                        try (PreparedStatement ps = conn.prepareStatement(
                                "UPDATE task_cards SET position = position + 1 " +
                                "WHERE column_id = ? AND position >= ? AND position < ?")) {
                            ps.setString(1, srcColumnId);
                            ps.setInt(2, newPosition);
                            ps.setInt(3, oldPosition);
                            ps.executeUpdate();
                        }
                    }
                } else {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE task_cards SET position = position - 1 " +
                            "WHERE column_id = ? AND position > ?")) {
                        ps.setString(1, srcColumnId);
                        ps.setInt(2, oldPosition);
                        ps.executeUpdate();
                    }

                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE task_cards SET position = position + 1 " +
                            "WHERE column_id = ? AND position >= ?")) {
                        ps.setString(1, targetColumnId);
                        ps.setInt(2, newPosition);
                        ps.executeUpdate();
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE task_cards SET column_id = ?, position = ?, updated_at = ? WHERE id = ?")) {
                    ps.setString(1, targetColumnId);
                    ps.setInt(2, newPosition);
                    ps.setString(3, Instant.now().toString());
                    ps.setString(4, taskId);
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
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM board_columns WHERE id = ?")) {
                ps.setString(1, columnId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting column " + columnId, e);
        }
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
