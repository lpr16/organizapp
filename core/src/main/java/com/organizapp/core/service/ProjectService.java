package com.organizapp.core.service;

import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.Project;
import com.organizapp.core.domain.ProjectStatus;
import com.organizapp.core.port.ProjectRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class ProjectService {
    private final ProjectRepository repository;

    public ProjectService(ProjectRepository repository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
    }

    public List<Project> listProjects() {
        return repository.listProjects();
    }

    public Optional<Project> getProject(String projectId) {
        return repository.getProject(projectId);
    }

    public Project createProject(
            String name,
            String description,
            ProjectStatus status,
            Priority priority,
            String dueDate) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Project name cannot be blank");
        }
        Project project = Project.create(
                name.trim(),
                description,
                status,
                priority,
                dueDate
        );
        return repository.createProject(project);
    }

    public Project updateProject(
            String projectId,
            String name,
            String description,
            ProjectStatus status,
            Priority priority,
            String dueDate) {
        Project existing = repository.getProject(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + projectId));

        if (name != null && name.isBlank()) {
            throw new IllegalArgumentException("Project name cannot be blank");
        }

        Project updated = existing.withUpdates(
                name != null ? name.trim() : existing.name(),
                description != null ? description.trim() : existing.description(),
                status != null ? status : existing.status(),
                priority != null ? priority : existing.priority(),
                dueDate != null ? dueDate.trim() : existing.dueDate()
        );
        return repository.updateProject(updated);
    }

    public boolean deleteProject(String projectId) {
        return repository.deleteProject(projectId);
    }
}
