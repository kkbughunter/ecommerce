package com.astraval.ecommercebackend.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("E-Commerce API")
                        .version("1.0")
                        .description("Single Vendor E-Commerce Backend APIs"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
                .group("auth")
                .pathsToMatch("/api/auth/**")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("admin")
                .pathsToMatch("/api/admin/**")
                .build();
    }

    @Bean
    public GroupedOpenApi productApi() {
        return GroupedOpenApi.builder()
                .group("product")
                .pathsToMatch("/api/products/**", "/api/categories/**")
                .build();
    }

    @Bean
    public GroupedOpenApi orderApi() {
        return GroupedOpenApi.builder()
                .group("order")
                .pathsToMatch("/api/orders/**", "/api/checkout/**", "/api/cart/**")
                .build();
    }

    @Bean
    public GroupedOpenApi paymentApi() {
            return GroupedOpenApi.builder()
                            .group("payment")
                            .pathsToMatch("/api/payment/**", "/api/webhook/**")
                            .build();
    }

    @Bean
    public GroupedOpenApi customerApi() {
            return GroupedOpenApi.builder()
                            .group("Customer")
                            .pathsToMatch("/api/customers/**")
                            .build();
    }
}
