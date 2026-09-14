package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReorderLanesRequest(
    @NotBlank(message = "Board ID is required") String boardId,
    @NotEmpty(message = "Lane IDs are required") List<String> laneIds
) {}
