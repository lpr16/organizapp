package com.organizapp.core.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FinanceTransaction(
    String id,
    String occurredOn,
    String description,
    long amountCents,
    TransactionType type,
    String category,
    String notes,
    Instant createdAt,
    Instant updatedAt
) {
    public static final String DEFAULT_CATEGORY = "Other";

    public static final List<String> SUGGESTED_CATEGORIES = List.of(
        "Housing",
        "Food",
        "Transport",
        "Health",
        "Utilities",
        "Research",
        "Work",
        "Leisure",
        "Income",
        "Other"
    );

    public static FinanceTransaction create(
            String occurredOn,
            String description,
            long amountCents,
            TransactionType type,
            String category,
            String notes) {
        Instant now = Instant.now();
        return new FinanceTransaction(
            UUID.randomUUID().toString(),
            occurredOn,
            description,
            amountCents,
            type != null ? type : TransactionType.EXPENSE,
            category != null && !category.isBlank() ? category : DEFAULT_CATEGORY,
            notes != null ? notes : "",
            now,
            now
        );
    }

    public FinanceTransaction withUpdates(
            String occurredOn,
            String description,
            long amountCents,
            TransactionType type,
            String category,
            String notes) {
        return new FinanceTransaction(
            this.id,
            occurredOn != null ? occurredOn : this.occurredOn,
            description != null ? description : this.description,
            amountCents,
            type != null ? type : this.type,
            category != null && !category.isBlank() ? category : this.category,
            notes != null ? notes : this.notes,
            this.createdAt,
            Instant.now()
        );
    }
}
