package com.collabcode.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;

/**
 * Enables @Transactional support on MongoDB.
 *
 * Spring Data MongoDB requires a MongoTransactionManager to be declared
 * for @Transactional to have actual ACID semantics. The MongoDB deployment
 * must be a replica set (configured via --replSet in docker-compose.yml).
 *
 * Without this bean, @Transactional is silently a no-op on MongoDB.
 */
@Configuration
public class MongoConfig {

    @Bean
    public MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }
}
