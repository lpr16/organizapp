package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateColumnRequest(
    @NotBlank(message = "Board ID is required") String boardId,
    @NotBlank(message = "Name is required") String name
) {}
