package com.organizapp.web.controller;

import com.organizapp.core.domain.Board;
import com.organizapp.core.service.KanbanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/board")
public class BoardController {
    private final KanbanService kanbanService;

    public BoardController(KanbanService kanbanService) {
        this.kanbanService = kanbanService;
    }

    @GetMapping
    public ResponseEntity<Board> getDefaultBoard() {
        return ResponseEntity.ok(kanbanService.getDefaultBoard());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoard(@PathVariable String id) {
        return kanbanService.getBoard(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
