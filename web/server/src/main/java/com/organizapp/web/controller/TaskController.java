package com.organizapp.web.controller;

import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.TaskCard;
import com.organizapp.core.service.KanbanService;
import com.organizapp.web.dto.CreateTaskRequest;
import com.organizapp.web.dto.MoveTaskRequest;
import com.organizapp.web.dto.UpdateTaskRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final KanbanService kanbanService;

    public TaskController(KanbanService kanbanService) {
        this.kanbanService = kanbanService;
    }

    @PostMapping
    public ResponseEntity<TaskCard> createTask(@Valid @RequestBody CreateTaskRequest request) {
        Priority priority = Priority.fromString(request.priority());
        TaskCard created = kanbanService.createTask(
                request.columnId(),
                request.title(),
                request.description(),
                priority,
                request.dueDate()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskCard> updateTask(
            @PathVariable String id,
            @Valid @RequestBody UpdateTaskRequest request) {
        Priority priority = Priority.fromString(request.priority());
        TaskCard updated = kanbanService.updateTask(
                id,
                request.title(),
                request.description(),
                priority,
                request.dueDate()
        );
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<Void> moveTask(
            @PathVariable String id,
            @Valid @RequestBody MoveTaskRequest request) {
        kanbanService.moveTask(id, request.targetColumnId(), request.newPosition());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
        boolean deleted = kanbanService.deleteTask(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
