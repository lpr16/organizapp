package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDiagramRequest(
    @NotBlank(message = "Name is required") String name,
    String xml
) {}
