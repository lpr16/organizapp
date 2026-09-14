package com.organizapp.web.config;

import com.organizapp.core.port.BoardRepository;
import com.organizapp.core.service.KanbanService;
import com.organizapp.core.storage.SqliteBoardRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean(destroyMethod = "close")
    public BoardRepository boardRepository() {
        return new SqliteBoardRepository();
    }

    @Bean
    public KanbanService kanbanService(BoardRepository boardRepository) {
        return new KanbanService(boardRepository);
    }
}
