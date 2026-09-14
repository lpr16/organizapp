package com.organizapp.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UpdateFinanceTransactionRequest(
    @NotBlank(message = "Date is required") String occurredOn,
    @NotBlank(message = "Description is required") String description,
    @NotNull(message = "Amount is required") @Positive(message = "Amount must be greater than zero") Long amountCents,
    String type,
    String category,
    String notes
) {}
