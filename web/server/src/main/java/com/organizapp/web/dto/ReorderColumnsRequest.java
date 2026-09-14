package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReorderColumnsRequest(
    @NotBlank(message = "Board ID is required") String boardId,
    @NotEmpty(message = "Column IDs are required") List<String> columnIds
) {}
