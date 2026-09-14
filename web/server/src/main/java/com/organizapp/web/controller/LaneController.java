package com.organizapp.web.controller;

import com.organizapp.core.domain.BoardLane;
import com.organizapp.core.service.KanbanService;
import com.organizapp.web.dto.CreateLaneRequest;
import com.organizapp.web.dto.ReorderLanesRequest;
import com.organizapp.web.dto.UpdateLaneRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lanes")
public class LaneController {
    private final KanbanService kanbanService;

    public LaneController(KanbanService kanbanService) {
        this.kanbanService = kanbanService;
    }

    @PostMapping
    public ResponseEntity<BoardLane> createLane(@Valid @RequestBody CreateLaneRequest request) {
        BoardLane lane = kanbanService.addLane(request.boardId(), request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(lane);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoardLane> renameLane(
            @PathVariable String id,
            @Valid @RequestBody UpdateLaneRequest request) {
        return ResponseEntity.ok(kanbanService.renameLane(id, request.name()));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderLanes(@Valid @RequestBody ReorderLanesRequest request) {
        kanbanService.reorderLanes(request.boardId(), request.laneIds());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLane(@PathVariable String id) {
        boolean deleted = kanbanService.deleteLane(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
