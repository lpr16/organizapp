package com.organizapp.web.controller;

import com.organizapp.core.domain.BpmnDiagram;
import com.organizapp.core.service.DiagramService;
import com.organizapp.web.dto.CreateDiagramRequest;
import com.organizapp.web.dto.UpdateDiagramRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diagrams")
public class DiagramController {
    private final DiagramService diagramService;

    public DiagramController(DiagramService diagramService) {
        this.diagramService = diagramService;
    }

    @GetMapping
    public ResponseEntity<List<BpmnDiagram>> listDiagrams() {
        return ResponseEntity.ok(diagramService.listDiagrams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BpmnDiagram> getDiagram(@PathVariable String id) {
        return diagramService.getDiagram(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BpmnDiagram> createDiagram(@Valid @RequestBody CreateDiagramRequest request) {
        BpmnDiagram created = diagramService.createDiagram(request.name(), request.xml());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BpmnDiagram> updateDiagram(
            @PathVariable String id,
            @Valid @RequestBody UpdateDiagramRequest request) {
        return ResponseEntity.ok(diagramService.updateDiagram(id, request.name(), request.xml()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiagram(@PathVariable String id) {
        boolean deleted = diagramService.deleteDiagram(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
