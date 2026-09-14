package com.organizapp.web.controller;

import com.organizapp.core.domain.BoardColumn;
import com.organizapp.core.service.KanbanService;
import com.organizapp.web.dto.CreateColumnRequest;
import com.organizapp.web.dto.ReorderColumnsRequest;
import com.organizapp.web.dto.UpdateColumnRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/columns")
public class ColumnController {
    private final KanbanService kanbanService;

    public ColumnController(KanbanService kanbanService) {
        this.kanbanService = kanbanService;
    }

    @PostMapping
    public ResponseEntity<BoardColumn> createColumn(@Valid @RequestBody CreateColumnRequest request) {
        BoardColumn column = kanbanService.addColumn(request.boardId(), request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(column);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoardColumn> renameColumn(
            @PathVariable String id,
            @Valid @RequestBody UpdateColumnRequest request) {
        return ResponseEntity.ok(kanbanService.renameColumn(id, request.name()));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderColumns(@Valid @RequestBody ReorderColumnsRequest request) {
        kanbanService.reorderColumns(request.boardId(), request.columnIds());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable String id) {
        boolean deleted = kanbanService.deleteColumn(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
