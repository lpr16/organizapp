package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSeasonRequest(
    @NotBlank(message = "Name is required") String name,
    String notes,
    @NotBlank(message = "Start date is required") String startsOn,
    String endsOn
) {}
