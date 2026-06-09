package com.devtrace.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private boolean authenticated;
    private String username;
    private String avatarUrl;
    private String name;
}
