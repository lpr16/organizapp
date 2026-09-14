package com.organizapp.web.controller;

import com.organizapp.core.domain.Season;
import com.organizapp.core.service.SeasonService;
import com.organizapp.web.dto.CreateSeasonRequest;
import com.organizapp.web.dto.UpdateSeasonRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seasons")
public class SeasonController {
    private final SeasonService seasonService;

    public SeasonController(SeasonService seasonService) {
        this.seasonService = seasonService;
    }

    @GetMapping
    public ResponseEntity<List<Season>> listSeasons() {
        return ResponseEntity.ok(seasonService.listSeasons());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Season> getSeason(@PathVariable String id) {
        return seasonService.getSeason(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Season> createSeason(@Valid @RequestBody CreateSeasonRequest request) {
        Season created = seasonService.createSeason(
                request.name(),
                request.notes(),
                request.startsOn(),
                request.endsOn()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Season> updateSeason(
            @PathVariable String id,
            @Valid @RequestBody UpdateSeasonRequest request) {
        return ResponseEntity.ok(seasonService.updateSeason(
                id,
                request.name(),
                request.notes(),
                request.startsOn(),
                request.endsOn()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSeason(@PathVariable String id) {
        boolean deleted = seasonService.deleteSeason(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
