package com.organizapp.core.domain;

import java.time.Instant;
import java.util.UUID;

public record BpmnDiagram(
    String id,
    String name,
    String xml,
    Instant createdAt,
    Instant updatedAt
) {
    public static final String EMPTY_XML = """
        <?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                          xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                          xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                          id="Definitions_1"
                          targetNamespace="http://organizapp.local/bpmn">
          <bpmn:process id="Process_1" isExecutable="false">
            <bpmn:startEvent id="StartEvent_1" name="Start" />
          </bpmn:process>
          <bpmndi:BPMNDiagram id="BPMNDiagram_1">
            <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
              <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
                <dc:Bounds x="180" y="150" width="36" height="36" />
              </bpmndi:BPMNShape>
            </bpmndi:BPMNPlane>
          </bpmndi:BPMNDiagram>
        </bpmn:definitions>
        """;

    public static BpmnDiagram create(String name, String xml) {
        Instant now = Instant.now();
        return new BpmnDiagram(
            UUID.randomUUID().toString(),
            name,
            xml != null && !xml.isBlank() ? xml : EMPTY_XML,
            now,
            now
        );
    }

    public BpmnDiagram withUpdates(String name, String xml) {
        return new BpmnDiagram(
            this.id,
            name != null ? name : this.name,
            xml != null ? xml : this.xml,
            this.createdAt,
            Instant.now()
        );
    }

    public BpmnDiagram withoutXml() {
        return new BpmnDiagram(this.id, this.name, "", this.createdAt, this.updatedAt);
    }
}
