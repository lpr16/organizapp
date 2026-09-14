package com.organizapp.web.config;

import com.organizapp.core.port.BoardRepository;
import com.organizapp.core.port.ProjectRepository;
import com.organizapp.core.service.KanbanService;
import com.organizapp.core.service.ProjectService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean(destroyMethod = "close")
    public SqliteBoardRepository sqliteBoardRepository() {
        return new SqliteBoardRepository();
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
}
