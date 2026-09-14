package com.organizapp.core.domain;

public enum ProjectStatus {
    PLANNING("Planning"),
    ACTIVE("Active"),
    ON_HOLD("On Hold"),
    COMPLETED("Completed");

    private final String label;

    ProjectStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static ProjectStatus fromString(String val) {
        if (val == null) return PLANNING;
        try {
            return ProjectStatus.valueOf(val.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PLANNING;
        }
    }
}
