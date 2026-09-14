package com.organizapp.core;

import com.organizapp.core.domain.Priority;
import com.organizapp.core.domain.Project;
import com.organizapp.core.domain.ProjectStatus;
import com.organizapp.core.domain.Season;
import com.organizapp.core.service.ProjectService;
import com.organizapp.core.service.SeasonService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SeasonServiceTest {

    private SeasonService seasons;
    private ProjectService projects;

    @BeforeEach
    void setUp() {
        String uniqueDb = "jdbc:sqlite:file:seasondb_" + UUID.randomUUID() + "?mode=memory&cache=shared";
        SqliteBoardRepository repository = new SqliteBoardRepository(uniqueDb);
        seasons = new SeasonService(repository);
        projects = new ProjectService(repository, repository);
    }

    @Test
    void shouldStartWithNoSeasons() {
        assertThat(seasons.listSeasons()).isEmpty();
    }

    @Test
    void shouldCreateUpdateAndDeleteSeason() {
        Season created = seasons.createSeason(
                "Spring 2026",
                "Thesis writing block",
                "2026-03-01",
                "2026-06-30"
        );

        assertThat(created.id()).isNotBlank();
        assertThat(created.name()).isEqualTo("Spring 2026");
        assertThat(created.endsOn()).isEqualTo("2026-06-30");
        assertThat(seasons.listSeasons()).hasSize(1);

        Season updated = seasons.updateSeason(
                created.id(),
                "Spring research",
                "Updated notes",
                "2026-03-15",
                ""
        );
        assertThat(updated.name()).isEqualTo("Spring research");
        assertThat(updated.notes()).isEqualTo("Updated notes");
        assertThat(updated.startsOn()).isEqualTo("2026-03-15");
        assertThat(updated.endsOn()).isNull();

        assertThat(seasons.deleteSeason(created.id())).isTrue();
        assertThat(seasons.getSeason(created.id())).isEmpty();
    }

    @Test
    void shouldKeepProjectsWhenDeletingASeason() {
        Season season = seasons.createSeason("Fall 2026", "", "2026-09-01", "2026-12-15");
        Project assigned = projects.createProject(
                "Paper",
                "",
                ProjectStatus.ACTIVE,
                Priority.HIGH,
                null,
                season.id()
        );
        Project unassigned = projects.createProject(
                "Side notes",
                "",
                ProjectStatus.PLANNING,
                Priority.LOW,
                null,
                null
        );

        assertThat(assigned.seasonId()).isEqualTo(season.id());
        assertThat(unassigned.seasonId()).isNull();

        assertThat(seasons.deleteSeason(season.id())).isTrue();
        assertThat(projects.getProject(assigned.id()).orElseThrow().seasonId()).isNull();
        assertThat(projects.getProject(unassigned.id()).orElseThrow().id()).isEqualTo(unassigned.id());
    }

    @Test
    void shouldAssignAndUnassignProjects() {
        Season season = seasons.createSeason("Current", "", "2026-09-01", null);
        Project project = projects.createProject(
                "Unscheduled",
                "",
                ProjectStatus.PLANNING,
                Priority.MEDIUM,
                null,
                null
        );
        assertThat(project.seasonId()).isNull();

        Project assigned = projects.setProjectSeason(project.id(), season.id());
        assertThat(assigned.seasonId()).isEqualTo(season.id());

        Project cleared = projects.setProjectSeason(project.id(), null);
        assertThat(cleared.seasonId()).isNull();
    }

    @Test
    void shouldRejectBlankNameAndInvertedDates() {
        assertThatThrownBy(() -> seasons.createSeason("  ", "", "2026-09-01", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be blank");
        assertThatThrownBy(() -> seasons.createSeason("Bad", "", "2026-12-01", "2026-01-01"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("on or after");
    }
}
