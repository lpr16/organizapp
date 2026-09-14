package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateColumnRequest(
    @NotBlank(message = "Name is required") String name
) {}
