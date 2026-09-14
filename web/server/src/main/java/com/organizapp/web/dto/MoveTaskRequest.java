package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MoveTaskRequest(
    @NotBlank(message = "Target column ID is required") String targetColumnId,
    @NotNull(message = "New position is required") Integer newPosition
) {}
