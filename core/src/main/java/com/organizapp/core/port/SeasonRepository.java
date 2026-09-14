package com.organizapp.core.port;

import com.organizapp.core.domain.Season;

import java.util.List;
import java.util.Optional;

public interface SeasonRepository {
    List<Season> listSeasons();
    Optional<Season> getSeason(String seasonId);
    Season createSeason(Season season);
    Season updateSeason(Season season);
    boolean deleteSeason(String seasonId);
}
