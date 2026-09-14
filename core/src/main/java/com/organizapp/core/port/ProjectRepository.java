package com.organizapp.core.port;

import com.organizapp.core.domain.Project;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository {
    List<Project> listProjects();
    Optional<Project> getProject(String projectId);
    Project createProject(Project project);
    Project updateProject(Project project);
    boolean deleteProject(String projectId);
}
