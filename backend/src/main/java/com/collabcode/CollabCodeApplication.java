package com.collabcode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.collabcode.config.AiProperties;
import com.collabcode.config.SecurityProperties;
import com.collabcode.config.ExecutionEngineProperties;

import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({SecurityProperties.class, ExecutionEngineProperties.class, AiProperties.class})
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class CollabCodeApplication {
    public static void main(String[] args) {
        SpringApplication.run(CollabCodeApplication.class, args);
    }
}
