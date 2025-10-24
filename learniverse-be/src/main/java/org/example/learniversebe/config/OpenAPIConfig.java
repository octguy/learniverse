package org.example.learniversebe.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI().info(new Info()
                        .title("OpenAPI Documentation")
                        .version("1.0.0")
                        .description("This is the OpenAPI Documentation")
                        .license(new License().name("API License").url("facebook.com")))
                .servers(List.of(new Server().url("http://localhost:8080").description("Local Server")));
    }

    @Bean
    public GroupedOpenApi groupedOpenApi() {
        return GroupedOpenApi.builder()
                .group("group")
                .packagesToScan("org.example.learniversebe.controller")
                .build();
    }
}
