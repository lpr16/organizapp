package com.organizapp.core.service;

import com.organizapp.core.domain.Season;
import com.organizapp.core.port.SeasonRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

public class SeasonService {
    private static final Pattern DATE = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");

    private final SeasonRepository repository;

    public SeasonService(SeasonRepository repository) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
    }

    public List<Season> listSeasons() {
        return repository.listSeasons();
    }

    public Optional<Season> getSeason(String seasonId) {
        return repository.getSeason(seasonId);
    }

    public Season createSeason(String name, String notes, String startsOn, String endsOn) {
        validate(name, startsOn, endsOn);
        return repository.createSeason(Season.create(
                name.trim(),
                notes != null ? notes.trim() : "",
                startsOn.trim(),
                trimToNull(endsOn)
        ));
    }

    public Season updateSeason(String seasonId, String name, String notes, String startsOn, String endsOn) {
        Season existing = repository.getSeason(seasonId)
                .orElseThrow(() -> new IllegalArgumentException("Season not found with id: " + seasonId));

        String nextName = name != null ? name : existing.name();
        String nextStart = startsOn != null ? startsOn : existing.startsOn();
        String nextEnd = endsOn != null ? endsOn : existing.endsOn();
        validate(nextName, nextStart, nextEnd);

        return repository.updateSeason(existing.withUpdates(
                nextName.trim(),
                notes != null ? notes.trim() : existing.notes(),
                nextStart.trim(),
                trimToNull(nextEnd)
        ));
    }

    public boolean deleteSeason(String seasonId) {
        return repository.deleteSeason(seasonId);
    }

    private static void validate(String name, String startsOn, String endsOn) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Season name cannot be blank");
        }
        if (startsOn == null || startsOn.isBlank() || !DATE.matcher(startsOn.trim()).matches()) {
            throw new IllegalArgumentException("Season start must be YYYY-MM-DD");
        }
        String end = trimToNull(endsOn);
        if (end != null) {
            if (!DATE.matcher(end).matches()) {
                throw new IllegalArgumentException("Season end must be YYYY-MM-DD");
            }
            if (end.compareTo(startsOn.trim()) < 0) {
                throw new IllegalArgumentException("Season end must be on or after the start");
            }
        }
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
