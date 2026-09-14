package com.organizapp.web.config;

import com.organizapp.core.port.BoardRepository;
import com.organizapp.core.port.DiagramRepository;
import com.organizapp.core.port.FinanceRepository;
import com.organizapp.core.port.ProjectRepository;
import com.organizapp.core.service.DiagramService;
import com.organizapp.core.service.FinanceService;
import com.organizapp.core.service.KanbanService;
import com.organizapp.core.service.ProjectService;
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
    public ProjectService projectService(ProjectRepository projectRepository) {
        return new ProjectService(projectRepository);
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
