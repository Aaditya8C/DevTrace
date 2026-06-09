package com.devtrace.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubRepoDto {
    private String name;
    private String owner;
    private boolean isPrivate;
    private String cloneUrl;
}
