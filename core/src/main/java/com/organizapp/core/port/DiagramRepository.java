package com.organizapp.core.port;

import com.organizapp.core.domain.BpmnDiagram;

import java.util.List;
import java.util.Optional;

public interface DiagramRepository {
    List<BpmnDiagram> listDiagrams();
    Optional<BpmnDiagram> getDiagram(String diagramId);
    BpmnDiagram createDiagram(BpmnDiagram diagram);
    BpmnDiagram updateDiagram(BpmnDiagram diagram);
    boolean deleteDiagram(String diagramId);
}
