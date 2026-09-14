package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTaskRequest(
    @NotBlank(message = "Title is required") String title,
    String description,
    String priority,
    String dueDate
) {}
