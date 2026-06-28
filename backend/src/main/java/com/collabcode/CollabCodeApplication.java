package com.collabcode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.collabcode.config.AiProperties;
import com.collabcode.config.SecurityProperties;
import com.collabcode.config.SandboxProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({SecurityProperties.class, SandboxProperties.class, AiProperties.class})
public class CollabCodeApplication {
    public static void main(String[] args) {
        SpringApplication.run(CollabCodeApplication.class, args);
    }
}
