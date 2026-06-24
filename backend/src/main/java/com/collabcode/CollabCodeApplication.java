package com.collabcode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.collabcode.config.SecurityProperties;
import com.collabcode.config.SandboxProperties;

@SpringBootApplication
@EnableConfigurationProperties({SecurityProperties.class, SandboxProperties.class})
public class CollabCodeApplication {
    public static void main(String[] args) {
        SpringApplication.run(CollabCodeApplication.class, args);
    }
}
