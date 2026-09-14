package com.organizapp.core.service;

import com.organizapp.core.domain.FinanceTransaction;
import com.organizapp.core.domain.TransactionType;
import com.organizapp.core.port.FinanceRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

public class FinanceService {
    private static final Pattern DATE = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");

    private final FinanceRepository repository;

    public FinanceService(FinanceRepository repository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
    }

    public List<FinanceTransaction> listTransactions() {
        return repository.listTransactions();
    }

    public Optional<FinanceTransaction> getTransaction(String transactionId) {
        return repository.getTransaction(transactionId);
    }

    public FinanceTransaction createTransaction(
            String occurredOn,
            String description,
            Long amountCents,
            TransactionType type,
            String category,
            String notes) {
        validate(occurredOn, description, amountCents);
        return repository.createTransaction(FinanceTransaction.create(
                occurredOn.trim(),
                description.trim(),
                amountCents,
                type,
                trimToNull(category),
                notes != null ? notes.trim() : ""
        ));
    }

    public FinanceTransaction updateTransaction(
            String transactionId,
            String occurredOn,
            String description,
            Long amountCents,
            TransactionType type,
            String category,
            String notes) {
        FinanceTransaction existing = repository.getTransaction(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found with id: " + transactionId));

        String nextDate = occurredOn != null ? occurredOn : existing.occurredOn();
        String nextDescription = description != null ? description : existing.description();
        long nextAmount = amountCents != null ? amountCents : existing.amountCents();
        validate(nextDate, nextDescription, nextAmount);

        return repository.updateTransaction(existing.withUpdates(
                nextDate.trim(),
                nextDescription.trim(),
                nextAmount,
                type,
                category != null ? category.trim() : existing.category(),
                notes != null ? notes.trim() : existing.notes()
        ));
    }

    public boolean deleteTransaction(String transactionId) {
        return repository.deleteTransaction(transactionId);
    }

    private static void validate(String occurredOn, String description, Long amountCents) {
        if (occurredOn == null || occurredOn.isBlank() || !DATE.matcher(occurredOn.trim()).matches()) {
            throw new IllegalArgumentException("Transaction date must be YYYY-MM-DD");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Transaction description cannot be blank");
        }
        if (amountCents == null || amountCents <= 0) {
            throw new IllegalArgumentException("Transaction amount must be greater than zero");
        }
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
