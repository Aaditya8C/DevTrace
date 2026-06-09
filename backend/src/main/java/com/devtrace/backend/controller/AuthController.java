package com.devtrace.backend.controller;

import com.devtrace.backend.dto.UserResponseDto;
import com.devtrace.backend.security.GithubUser;
import com.devtrace.backend.security.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SessionService sessionService;

    public AuthController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getAuthUser() {
        if (!sessionService.isAuthenticated()) {
            return ResponseEntity.ok(new UserResponseDto(false, null, null, null));
        }

        GithubUser user = sessionService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.ok(new UserResponseDto(false, null, null, null));
        }

        return ResponseEntity.ok(new UserResponseDto(
                true,
                user.getLogin(),
                user.getAvatarUrl(),
                user.getName()
        ));
    }
}
