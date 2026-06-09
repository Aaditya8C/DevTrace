package com.devtrace.backend.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GithubUser {
    private String id;
    private String login;
    private String name;
    private String avatarUrl;
    private String email;
}
