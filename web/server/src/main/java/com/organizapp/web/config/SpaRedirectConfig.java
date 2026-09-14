package com.organizapp.web.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SpaRedirectConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/calendar").setViewName("forward:/index.html");
        registry.addViewController("/board").setViewName("forward:/index.html");
        registry.addViewController("/projects").setViewName("forward:/index.html");
        registry.addViewController("/projects/{id}").setViewName("forward:/index.html");
        registry.addViewController("/seasons").setViewName("forward:/index.html");
        registry.addViewController("/seasons/{id}").setViewName("forward:/index.html");
        registry.addViewController("/diagrams").setViewName("forward:/index.html");
        registry.addViewController("/diagrams/{id}").setViewName("forward:/index.html");
        registry.addViewController("/finance").setViewName("forward:/index.html");
    }
}
