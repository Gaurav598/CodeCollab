package com.collabcode.auth.security;

import com.collabcode.auth.domain.AuthProvider;
import com.collabcode.auth.domain.User;
import com.collabcode.auth.repository.UserRepository;
import com.collabcode.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

/**
 * Handles the OAuth2 post-authorization callback:
 * 1. Extracts provider identity from OAuth2User.
 * 2. Finds or creates the local User record.
 * 3. Creates a Session, sets httpOnly refreshToken cookie.
 * 4. Redirects to /auth/success on the frontend.
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final String frontendUrl;

    public OAuth2SuccessHandler(UserRepository userRepository,
                                AuthService authService,
                                @Value("${collabcode.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String registrationId = resolveRegistrationId(authentication);

        String email = resolveEmail(oAuth2User, registrationId);
        String name  = oAuth2User.getAttribute("name");
        String avatar = oAuth2User.getAttribute("avatar_url");
        if (avatar == null) avatar = oAuth2User.getAttribute("picture");
        final String finalAvatar = avatar;

        AuthProvider provider = "github".equals(registrationId) ? AuthProvider.github : AuthProvider.google;

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            String username = generateUsername(name, email);
            return userRepository.save(User.createOAuth(username, email, finalAvatar, provider));
        });

        authService.issueRefreshCookie(response, user);
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/auth/success");
    }

    private String resolveEmail(OAuth2User oAuth2User, String registrationId) {
        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            throw new IllegalStateException("OAuth2 provider '" + registrationId + "' did not return an email");
        }
        return email;
    }

    private String resolveRegistrationId(Authentication authentication) {
        // Principal name carries registrationId in the standard Spring flow
        Object details = authentication.getDetails();
        if (details instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthorizationCodeAuthenticationToken token) {
            return token.getClientRegistration().getRegistrationId();
        }
        return "google";
    }

    private String generateUsername(String name, String email) {
        String base = (name != null && !name.isBlank())
                ? name.replaceAll("\\s+", "").toLowerCase()
                : email.split("@")[0];
        // Truncate to 25 chars and append 5-char random suffix to avoid collision
        base = base.replaceAll("[^a-z0-9]", "").substring(0, Math.min(base.length(), 20));
        return base + "_" + (int)(Math.random() * 90000 + 10000);
    }
}
