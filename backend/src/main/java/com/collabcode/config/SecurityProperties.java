package com.collabcode.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;

@ConfigurationProperties(prefix = "collabcode.security")
public class SecurityProperties {

    private final String jwtSecret;
    private final long jwtExpirationSeconds;
    private final long refreshTokenExpirationDays;
    private final String serviceJwtSecret;

    @ConstructorBinding
    public SecurityProperties(String jwtSecret, long jwtExpirationSeconds,
                               long refreshTokenExpirationDays, String serviceJwtSecret) {
        this.jwtSecret = jwtSecret;
        this.jwtExpirationSeconds = jwtExpirationSeconds;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
        this.serviceJwtSecret = serviceJwtSecret;
    }

    public String getJwtSecret() { return jwtSecret; }
    public long getJwtExpirationSeconds() { return jwtExpirationSeconds; }
    public long getRefreshTokenExpirationDays() { return refreshTokenExpirationDays; }
    public String getServiceJwtSecret() { return serviceJwtSecret; }
}
