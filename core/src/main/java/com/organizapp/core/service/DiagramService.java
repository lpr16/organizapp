package com.organizapp.core.service;

import com.organizapp.core.domain.BpmnDiagram;
import com.organizapp.core.port.DiagramRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class DiagramService {
    private final DiagramRepository repository;

    public DiagramService(DiagramRepository repository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
    }

    public List<BpmnDiagram> listDiagrams() {
        return repository.listDiagrams();
    }

    public Optional<BpmnDiagram> getDiagram(String diagramId) {
        return repository.getDiagram(diagramId);
    }

    public BpmnDiagram createDiagram(String name, String xml) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Diagram name cannot be blank");
        }
        return repository.createDiagram(BpmnDiagram.create(name.trim(), xml));
    }

    public BpmnDiagram updateDiagram(String diagramId, String name, String xml) {
        BpmnDiagram existing = repository.getDiagram(diagramId)
                .orElseThrow(() -> new IllegalArgumentException("Diagram not found with id: " + diagramId));
        if (name != null && name.isBlank()) {
            throw new IllegalArgumentException("Diagram name cannot be blank");
        }
        return repository.updateDiagram(existing.withUpdates(
                name != null ? name.trim() : existing.name(),
                xml != null ? xml : existing.xml()
        ));
    }

    public boolean deleteDiagram(String diagramId) {
        return repository.deleteDiagram(diagramId);
    }
}
