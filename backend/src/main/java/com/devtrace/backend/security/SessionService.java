package com.devtrace.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private final OAuth2AuthorizedClientService authorizedClientService;

    public SessionService(OAuth2AuthorizedClientService authorizedClientService) {
        this.authorizedClientService = authorizedClientService;
    }

    public Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public boolean isAuthenticated() {
        Authentication auth = getAuthentication();
        return auth != null && auth.isAuthenticated() && auth instanceof OAuth2AuthenticationToken;
    }

    public OAuth2User getOAuth2User() {
        Authentication auth = getAuthentication();
        if (auth instanceof OAuth2AuthenticationToken oauthToken) {
            return oauthToken.getPrincipal();
        }
        return null;
    }

    public GithubUser getCurrentUser() {
        OAuth2User oauthUser = getOAuth2User();
        if (oauthUser == null) {
            return null;
        }

        Object idObj = oauthUser.getAttribute("id");
        String id = idObj != null ? idObj.toString() : "";
        String login = oauthUser.getAttribute("login");
        String name = oauthUser.getAttribute("name");
        String avatarUrl = oauthUser.getAttribute("avatar_url");
        String email = oauthUser.getAttribute("email");

        return GithubUser.builder()
                .id(id)
                .login(login)
                .name(name != null ? name : login)
                .avatarUrl(avatarUrl)
                .email(email)
                .build();
    }

    public String getOAuthToken() {
        Authentication auth = getAuthentication();
        if (auth instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                    oauthToken.getAuthorizedClientRegistrationId(),
                    oauthToken.getName()
            );
            if (client != null && client.getAccessToken() != null) {
                return client.getAccessToken().getTokenValue();
            }
        }
        return null;
    }
}
