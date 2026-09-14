package com.organizapp.core.domain;

public enum TransactionType {
    INCOME("Income"),
    EXPENSE("Expense");

    private final String label;

    TransactionType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TransactionType fromString(String val) {
        if (val == null) return EXPENSE;
        try {
            return TransactionType.valueOf(val.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return EXPENSE;
        }
    }
}
