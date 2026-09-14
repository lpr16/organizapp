package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTaskRequest(
    @NotBlank(message = "Column ID is required") String columnId,
    @NotBlank(message = "Title is required") String title,
    String description,
    String priority,
    String dueDate
) {}
