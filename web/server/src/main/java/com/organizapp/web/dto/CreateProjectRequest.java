package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateProjectRequest(
    @NotBlank(message = "Name is required") String name,
    String description,
    String status,
    String priority,
    String dueDate,
    String seasonId
) {}
