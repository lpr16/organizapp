package com.organizapp.core.service;

import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.Project;
import com.organizapp.core.domain.ProjectStatus;
import com.organizapp.core.port.ProjectRepository;
import com.organizapp.core.port.SeasonRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class ProjectService {
    private final ProjectRepository repository;
    private final SeasonRepository seasonRepository;

    public ProjectService(ProjectRepository repository, SeasonRepository seasonRepository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.seasonRepository = Objects.requireNonNull(seasonRepository, "seasonRepository must not be null");
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
            String dueDate,
            String seasonId) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Project name cannot be blank");
        }
        String assignedSeason = trimToNull(seasonId);
        requireSeason(assignedSeason);
        Project project = Project.create(
                name.trim(),
                description,
                status,
                priority,
                dueDate,
                assignedSeason
        );
        return repository.createProject(project);
    }

    public Project updateProject(
            String projectId,
            String name,
            String description,
            ProjectStatus status,
            Priority priority,
            String dueDate,
            String seasonId) {
        Project existing = repository.getProject(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + projectId));

        if (name != null && name.isBlank()) {
            throw new IllegalArgumentException("Project name cannot be blank");
        }

        String assignedSeason = trimToNull(seasonId);
        requireSeason(assignedSeason);

        Project updated = existing.withUpdates(
                name != null ? name.trim() : existing.name(),
                description != null ? description.trim() : existing.description(),
                status != null ? status : existing.status(),
                priority != null ? priority : existing.priority(),
                dueDate != null ? dueDate.trim() : existing.dueDate(),
                assignedSeason
        );
        return repository.updateProject(updated);
    }

    public Project setProjectSeason(String projectId, String seasonId) {
        Project existing = repository.getProject(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + projectId));
        String assignedSeason = trimToNull(seasonId);
        requireSeason(assignedSeason);
        return repository.updateProject(existing.withSeason(assignedSeason));
    }

    public boolean deleteProject(String projectId) {
        return repository.deleteProject(projectId);
    }

    private void requireSeason(String seasonId) {
        if (seasonId == null) return;
        if (seasonRepository.getSeason(seasonId).isEmpty()) {
            throw new IllegalArgumentException("Season not found with id: " + seasonId);
        }
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
