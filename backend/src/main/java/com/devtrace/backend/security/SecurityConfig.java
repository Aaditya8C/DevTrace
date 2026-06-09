package com.devtrace.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler successHandler;
    private final OAuth2LoginFailureHandler failureHandler;

    public SecurityConfig(OAuth2LoginSuccessHandler successHandler, OAuth2LoginFailureHandler failureHandler) {
        this.successHandler = successHandler;
        this.failureHandler = failureHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // relies on CorsConfig bean defined in the package
            .csrf(csrf -> csrf.disable()) // disable CSRF for REST integration
            .authorizeHttpRequests(auth -> auth
                // Allow actuator and health checks
                .requestMatchers("/api/health", "/actuator/**").permitAll()
                // Allow public analysis endpoints (checked internally for private scopes)
                .requestMatchers("/api/analysis/start", "/api/analysis/*/status", "/api/analysis/*/result", "/api/analysis/verify").permitAll()
                // Auth me check is public
                .requestMatchers("/api/auth/me").permitAll()
                // Secure GitHub operations
                .requestMatchers("/api/github/**").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .successHandler(successHandler)
                .failureHandler(failureHandler)
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(200); // respond HTTP 200 OK for SPAs
                })
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }
}
