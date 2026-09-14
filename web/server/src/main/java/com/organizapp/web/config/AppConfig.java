package com.organizapp.web.config;

import com.organizapp.core.port.BoardRepository;
import com.organizapp.core.port.DiagramRepository;
import com.organizapp.core.port.FinanceRepository;
import com.organizapp.core.port.ProjectRepository;
import com.organizapp.core.port.SeasonRepository;
import com.organizapp.core.service.DiagramService;
import com.organizapp.core.service.FinanceService;
import com.organizapp.core.service.KanbanService;
import com.organizapp.core.service.ProjectService;
import com.organizapp.core.service.SeasonService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean(destroyMethod = "close")
    public SqliteBoardRepository sqliteBoardRepository(
            @Value("${organizapp.db.url:}") String jdbcUrl) {
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            return new SqliteBoardRepository();
        }
        return new SqliteBoardRepository(jdbcUrl);
    }

    @Bean
    public BoardRepository boardRepository(SqliteBoardRepository sqliteBoardRepository) {
        return sqliteBoardRepository;
    }

    @Bean
    public ProjectRepository projectRepository(SqliteBoardRepository sqliteBoardRepository) {
        return sqliteBoardRepository;
    }

    @Bean
    public KanbanService kanbanService(BoardRepository boardRepository) {
        return new KanbanService(boardRepository);
    }

    @Bean
    public SeasonRepository seasonRepository(SqliteBoardRepository sqliteBoardRepository) {
        return sqliteBoardRepository;
    }

    @Bean
    public ProjectService projectService(
            ProjectRepository projectRepository,
            SeasonRepository seasonRepository) {
        return new ProjectService(projectRepository, seasonRepository);
    }

    @Bean
    public SeasonService seasonService(SeasonRepository seasonRepository) {
        return new SeasonService(seasonRepository);
    }

    @Bean
    public DiagramRepository diagramRepository(SqliteBoardRepository sqliteBoardRepository) {
        return sqliteBoardRepository;
    }

    @Bean
    public DiagramService diagramService(DiagramRepository diagramRepository) {
        return new DiagramService(diagramRepository);
    }

    @Bean
    public FinanceRepository financeRepository(SqliteBoardRepository sqliteBoardRepository) {
        return sqliteBoardRepository;
    }

    @Bean
    public FinanceService financeService(FinanceRepository financeRepository) {
        return new FinanceService(financeRepository);
    }
}
