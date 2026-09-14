package com.organizapp.web.controller;

import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.Project;
import com.organizapp.core.domain.ProjectStatus;
import com.organizapp.core.service.ProjectService;
import com.organizapp.web.dto.CreateProjectRequest;
import com.organizapp.web.dto.UpdateProjectRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> listProjects() {
        return ResponseEntity.ok(projectService.listProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable String id) {
        return projectService.getProject(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@Valid @RequestBody CreateProjectRequest request) {
        Project created = projectService.createProject(
                request.name(),
                request.description(),
                ProjectStatus.fromString(request.status()),
                Priority.fromString(request.priority()),
                request.dueDate()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(
            @PathVariable String id,
            @Valid @RequestBody UpdateProjectRequest request) {
        Project updated = projectService.updateProject(
                id,
                request.name(),
                request.description(),
                ProjectStatus.fromString(request.status()),
                Priority.fromString(request.priority()),
                request.dueDate()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        boolean deleted = projectService.deleteProject(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
