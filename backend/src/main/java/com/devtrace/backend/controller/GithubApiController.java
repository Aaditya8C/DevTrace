package com.devtrace.backend.controller;

import com.devtrace.backend.dto.GithubRepoDto;
import com.devtrace.backend.security.SessionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/github")
public class GithubApiController {
    private static final Logger log = LoggerFactory.getLogger(GithubApiController.class);

    private final SessionService sessionService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GithubApiController(SessionService sessionService, ObjectMapper objectMapper) {
        this.sessionService = sessionService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    @GetMapping("/repositories")
    public ResponseEntity<List<GithubRepoDto>> getRepositories() {
        String token = sessionService.getOAuthToken();
        if (token == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/user/repos?sort=updated&per_page=100"))
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/vnd.github+json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Failed to fetch repositories from GitHub. HTTP status: {}", response.statusCode());
                return ResponseEntity.status(response.statusCode()).build();
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            List<GithubRepoDto> repos = new ArrayList<>();

            if (rootNode.isArray()) {
                for (JsonNode node : rootNode) {
                    String name = node.get("name").asText();
                    String owner = node.get("owner").get("login").asText();
                    boolean isPrivate = node.get("private").asBoolean();
                    String cloneUrl = node.get("clone_url").asText();
                    String updatedAt = node.has("updated_at") && !node.get("updated_at").isNull() ? node.get("updated_at").asText() : "";
                    String language = node.has("language") && !node.get("language").isNull() ? node.get("language").asText() : null;

                    repos.add(new GithubRepoDto(name, owner, isPrivate, cloneUrl, updatedAt, language));
                }
            }

            return ResponseEntity.ok(repos);

        } catch (Exception e) {
            log.error("Exception occurred while fetching GitHub repositories", e);
            return ResponseEntity.status(500).build();
        }
    }
}
