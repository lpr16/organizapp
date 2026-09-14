package com.organizapp.core;

import com.organizapp.core.domain.BpmnDiagram;
import com.organizapp.core.service.DiagramService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiagramServiceTest {

    private DiagramService service;

    @BeforeEach
    void setUp() {
        String uniqueDb = "jdbc:sqlite:file:diagdb_" + UUID.randomUUID() + "?mode=memory&cache=shared";
        SqliteBoardRepository repository = new SqliteBoardRepository(uniqueDb);
        service = new DiagramService(repository);
    }

    @Test
    void shouldStartWithNoDiagrams() {
        assertThat(service.listDiagrams()).isEmpty();
    }

    @Test
    void shouldCreateUpdateAndDeleteDiagram() {
        BpmnDiagram created = service.createDiagram("Hiring flow", null);
        assertThat(created.id()).isNotBlank();
        assertThat(created.name()).isEqualTo("Hiring flow");
        assertThat(created.xml()).contains("bpmn:definitions");
        assertThat(service.listDiagrams()).hasSize(1);

        BpmnDiagram updated = service.updateDiagram(created.id(), "Onboarding", created.xml());
        assertThat(updated.name()).isEqualTo("Onboarding");

        assertThat(service.deleteDiagram(created.id())).isTrue();
        assertThat(service.getDiagram(created.id())).isEmpty();
    }

    @Test
    void shouldRejectBlankName() {
        assertThatThrownBy(() -> service.createDiagram("  ", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be blank");
    }
}
