package com.organizapp.core;

import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.Project;
import com.organizapp.core.domain.ProjectStatus;
import com.organizapp.core.service.ProjectService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProjectServiceTest {

    private ProjectService service;

    @BeforeEach
    void setUp() {
        String uniqueDb = "jdbc:sqlite:file:projdb_" + UUID.randomUUID() + "?mode=memory&cache=shared";
        SqliteBoardRepository repository = new SqliteBoardRepository(uniqueDb);
        service = new ProjectService(repository, repository);
    }

    @Test
    void shouldSeedWelcomeProjectWhenEmpty() {
        assertThat(service.listProjects()).hasSize(1);
        Project seeded = service.listProjects().get(0);
        assertThat(seeded.name()).isEqualTo("OrganizApp workspace");
        assertThat(seeded.status()).isEqualTo(ProjectStatus.ACTIVE);
    }

    @Test
    void shouldCreateProject() {
        Project created = service.createProject(
                "Desktop client",
                "JavaFX shell around :core",
                ProjectStatus.PLANNING,
                Priority.HIGH,
                "2026-10-15",
                null
        );

        assertThat(created.id()).isNotBlank();
        assertThat(created.name()).isEqualTo("Desktop client");
        assertThat(created.priority()).isEqualTo(Priority.HIGH);
        assertThat(created.seasonId()).isNull();
        assertThat(service.listProjects()).hasSize(2);
    }

    @Test
    void shouldRejectBlankName() {
        assertThatThrownBy(() -> service.createProject("  ", "", ProjectStatus.ACTIVE, Priority.LOW, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be blank");
    }

    @Test
    void shouldUpdateAndDeleteProject() {
        Project created = service.createProject("Temp", "Notes", ProjectStatus.ON_HOLD, Priority.LOW, null, null);

        Project updated = service.updateProject(
                created.id(),
                "Renamed",
                "Updated notes",
                ProjectStatus.COMPLETED,
                Priority.MEDIUM,
                "2026-12-01",
                null
        );

        assertThat(updated.name()).isEqualTo("Renamed");
        assertThat(updated.status()).isEqualTo(ProjectStatus.COMPLETED);
        assertThat(updated.dueDate()).isEqualTo("2026-12-01");

        assertThat(service.deleteProject(created.id())).isTrue();
        assertThat(service.getProject(created.id())).isEmpty();
    }
}
